import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    id: { type: Number },
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

    skip_stock_calculation: { type: Boolean, default: false },

    is_gst: { type: Number, enum: [0, 1], required: true },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

billSchema.index({ bill_no: 1, user_id: 1, is_gst: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);
