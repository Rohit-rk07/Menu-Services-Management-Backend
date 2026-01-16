import express from "express";
import * as bookingController from "../controllers/booking.controller.js";

const router = express.Router();

router.get("/availability/:itemId", bookingController.getAvailableSlots);
router.post("/", bookingController.createBooking);

export default router;
