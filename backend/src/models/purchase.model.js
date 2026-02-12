import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    purchase_no: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    items: [
      {
        item_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    purchase_type: { type: String, enum: ["GST", "NON_GST"], required: true },
    amount: { type: Number, required: true },
    payment_status: {
      type: String,
      enum: ["due", "paid", "overpaid"],
      default: "due",
    },
    paid_amount: { type: Number, default: 0 },
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

purchaseSchema.index({ purchase_no: 1, firm_id: 1 }, { unique: true });

export default mongoose.model("Purchase", purchaseSchema);
