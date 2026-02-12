import mongoose from "mongoose";

/**
 * Bill Model (Updated)
 * - Added skip_stock_calculation: when true, this bill doesn't affect physical stock
 * - Use case: Selling from GST stock via NON_GST firm (virtual stock transfer)
 */
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

    // When true, this bill does NOT deduct from physical stock
    // Use case: Virtual stock transfer between GST/NON_GST firms
    skip_stock_calculation: { type: Boolean, default: false },

    // GST classification: 1 = GST bill, 0 = non-GST bill
    is_gst: { type: Number, enum: [0, 1] },

    // DEPRECATED: user_id - keeping for backward compat during migration
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
