import express from "express";
import * as subcategoryController from "../controllers/subcategory.controller.js";

const router = express.Router();

router.post("/", subcategoryController.createSubcategory);
router.get("/", subcategoryController.getAllSubcategories);
router.get("/:id", subcategoryController.getSubcategoryById);
router.put("/:id", subcategoryController.updateSubcategory);
router.delete("/:id", subcategoryController.deleteSubcategory);

export default router;
