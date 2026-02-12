import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

/**
 * Admin Model
 * - Admins manage firms, users, and overall system configuration
 * - Separate from Firm credentials (which are for daily operations)
 */
const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

adminSchema.methods.generateToken = function () {
  const token = jwt.sign(
    { _id: this._id, username: this.username, role: "admin" },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
  return token;
};

adminSchema.statics.findByCredentials = async function (
  usernameOrEmail,
  password,
) {
  const admin = await this.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    is_active: true,
  });
  if (!admin) throw ApiError.unauthorized("Invalid admin credentials");
  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw ApiError.unauthorized("Invalid admin credentials");
  return admin;
};

export default mongoose.model("Admin", adminSchema);
