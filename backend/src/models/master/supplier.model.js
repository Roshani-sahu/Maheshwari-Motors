import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    id: { type: Number },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    gstin: { type: String },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true, id: false },
);

supplierSchema.index({ id: 1, user_id: 1 });

export default mongoose.model("Supplier", supplierSchema);
