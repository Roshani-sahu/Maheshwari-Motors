import mongoose from "mongoose";

/**
 * Firm Pair Model
 * - Links a GST firm with a Non-GST firm
 * - Each pair represents one "business" with two accounting modes
 * - Both firms share the same physical inventory but have separate logical stock
 */
const firmPairSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Business name (e.g., "Maheshwari Motors")
    gst_firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      unique: true,
    },
    nongst_firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      required: true,
      unique: true,
    },
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Ensure both firms are unique across all pairs
firmPairSchema.index({ gst_firm_id: 1, nongst_firm_id: 1 }, { unique: true });

export default mongoose.model("FirmPair", firmPairSchema);
