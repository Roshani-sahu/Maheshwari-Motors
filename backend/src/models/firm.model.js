import mongoose from "mongoose";

const firmSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["GST", "NON_GST"], required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    godown_address: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    GSTIN: { type: String },
    CIN: { type: String },
    reg_number: { type: String },
    bank_name: { type: String },
    bank_branch: { type: String },
    ifsc_code: { type: String },
    account_number: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("Firm", firmSchema);
