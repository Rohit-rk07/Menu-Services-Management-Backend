import * as itemService from "../services/item.service.js";

export const createItem = async (req, res) => {
  try {
    const item = await itemService.createItem(req.body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllItems = async (req, res) => {
  try {
    const result = await itemService.getAllItems(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getItemById = async (req, res) => {
  try {
    const item = await itemService.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const updated = await itemService.updateItem(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const deleted = await itemService.softDeleteItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({
      success: true,
      message: "Item deactivated successfully",
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
