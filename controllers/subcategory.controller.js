import * as subcategoryService from "../services/subcategory.service.js";

export const createSubcategory = async (req, res) => {
  try {
    const subcategory = await subcategoryService.createSubcategory(req.body);
    res.status(201).json({ success: true, data: subcategory });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getAllSubcategories = async (req, res) => {
  try {
    const result = await subcategoryService.getAllSubcategories(req.query);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await subcategoryService.getSubcategoryById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    res.json({ success: true, data: subcategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSubcategory = async (req, res) => {
  try {
    const updated = await subcategoryService.updateSubcategory(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSubcategory = async (req, res) => {
  try {
    const deleted = await subcategoryService.softDeleteSubcategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }
    res.json({
      success: true,
      message: "Subcategory deactivated successfully",
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
