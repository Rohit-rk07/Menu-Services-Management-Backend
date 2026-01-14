import mongoose from "mongoose";

const addonSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  is_mandatory: {
    type: Boolean,
    default: false
  },

  group: String,

  is_active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

addonSchema.index({ item: 1, name: 1 }, { unique: true });

export default mongoose.model("Addon", addonSchema);
