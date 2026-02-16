import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["admin", "firm"],
      required: true,
    },

    firm_type: {
      type: String,
      enum: ["GST", "NON_GST"],
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
  },
  { timestamps: true },
);

sessionSchema.index({ user_id: 1, createdAt: -1 });

export default mongoose.model("Session", sessionSchema);
