import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    id: { type: Number },
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
    is_gst: { type: Number, enum: [0, 1], required: true },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

transactionSchema.index({ id: 1, user_id: 1 });

export default mongoose.model("Transaction", transactionSchema);
