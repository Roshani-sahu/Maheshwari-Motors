import mongoose from "mongoose";

/**
 * Item Model (Updated)
 * - Added purchase_rate: Cost price of item (for profit margin calculations)
 * - Added firm_id: Items now belong to a firm (not user)
 */
const itemSchema = new mongoose.Schema(
  {
    item_name: { type: String, required: true },
    amount: { type: Number, required: true }, // Selling price
    purchase_rate: { type: Number, default: 0 }, // Purchase/cost price (for profit margin calc)
    image: { type: String },
    threshold: { type: Number, default: 0 },
    gst_stock: { type: Number, default: 0 },
    nongst_stock: { type: Number, default: 0 },
    nongst_sold: { type: Number, default: 0 },

    // GST flag: 1 = GST item (bill goes to GST firm), 0 = non-GST item
    is_gst: { type: Number, enum: [0, 1], default: 1 },

    // Which firm this item belongs to
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
    },

    // DEPRECATED: user_id - keeping for backward compat during migration
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
