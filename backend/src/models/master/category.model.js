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
    item_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    disc1: { type: discountFieldSchema, default: () => ({}) },
    disc2: { type: discountFieldSchema, default: () => ({}) },
  },
  { _id: false },
);

const categoryLabelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    is_active: { type: Boolean, default: true },
    brand_discounts: { type: [labelBrandDiscountSchema], default: [] },
  },
  // _id kept enabled (default) so each label gets its own ObjectId
  // Contact.label_id references this subdocument _id
);

const categorySchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    description: { type: String },
    brand_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
    labels: { type: [categoryLabelSchema], default: [] },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, id: false },
);

categorySchema.index({ id: 1, user_id: 1 });
categorySchema.index({ "labels.name": 1, user_id: 1 });

export default mongoose.model("Category", categorySchema);
