import mongoose from "mongoose";

const challanSchema = new mongoose.Schema(
  {
    challan_no: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    party_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    items: [
      {
        item_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Item",
          required: true,
        },
        quantity: { type: Number, default: 1 },
        rate: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        gross_amount: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],
    gross_total: { type: Number, required: true },
    sub_total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    converted_to_bill: { type: Boolean, default: false },
    bill_id: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
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
  { timestamps: true },
);

challanSchema.index({ challan_no: 1, firm_id: 1 }, { unique: true });

export default mongoose.model("Challan", challanSchema);
