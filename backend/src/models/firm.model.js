import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

/**
 * Firm Model (Updated)
 * - Each firm now has its own login credentials (username/password)
 * - When user logs in with firm credentials, they access that specific firm
 * - Firms are paired: one GST + one NON_GST = one business
 */
const firmSchema = new mongoose.Schema(
  {
    // Login credentials for this firm
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // Firm details
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

    // Reference to admin who created this firm (optional, for backward compat)
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // DEPRECATED: user_id - keeping for migration, will be removed later
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Generate JWT for firm login
firmSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      role: "firm",
      firm_type: this.type,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
  return token;
};

// Find firm by credentials
firmSchema.statics.findByCredentials = async function (username, password) {
  const firm = await this.findOne({ username, is_active: true });
  if (!firm) throw ApiError.unauthorized("Invalid firm credentials");
  const isMatch = await bcrypt.compare(password, firm.password);
  if (!isMatch) throw ApiError.unauthorized("Invalid firm credentials");
  return firm;
};

export default mongoose.model("Firm", firmSchema);
