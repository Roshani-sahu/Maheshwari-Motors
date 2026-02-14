import mongoose from "mongoose";

const discountFieldSchema = new mongoose.Schema(
  {
    normal: { type: Number, default: 0, min: 0 },
    special: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const discountSchema = new mongoose.Schema(
  {
    id: { type: Number },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    discount1: { type: discountFieldSchema, default: () => ({}) },
    discount2: { type: discountFieldSchema, default: () => ({}) },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true, id: false },
);

discountSchema.index({ brand_id: 1, user_id: 1 }, { unique: true });
discountSchema.index({ id: 1, user_id: 1 });

export default mongoose.model("Discount", discountSchema);
