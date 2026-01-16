import Addon from "../models/Addon.model.js";
import Item from "../models/item.model.js";

export const createAddon = async (data) => {
  const item = await Item.findById(data.item);
  if (!item || !item.is_active) {
    throw new Error("Parent item not found or inactive");
  }

  const addon = await Addon.create(data);

  // attach addon to item
  item.addons.push(addon._id);
  await item.save();

  return addon;
};

export const getAddonsByItem = async (itemId) => {
  return await Addon.find({ item: itemId, is_active: true });
};

export const updateAddon = async (id, data) => {
  return await Addon.findByIdAndUpdate(id, data, { new: true });
};

export const softDeleteAddon = async (id) => {
  return await Addon.findByIdAndUpdate(id, { is_active: false }, { new: true });
};
