import mongoose from "mongoose";

const discountFieldSchema = new mongoose.Schema(
  {
    normal: { type: Number, default: 0, min: 0 },
    special: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const labelBrandDiscountSchema = new mongoose.Schema(
  {
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    disc1: { type: discountFieldSchema, default: () => ({}) },
    disc2: { type: discountFieldSchema, default: () => ({}) },
  },
  { _id: false },
);

const labelSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    is_active: { type: Boolean, default: true },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand_discounts: { type: [labelBrandDiscountSchema], default: [] },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

labelSchema.index({ id: 1, user_id: 1 });
labelSchema.index({ name: 1, category_id: 1, user_id: 1 });
labelSchema.index({ category_id: 1, user_id: 1 });

export default mongoose.model("Label", labelSchema);
