import Booking from "../models/Booking.model.js";
import Item from "../models/item.model.js";

/* ----------------- helpers ----------------- */

const isTimeOverlap = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

/* ----------------- get available slots ----------------- */

export const getAvailableSlots = async (itemId, date) => {
  const item = await Item.findById(itemId);
  if (!item || !item.is_active || !item.is_bookable) {
    throw new Error("Item not bookable or not found");
  }

  const day = new Date(date).toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const availableDays = item.availability?.days || [];

  if (!availableDays.includes(day)) {
    return []; // not available on this day
  }

  const slots = item.availability?.timeSlots || [];

  const bookings = await Booking.find({
    item: itemId,
    date: new Date(date),
    status: "BOOKED"
  });

  // remove booked slots
  const freeSlots = slots.filter(slot => {
    return !bookings.some(b =>
      isTimeOverlap(slot.start, slot.end, b.startTime, b.endTime)
    );
  });

  return freeSlots;
};

/* ----------------- create booking ----------------- */

export const bookSlot = async (data) => {
  const { item, date, startTime, endTime } = data;

  const itemDoc = await Item.findById(item);
  if (!itemDoc || !itemDoc.is_active || !itemDoc.is_bookable) {
    throw new Error("Item not bookable or not found");
  }

  const existing = await Booking.find({
    item,
    date: new Date(date),
    status: "BOOKED"
  });

  const conflict = existing.find(b =>
    isTimeOverlap(startTime, endTime, b.startTime, b.endTime)
  );

  if (conflict) {
    throw new Error("Slot already booked");
  }

  return await Booking.create(data);
};
