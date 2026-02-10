import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    type: { type: String, enum: ["main", "secondary"], default: "main" },
    firm_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Firm" }],
  },
  { timestamps: true },
);

userSchema.methods.generateToken = function () {
  const token = jwt.sign(
    { _id: this._id, username: this.username },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );
  return token;
};

userSchema.statics.findByCredentials = async function (
  usernameOrEmail,
  password,
) {
  const user = await this.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
  });
  if (!user) throw ApiError.unauthorized("Invalid credentials");
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized("Invalid credentials");
  return user;
};

export default mongoose.model("User", userSchema);
