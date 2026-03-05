import mongoose from "mongoose";

const paymentEntrySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    payment_type: {
      type: String,
      enum: [
        "bank_transaction_received_amount",
        "cash_payment_received_amount",
        "bank_transfer_payment_given",
        "cash_payment_given",
      ],
      required: true,
    },
    bank_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      default: null,
    },
    reference_no: { type: String, default: "" },
    note: { type: String, default: "" },
    settled_to: {
      type: String,
      enum: ["bill", "unsettled_balance"],
      default: "bill",
    },
    date: { type: Date, default: Date.now },
  },
  { _id: false },
);

const billSchema = new mongoose.Schema(
  {
    id: { type: Number },
    bill_no: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    contact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: false,
      default: null,
    },
    transport_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transport",
      default: null,
    },
    customer_name: { type: String, default: "" },
    vehicle_number: { type: String, default: "" },
    transport_charge: { type: Number, default: 0 },
    amount: { type: Number, required: true },
    paid_amount: { type: Number, default: 0 },
    return_amount: { type: Number, default: 0 },
    payment_status: {
      type: String,
      enum: ["due", "paid", "overpaid"],
      default: "due",
    },
    payment_entries: { type: [paymentEntrySchema], default: [] },
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
