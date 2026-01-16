import express from "express";
import * as addonController from "../controllers/addon.controller.js";

const router = express.Router();

router.post("/", addonController.createAddon);
router.get("/item/:itemId", addonController.getAddonsByItem);
router.put("/:id", addonController.updateAddon);
router.delete("/:id", addonController.deleteAddon);

export default router;
