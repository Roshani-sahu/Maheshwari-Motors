import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    gstin: { type: String },
    balance: { type: Number, default: 0 },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Shared across paired firms. Stored for reference but queries use user_id (ownerId)
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Party", partySchema);
