import * as addonService from "../services/addon.service.js";

export const createAddon = async (req, res) => {
  try {
    const addon = await addonService.createAddon(req.body);
    res.status(201).json({ success: true, data: addon });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAddonsByItem = async (req, res) => {
  try {
    const addons = await addonService.getAddonsByItem(req.params.itemId);
    res.json({ success: true, data: addons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateAddon = async (req, res) => {
  try {
    const updated = await addonService.updateAddon(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Addon not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteAddon = async (req, res) => {
  try {
    const deleted = await addonService.softDeleteAddon(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Addon not found" });
    }
    res.json({ success: true, message: "Addon deactivated", data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
