import mongoose from "mongoose";

/**
 * Session Model (Updated)
 * - Now supports both Admin and Firm sessions
 * - role: "admin" or "firm" to differentiate
 */
const sessionSchema = new mongoose.Schema(
  {
    // For admin sessions
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      index: true,
    },

    // For firm sessions
    firm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Firm",
      index: true,
    },

    // DEPRECATED: user_id - keeping for backward compat
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    role: {
      type: String,
      enum: ["admin", "firm", "user"], // user is deprecated
      required: true,
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
    is_current: { type: Boolean, default: false }, // set dynamically
  },
  { timestamps: true },
);

// Index for listing sessions by admin/firm
sessionSchema.index({ admin_id: 1, createdAt: -1 });
sessionSchema.index({ firm_id: 1, createdAt: -1 });

export default mongoose.model("Session", sessionSchema);
