import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    id: { type: Number },
    item_name: { type: String, required: true },
    barcode: {
      type: String,
      trim: true,
      match: [
        /^[A-Za-z0-9]{10}$/,
        "Barcode must be exactly 10 alphanumeric characters",
      ],
    },
    item_id: {
      type: Number,
    },
    sale_rate: { type: Number, required: true },
    purchase_rate: { type: Number, default: 0 },
    mrp_rate: { type: Number, default: 0 },
    gst_percent: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    threshold: { type: Number, default: 0 },
    image: { type: String },

    is_gst: { type: Number, enum: [0, 1], default: 1 },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    contact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
    },
    dept_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
  },
  { timestamps: true, id: false },
);

itemSchema.index({ id: 1, user_id: 1 });
itemSchema.index({ barcode: 1 }, { unique: true, sparse: true });
itemSchema.index({ item_id: 1 }, { unique: true, sparse: true });

export default mongoose.model("Item", itemSchema);
