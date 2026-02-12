import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["sale", "purchase"], required: true },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: "Party" },
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    purchase_id: { type: mongoose.Schema.Types.ObjectId, ref: "Purchase" },
    amount: { type: Number, required: true },
    payment_mode: {
      type: String,
      enum: ["cash", "bank", "credit"],
      required: true,
    },
    utr: { type: String },
    transaction_ref: { type: String },
    remarks: { type: String },
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

export default mongoose.model("Transaction", transactionSchema);
