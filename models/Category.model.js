import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },

  image: String,
  description: String,

  tax_applicable: {
    type: Boolean,
    default: false
  },

  tax_percentage: {
    type: Number,
    min: 0,
    max: 100,
    required: function () {
      return this.tax_applicable === true;
    }
  },

  is_active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
