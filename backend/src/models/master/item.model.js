import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    id: { type: Number },
    item_name: { type: String, required: true },
    barcode: {
      type: String,
      trim: true,
    },
    item_id: {
      type: Number,
    },
    alias: { type: String, trim: true },
    description: { type: String, trim: true },
    sale_rate: { type: Number, required: true },
    purchase_rate: { type: Number, default: 0 },
    mrp_rate: { type: Number, default: 0 },
    gst_percent: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    physical_stock: { type: Number, default: 0, min: 0 },
    logical_stock: { type: Number, default: 0 },
    threshold: { type: Number, default: 0 },
    image: { type: String },
    is_gst: { type: Number, enum: [0, 1], default: 1 },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    dept_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    hsn_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hsn",
    },
  },
  { timestamps: true, id: false },
);

itemSchema.index({ id: 1, user_id: 1 });
itemSchema.index({ barcode: 1 }, { unique: true, sparse: true });
itemSchema.index({ item_id: 1 }, { unique: true, sparse: true });

itemSchema.pre("validate", function () {
  if (
    (this.physical_stock === undefined || this.physical_stock === null) &&
    typeof this.stock === "number"
  ) {
    this.physical_stock = this.stock;
  }

  if (
    (this.stock === undefined || this.stock === null) &&
    typeof this.physical_stock === "number"
  ) {
    this.stock = this.physical_stock;
  }

  if (
    this.physical_stock !== undefined &&
    this.physical_stock !== null &&
    this.physical_stock < 0
  ) {
    this.invalidate("physical_stock", "Physical stock cannot be negative");
  }
});

export default mongoose.model("Item", itemSchema);
