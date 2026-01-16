import Item from "../models/item.model.js";
import Addon from "../models/Addon.model.js";
import { resolveTax } from "./tax.service.js";

/* ------------------ Helpers ------------------ */

const applyStaticPricing = (config) => {
  return { basePrice: config.price, appliedRule: "STATIC" };
};

const applyComplimentaryPricing = () => {
  return { basePrice: 0, appliedRule: "COMPLIMENTARY" };
};

const applyDiscountedPricing = (config) => {
  let discount = 0;

  if (config.discountType === "FLAT") {
    discount = config.discountValue;
  } else if (config.discountType === "PERCENT") {
    discount = (config.basePrice * config.discountValue) / 100;
  }

  const final = Math.max(config.basePrice - discount, 0);

  return {
    basePrice: config.basePrice,
    discount,
    finalPrice: final,
    appliedRule: "DISCOUNTED"
  };
};

const applyTieredPricing = (config, duration) => {
  const tier = config.tiers
    .sort((a, b) => a.upTo - b.upTo)
    .find(t => duration <= t.upTo);

  if (!tier) throw new Error("No tier found for given duration");

  return { basePrice: tier.price, appliedRule: "TIERED" };
};

const applyDynamicPricing = (config, time) => {
  const current = config.windows.find(w => time >= w.start && time <= w.end);
  if (!current) throw new Error("Item not available at this time");

  return { basePrice: current.price, appliedRule: "DYNAMIC" };
};

/* ------------------ Main Engine ------------------ */

export const calculateItemPrice = async ({ itemId, addons = [], duration, time }) => {

  const item = await Item.findById(itemId).populate("addons");
  if (!item || !item.is_active) throw new Error("Item not found or inactive");

  let pricingResult;
  const { type, config } = item.pricing;

  switch (type) {
    case "STATIC":
      pricingResult = applyStaticPricing(config);
      break;

    case "COMPLIMENTARY":
      pricingResult = applyComplimentaryPricing();
      break;

    case "DISCOUNTED":
      pricingResult = applyDiscountedPricing(config);
      break;

    case "TIERED":
      if (!duration) throw new Error("Duration required for tiered pricing");
      pricingResult = applyTieredPricing(config, duration);
      break;

    case "DYNAMIC":
      if (!time) throw new Error("Time required for dynamic pricing");
      pricingResult = applyDynamicPricing(config, time);
      break;

    default:
      throw new Error("Invalid pricing type");
  }

  let basePrice = pricingResult.finalPrice ?? pricingResult.basePrice;
  let discount = pricingResult.discount || 0;

  /* -------- Addons -------- */
  let addonsTotal = 0;

  if (addons.length > 0) {
    const addonDocs = await Addon.find({ _id: { $in: addons }, item: itemId, is_active: true });
    addonsTotal = addonDocs.reduce((sum, a) => sum + a.price, 0);
  }

  const subtotal = basePrice + addonsTotal;

  /* -------- Tax -------- */
  const taxInfo = await resolveTax(item);

  let taxAmount = 0;
  if (taxInfo.tax_applicable) {
    taxAmount = (subtotal * taxInfo.tax_percentage) / 100;
  }

  const finalPayable = subtotal + taxAmount;

  return {
    item: item.name,
    appliedRule: pricingResult.appliedRule,
    basePrice,
    discount,
    addonsTotal,
    tax: {
      applicable: taxInfo.tax_applicable,
      percentage: taxInfo.tax_percentage,
      amount: taxAmount
    },
    grandTotal: subtotal,
    finalPayable
  };
};
