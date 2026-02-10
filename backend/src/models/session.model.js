import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: { type: String, required: true, unique: true },
    device_name: { type: String, default: "Unknown Device" },
    device_type: {
      type: String,
      enum: ["android", "ios", "web", "desktop", "unknown"],
      default: "unknown",
    },
    ip_address: { type: String, default: "" },
    last_active: { type: Date, default: Date.now },
    is_current: { type: Boolean, default: false }, // will be set dynamically
  },
  { timestamps: true },
);

// Index for fast token lookups in auth middleware
sessionSchema.index({ token: 1 });

// Index for listing sessions by user
sessionSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model("Session", sessionSchema);
