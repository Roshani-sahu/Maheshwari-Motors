import mongoose from "mongoose";

const bankSchema = new mongoose.Schema(
  {
    id: { type: Number },
    bank_name: { type: String, trim: true, required: true },
    bank_branch: { type: String, trim: true, default: "" },
    ifsc_code: { type: String, trim: true, default: "" },
    account_number: { type: String, trim: true, required: true },
    account_holder: { type: String, trim: true, default: "" },
    upi_id: { type: String, trim: true, default: "" },
    bank_type: { type: String, enum: ["firm", "party", "supplier"], default: "firm" }, // new field for filtering
    is_default: { type: Boolean, default: false },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false },
);

bankSchema.index({ id: 1, user_id: 1 });
bankSchema.index({ account_number: 1, user_id: 1 });

export default mongoose.model("Bank", bankSchema);
