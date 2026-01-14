import mongoose from "mongoose";

const pricingSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["STATIC", "TIERED", "COMPLIMENTARY", "DISCOUNTED", "DYNAMIC"],
    required: true
  },

  config: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const availabilitySchema = new mongoose.Schema({
  days: {
    type: [String],
    enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
  },

  timeSlots: [
    {
      start: String,
      end: String
    }
  ]
}, { _id: false });

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,
  image: String,

  parent_type: {
    type: String,
    enum: ["CATEGORY", "SUBCATEGORY"],
    required: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category"
  },

  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subcategory"
  },

  tax_applicable: Boolean,
  tax_percentage: {
    type: Number,
    min: 0,
    max: 100
  },

  pricing: pricingSchema,

  is_bookable: {
    type: Boolean,
    default: false
  },

  availability: availabilitySchema,

  addons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Addon"
  }],

  is_active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

itemSchema.index({ name: 1, category: 1 }, { unique: true, sparse: true });
itemSchema.index({ name: 1, subcategory: 1 }, { unique: true, sparse: true });

export default mongoose.model("Item", itemSchema);
