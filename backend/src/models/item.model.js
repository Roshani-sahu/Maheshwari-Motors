import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    item_name: { type: String, required: true },
    amount: { type: Number, required: true },
    image: { type: String },
    threshold: { type: Number, default: 0 },
    gst_stock: { type: Number, default: 0 },
    nongst_stock: { type: Number, default: 0 },
    nongst_sold: { type: Number, default: 0 },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
  },
  { timestamps: true, id: false },
);

itemSchema.virtual("physical_stock").get(function () {
  return this.gst_stock + this.nongst_stock;
});

itemSchema.virtual("nongst_available").get(function () {
  return this.gst_stock + this.nongst_stock - this.nongst_sold;
});

itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

export default mongoose.model("Item", itemSchema);
