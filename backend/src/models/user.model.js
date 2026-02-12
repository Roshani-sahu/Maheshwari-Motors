import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";

const { Schema } = mongoose;
const ObjectId = Schema.Types.ObjectId;

const firmSubSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
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
  },
  { _id: false },
);

const adminSubSchema = new Schema(
  {
    username: { type: String, required: true },
    password: { type: String, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    type: { type: String, enum: ["main", "secondary"], required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },

    gst_firm: { type: firmSubSchema, required: true },
    nongst_firm: { type: firmSubSchema, required: true },

    admin: { type: adminSubSchema, default: null },

    is_active: { type: Boolean, default: true },
    created_by: { type: ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

userSchema.index({ "gst_firm.username": 1 }, { unique: true });
userSchema.index({ "nongst_firm.username": 1 }, { unique: true });
userSchema.index(
  { "admin.username": 1 },
  { unique: true, partialFilterExpression: { admin: { $ne: null } } },
);

userSchema.methods.generateAdminToken = function () {
  return jwt.sign(
    { _id: this._id, role: "admin", user_type: this.type },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
};

userSchema.methods.generateFirmToken = function (firmType) {
  return jwt.sign(
    {
      _id: this._id,
      role: "firm",
      firm_type: firmType,
      user_type: this.type,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN },
  );
};

userSchema.statics.findByAdminCredentials = async function (
  username,
  password,
) {
  const user = await this.findOne({
    "admin.username": username,
    type: "main",
    is_active: true,
  });
  if (!user || !user.admin) {
    throw ApiError.unauthorized("Invalid admin credentials");
  }
  const isMatch = await bcrypt.compare(password, user.admin.password);
  if (!isMatch) throw ApiError.unauthorized("Invalid admin credentials");
  return user;
};

userSchema.statics.findByFirmCredentials = async function (username, password) {
  let user = await this.findOne({
    "gst_firm.username": username,
    is_active: true,
  });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.gst_firm.password);
    if (!isMatch) throw ApiError.unauthorized("Invalid firm credentials");
    return { user, firmType: "GST" };
  }

  user = await this.findOne({
    "nongst_firm.username": username,
    is_active: true,
  });
  if (user) {
    const isMatch = await bcrypt.compare(password, user.nongst_firm.password);
    if (!isMatch) throw ApiError.unauthorized("Invalid firm credentials");
    return { user, firmType: "NON_GST" };
  }

  throw ApiError.unauthorized("Invalid firm credentials");
};

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  if (obj.gst_firm) delete obj.gst_firm.password;
  if (obj.nongst_firm) delete obj.nongst_firm.password;
  if (obj.admin) delete obj.admin.password;
  return obj;
};

export default mongoose.model("User", userSchema);
