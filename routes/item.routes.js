import express from "express";
import * as itemController from "../controllers/item.controller.js";

const router = express.Router();

router.post("/", itemController.createItem);
router.get("/", itemController.getAllItems);
router.get("/:id", itemController.getItemById);
router.put("/:id", itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

export default router;
