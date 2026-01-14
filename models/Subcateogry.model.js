import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  image: String,
  description: String,

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  tax_applicable: {
    type: Boolean
  },

  tax_percentage: {
    type: Number,
    min: 0,
    max: 100
  },

  is_active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

subcategorySchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model("Subcategory", subcategorySchema);
