import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  userName: String,

  status: {
    type: String,
    enum: ["BOOKED", "CANCELLED"],
    default: "BOOKED"
  }
}, { timestamps: true });

bookingSchema.index({ item: 1, date: 1, startTime: 1, endTime: 1 });

export default mongoose.model("Booking", bookingSchema);
