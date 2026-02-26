import mongoose from "mongoose";

const challanBankSchema = new mongoose.Schema(
  {
    bank_id: { type: mongoose.Schema.Types.ObjectId, default: null },
    bank_name: { type: String, default: "" },
    bank_branch: { type: String, default: "" },
    ifsc_code: { type: String, default: "" },
    account_number: { type: String, default: "" },
    account_holder: { type: String, default: "" },
  },
  { _id: false },
);

const challanSchema = new mongoose.Schema(
  {
    id: { type: Number },
    challan_no: { type: String, required: true },
    challan_type: {
      type: String,
      enum: ["sale", "purchase"],
      required: true,
    },
    date: { type: Date, required: true, default: Date.now },
    label_name: { type: String, trim: true, default: null },
    print_option: { type: Number, enum: [1, 2], default: 2 },
    contact_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    from_bank: { type: challanBankSchema, default: null },
    to_bank: { type: challanBankSchema, default: null },
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
        special_discount: { type: Number, default: 0 },
        gross_amount: { type: Number, required: true },
        discount_amount: { type: Number, default: 0 },
        total_discount: { type: Number, default: 0 },
        taxable_amount: { type: Number, required: true },
        gst_percent: { type: Number, default: 0 },
        gst_amount: { type: Number, default: 0 },
        amount: { type: Number, required: true },
        is_gst: { type: Number, enum: [0, 1], default: 1 },
      },
    ],
    gross_total: { type: Number, required: true },
    sub_total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    amount: { type: Number, required: true },

    
    converted_to_bill: { type: Boolean, default: false },
    bill_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },

    
    payment_status: {
      type: String,
      enum: ["due", "paid", "overpaid"],
      default: "due",
    },
    paid_amount: { type: Number, default: 0 },

    is_gst: { type: Number, enum: [0, 1], required: true },

    linked_challan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challan",
      default: null,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

challanSchema.index(
  { challan_no: 1, user_id: 1, is_gst: 1, challan_type: 1 },
  { unique: true },
);
challanSchema.index({ id: 1, user_id: 1 });
challanSchema.index({ challan_type: 1, user_id: 1, is_gst: 1 });

export default mongoose.model("Challan", challanSchema);
