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

    // Challan-level GST flag: 1 = GST challan (under GST firm), 0 = NON_GST challan
    is_gst: { type: Number, enum: [0, 1], required: true },

    // Links the twin challan created from the same submission (auto-split)
    linked_challan_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challan",
      default: null,
    },

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
  { timestamps: true },
);

challanSchema.index({ challan_no: 1, firm_id: 1 }, { unique: true });

export default mongoose.model("Challan", challanSchema);
