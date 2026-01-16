import * as bookingService from "../services/booking.service.js";

export const getAvailableSlots = async (req, res) => {
  try {
    const slots = await bookingService.getAvailableSlots(
      req.params.itemId,
      req.query.date
    );

    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const booking = await bookingService.bookSlot(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
