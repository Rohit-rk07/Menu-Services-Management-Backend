import Item from "../models/item.model.js";
import Category from "../models/Category.model.js";
import Subcategory from "../models/Subcategory.model.js";

/**
 * Validate parent (either category or subcategory)
 */
const validateParent = async (data) => {
  if (data.category && data.subcategory) {
    throw new Error("Item cannot belong to both category and subcategory");
  }

  if (!data.category && !data.subcategory) {
    throw new Error("Item must belong to either category or subcategory");
  }

  if (data.category) {
    const category = await Category.findById(data.category);
    if (!category) throw new Error("Parent category not found");
    if (!category.is_active) throw new Error("Parent category is inactive");

    data.parent_type = "CATEGORY";
  }

  if (data.subcategory) {
    const subcategory = await Subcategory.findById(data.subcategory).populate(
      "category"
    );
    if (!subcategory) throw new Error("Parent subcategory not found");
    if (!subcategory.is_active || !subcategory.category.is_active) {
      throw new Error("Parent category or subcategory is inactive");
    }

    data.parent_type = "SUBCATEGORY";
  }
};

/**
 * Create Item
 */
export const createItem = async (data) => {
  await validateParent(data);

  if (!data.pricing || !data.pricing.type || !data.pricing.config) {
    throw new Error("Pricing configuration is required");
  }

  const { type, config } = data.pricing;

  if (type === "COMPLIMENTARY" && config && Object.keys(config).length > 0) {
    throw new Error("Complimentary items cannot have pricing config");
  }

  if (type === "STATIC") {
    if (typeof config.price !== "number" || config.price < 0) {
      throw new Error("Static pricing requires valid price");
    }
  }

  if (type === "TIERED") {
    if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
      throw new Error("Tiered pricing requires tiers");
    }

    // check overlap
    const sorted = config.tiers.sort((a, b) => a.upTo - b.upTo);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].upTo <= sorted[i - 1].upTo) {
        throw new Error("Tier ranges must not overlap");
      }
    }
  }

  if (type === "DISCOUNTED") {
    if (config.basePrice <= 0) throw new Error("Invalid base price");

    if (config.discountType === "PERCENT" && config.discountValue > 100) {
      throw new Error("Discount percent cannot exceed 100");
    }
  }

  if (type === "DYNAMIC") {
    if (!Array.isArray(config.windows) || config.windows.length === 0) {
      throw new Error("Dynamic pricing requires time windows");
    }
  }

  return await Item.create(data);
};

/**
 * Get all items (search + filters + pagination)
 */
export const getAllItems = async (query) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
    active,
    search,
    categoryId,
    tax_applicable,
  } = query;

  const filter = {};

  if (active !== undefined) filter.is_active = active === "true";
  if (categoryId) filter.category = categoryId;
  if (tax_applicable !== undefined)
    filter.tax_applicable = tax_applicable === "true";

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  let items = await Item.find(filter)
    .populate("category", "name is_active")
    .populate("subcategory", "name is_active")
    .sort({ [sortBy]: order === "asc" ? 1 : -1 })
    .skip(skip)
    .limit(Number(limit));

  items = items.filter((i) => {
    if (i.category && !i.category.is_active) return false;
    if (i.subcategory && !i.subcategory.is_active) return false;
    return true;
  });

  const total = await Item.countDocuments(filter);

  return {
    data: items,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get single item
 */
export const getItemById = async (id) => {
  return await Item.findById(id)
    .populate("category")
    .populate("subcategory")
    .populate("addons");
};

/**
 * Update item
 */
export const updateItem = async (id, data) => {
  if (data.category || data.subcategory) {
    await validateParent(data);
  }

  return await Item.findByIdAndUpdate(id, data, { new: true });
};

/**
 * Soft delete item
 */
export const softDeleteItem = async (id) => {
  return await Item.findByIdAndUpdate(id, { is_active: false }, { new: true });
};
