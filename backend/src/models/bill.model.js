import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    bill_no: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    amount: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    return_amount: { type: Number, default: 0 },
    payment_status: {
      type: String,
      enum: ["due", "paid", "overpaid"],
      default: "due",
    },
    challan_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Challan" }],
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

billSchema.virtual("balance").get(function () {
  return this.amount - this.paid_amount;
});

billSchema.set("toJSON", { virtuals: true });
billSchema.set("toObject", { virtuals: true });

billSchema.index({ bill_no: 1, firm_id: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);
