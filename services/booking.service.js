import Booking from "../models/Booking.model.js";
import Item from "../models/item.model.js";

/* ----------------- helpers ----------------- */

const isTimeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

/* ----------------- get available slots ----------------- */

export const getAvailableSlots = async (itemId, date) => {
  if (!date) throw new Error("Date is required");

  const checkDate = new Date(date);
  if (isNaN(checkDate.getTime())) throw new Error("Invalid date");

  const item = await Item.findById(itemId);
  if (!item || !item.is_active || !item.is_bookable) {
    throw new Error("Item not bookable or not found");
  }

  const day = checkDate
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  const availableDays = item.availability?.days || [];

  if (!availableDays.includes(day)) {
    return []; // not available on this day
  }

  const slots = item.availability?.timeSlots || [];

  const bookings = await Booking.find({
    item: itemId,
    date: checkDate,
    status: "BOOKED",
  });

  // remove booked slots
  const freeSlots = slots.filter((slot) => {
    return !bookings.some((b) =>
      isTimeOverlap(slot.start, slot.end, b.startTime, b.endTime)
    );
  });

  return freeSlots;
};

/* ----------------- create booking ----------------- */

export const bookSlot = async (data) => {
  const { item, date, startTime, endTime } = data;

  if (!date || !startTime || !endTime) {
    throw new Error("Date, startTime and endTime are required");
  }

  if (startTime >= endTime) {
    throw new Error("End time must be after start time");
  }

  const bookingDate = new Date(date);
  if (isNaN(bookingDate.getTime())) {
    throw new Error("Invalid date format");
  }

  const itemDoc = await Item.findById(item);
  if (!itemDoc || !itemDoc.is_active || !itemDoc.is_bookable) {
    throw new Error("Item not bookable or not found");
  }

  if (!itemDoc.availability) {
    throw new Error("Item has no availability defined");
  }

  const day = bookingDate
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();

  if (!itemDoc.availability.days.includes(day)) {
    throw new Error("Item is not available on this day");
  }

  const validSlot = itemDoc.availability.timeSlots.some(
    (s) => s.start === startTime && s.end === endTime
  );

  if (!validSlot) {
    throw new Error("Selected slot is not in item availability");
  }

  const existing = await Booking.find({
    item,
    date: bookingDate,
    status: "BOOKED",
  });

  const conflict = existing.find((b) =>
    isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  if (conflict) {
    throw new Error("Slot already booked");
  }

  return await Booking.create({ ...data, date: bookingDate });
};
