import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/auth/user.model.js";
import Session from "../../models/auth/session.model.js";
import Subscription from "../../models/common/subscription.model.js";
import Bank from "../../models/master/bank.model.js";
import s3Service from "../common/s3.service.js";
import { ApiError, Pagination } from "../../utils/index.js";

class AdminService {
  _normalizeBankIds(bankIds, label) {
    if (bankIds === undefined) return undefined;

    if (!Array.isArray(bankIds)) {
      throw ApiError.badRequest(`${label}: bank_ids must be an array`);
    }

    const normalized = [];
    const seen = new Set();

    for (const bankId of bankIds) {
      if (!mongoose.Types.ObjectId.isValid(bankId)) {
        throw ApiError.badRequest(`${label}: invalid bank_id provided`);
      }

      const key = String(bankId);
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(bankId);
      }
    }

    return normalized;
  }

  async _validateUserBankIds(userId, bankIds, label) {
    const normalized = this._normalizeBankIds(bankIds, label);
    if (normalized === undefined) return undefined;
    if (normalized.length === 0) return [];

    const count = await Bank.countDocuments({
      _id: { $in: normalized },
      user_id: userId,
    });

    if (count !== normalized.length) {
      throw ApiError.badRequest(
        `${label}: one or more bank_ids are invalid or do not belong to this user`,
      );
    }

    return normalized;
  }

  async _attachSubscriptionSummary(users = []) {
    if (!users || users.length === 0) return users;

    const userIds = users.map((u) => u._id);
    const subscriptions = await Subscription.find({
      user_id: { $in: userIds },
    })
      .select("user_id plan_type status start_date expiry_date timeline")
      .lean();

    const subMap = new Map(
      subscriptions.map((sub) => [String(sub.user_id), sub]),
    );

    return users.map((user) => ({
      ...user,
      subscription: subMap.get(String(user._id)) || null,
    }));
  }

  async _ensureDemoSubscription(userId) {
    const existing = await Subscription.findOne({ user_id: userId })
      .select("_id")
      .lean();

    if (existing) return;

    await Subscription.create({
      user_id: userId,
      plan_type: "demo",
      status: "active",
      timeline: { years: 0, months: 0, days: 30 },
      start_date: new Date(),
      notes: "Auto-created demo subscription",
    });
  }

  _validateFirmRequired(firm, label) {
    const required = [
      "username",
      "password",
      "name",
      "phone",
      "email",
      "address",
      "city",
      "state",
    ];
    const missing = required.filter(
      (f) => !firm[f] || (typeof firm[f] === "string" && !firm[f].trim()),
    );
    if (missing.length > 0) {
      throw ApiError.badRequest(
        `${label}: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} required`,
      );
    }
    if (firm.password.length < 6) {
      throw ApiError.badRequest(
        `${label}: Password must be at least 6 characters`,
      );
    }
    if (firm.username.trim().length < 3) {
      throw ApiError.badRequest(
        `${label}: Username must be at least 3 characters`,
      );
    }
  }

  async createSecondaryUser(data) {
    const { name, email, phone, gst_firm, nongst_firm } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("User name is required");
    }
    if (!gst_firm || typeof gst_firm !== "object") {
      throw ApiError.badRequest("GST Firm details are required");
    }
    if (!nongst_firm || typeof nongst_firm !== "object") {
      throw ApiError.badRequest("Non-GST Firm details are required");
    }

    this._validateFirmRequired(gst_firm, "GST Firm");
    this._validateFirmRequired(nongst_firm, "Non-GST Firm");

    const existingGst = await User.findOne({
      "gst_firm.username": gst_firm.username.trim(),
    });
    if (existingGst) {
      throw ApiError.conflict("GST Firm username is already taken");
    }
    const existingNongst = await User.findOne({
      "nongst_firm.username": nongst_firm.username.trim(),
    });
    if (existingNongst) {
      throw ApiError.conflict("Non-GST Firm username is already taken");
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.trim() });
      if (existingEmail) {
        throw ApiError.conflict("A user with this email already exists");
      }
    }

    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const {
      username: gstUsername,
      name: gstName,
      phone: gstPhone,
      email: gstEmail,
      address: gstAddress,
      godown_address: gstGodownAddress,
      city: gstCity,
      state: gstState,
      GSTIN: gstGSTIN,
      CIN: gstCIN,
      reg_number: gstRegNumber,
      bank_ids: gstBankIds,
    } = gst_firm;

    const {
      username: nongstUsername,
      name: nongstName,
      phone: nongstPhone,
      email: nongstEmail,
      address: nongstAddress,
      godown_address: nongstGodownAddress,
      city: nongstCity,
      state: nongstState,
      GSTIN: nongstGSTIN,
      CIN: nongstCIN,
      reg_number: nongstRegNumber,
      bank_ids: nongstBankIds,
    } = nongst_firm;

    const normalizedGstBankIds =
      this._normalizeBankIds(gstBankIds, "GST Firm") || [];
    const normalizedNongstBankIds =
      this._normalizeBankIds(nongstBankIds, "Non-GST Firm") || [];

    if (normalizedGstBankIds.length > 0 || normalizedNongstBankIds.length > 0) {
      throw ApiError.badRequest(
        "bank_ids can be assigned after user creation, once banks are created for that user",
      );
    }

    const user = await User.create({
      type: "secondary",
      name,
      email,
      phone,
      admin: null,
      gst_firm: {
        username: gstUsername,
        password: gstPwHash,
        name: gstName,
        phone: gstPhone,
        email: gstEmail,
        address: gstAddress,
        godown_address: gstGodownAddress,
        city: gstCity,
        state: gstState,
        GSTIN: gstGSTIN,
        CIN: gstCIN,
        reg_number: gstRegNumber,
        bank_ids: [],
      },
      nongst_firm: {
        username: nongstUsername,
        password: nongstPwHash,
        name: nongstName,
        phone: nongstPhone,
        email: nongstEmail,
        address: nongstAddress,
        godown_address: nongstGodownAddress,
        city: nongstCity,
        state: nongstState,
        GSTIN: nongstGSTIN,
        CIN: nongstCIN,
        reg_number: nongstRegNumber,
        bank_ids: [],
      },
    });

    await this._ensureDemoSubscription(user._id);

    const safeUser = user.toSafeObject();
    const [withSubscription] = await this._attachSubscriptionSummary([
      safeUser,
    ]);
    return withSubscription;
  }

  async getSecondaryUsers(query) {
    const result = await Pagination.paginate(
      User,
      { type: "secondary" },
      { ...query, sort: { createdAt: -1 } },
    );

    result.data = await this._attachSubscriptionSummary(result.data);
    return result;
  }

  async getSecondaryUserById(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    const [withSubscription] = await this._attachSubscriptionSummary([
      user.toSafeObject(),
    ]);

    return withSubscription;
  }

  _validateFirmUpdate(firm, label) {
    if (typeof firm !== "object" || firm === null || Array.isArray(firm)) {
      throw ApiError.badRequest(`${label} must be an object`);
    }
    if (firm.password !== undefined) {
      if (typeof firm.password !== "string" || firm.password.length < 6) {
        throw ApiError.badRequest(
          `${label}: Password must be at least 6 characters`,
        );
      }
    }
    if (firm.username !== undefined) {
      if (
        typeof firm.username !== "string" ||
        firm.username.trim().length < 3
      ) {
        throw ApiError.badRequest(
          `${label}: Username must be at least 3 characters`,
        );
      }
    }
  }

  async _checkFirmUsernameUniqueness(firmPath, username, excludeUserId) {
    const existing = await User.findOne({
      [`${firmPath}.username`]: username.trim(),
      _id: { $ne: excludeUserId },
    });
    if (existing) {
      const label = firmPath === "gst_firm" ? "GST Firm" : "Non-GST Firm";
      throw ApiError.conflict(`${label} username is already taken`);
    }
  }

  async updateSecondaryUser(userId, updateData) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    const { name, email, phone, is_active, gst_firm, nongst_firm } = updateData;

    if (
      !name &&
      !email &&
      !phone &&
      is_active === undefined &&
      !gst_firm &&
      !nongst_firm
    ) {
      throw ApiError.badRequest("No fields provided to update");
    }

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Name must be a non-empty string");
      }
      user.name = name.trim();
    }
    if (email !== undefined) {
      if (email) {
        const existingEmail = await User.findOne({
          email: email.trim(),
          _id: { $ne: userId },
        });
        if (existingEmail) {
          throw ApiError.conflict("A user with this email already exists");
        }
      }
      user.email = email;
    }
    if (phone !== undefined) user.phone = phone;
    if (is_active !== undefined) user.is_active = is_active;

    if (gst_firm) {
      this._validateFirmUpdate(gst_firm, "GST Firm");

      const {
        username,
        password,
        name: firmName,
        phone: firmPhone,
        email: firmEmail,
        address,
        godown_address,
        city,
        state,
        GSTIN,
        CIN,
        reg_number,
        bank_ids,
      } = gst_firm;

      const validatedGstBankIds = await this._validateUserBankIds(
        userId,
        bank_ids,
        "GST Firm",
      );

      if (username !== undefined) {
        await this._checkFirmUsernameUniqueness("gst_firm", username, userId);
        user.gst_firm.username = username.trim();
      }
      if (password) user.gst_firm.password = await bcrypt.hash(password, 10);
      if (firmName !== undefined) user.gst_firm.name = firmName;
      if (firmPhone !== undefined) user.gst_firm.phone = firmPhone;
      if (firmEmail !== undefined) user.gst_firm.email = firmEmail;
      if (address !== undefined) user.gst_firm.address = address;
      if (godown_address !== undefined)
        user.gst_firm.godown_address = godown_address;
      if (city !== undefined) user.gst_firm.city = city;
      if (state !== undefined) user.gst_firm.state = state;
      if (GSTIN !== undefined) user.gst_firm.GSTIN = GSTIN;
      if (CIN !== undefined) user.gst_firm.CIN = CIN;
      if (reg_number !== undefined) user.gst_firm.reg_number = reg_number;
      if (validatedGstBankIds !== undefined)
        user.gst_firm.bank_ids = validatedGstBankIds;
    }

    if (nongst_firm) {
      this._validateFirmUpdate(nongst_firm, "Non-GST Firm");

      const {
        username,
        password,
        name: firmName,
        phone: firmPhone,
        email: firmEmail,
        address,
        godown_address,
        city,
        state,
        GSTIN,
        CIN,
        reg_number,
        bank_ids,
      } = nongst_firm;

      const validatedNonGstBankIds = await this._validateUserBankIds(
        userId,
        bank_ids,
        "Non-GST Firm",
      );

      if (username !== undefined) {
        await this._checkFirmUsernameUniqueness(
          "nongst_firm",
          username,
          userId,
        );
        user.nongst_firm.username = username.trim();
      }
      if (password) user.nongst_firm.password = await bcrypt.hash(password, 10);
      if (firmName !== undefined) user.nongst_firm.name = firmName;
      if (firmPhone !== undefined) user.nongst_firm.phone = firmPhone;
      if (firmEmail !== undefined) user.nongst_firm.email = firmEmail;
      if (address !== undefined) user.nongst_firm.address = address;
      if (godown_address !== undefined)
        user.nongst_firm.godown_address = godown_address;
      if (city !== undefined) user.nongst_firm.city = city;
      if (state !== undefined) user.nongst_firm.state = state;
      if (GSTIN !== undefined) user.nongst_firm.GSTIN = GSTIN;
      if (CIN !== undefined) user.nongst_firm.CIN = CIN;
      if (reg_number !== undefined) user.nongst_firm.reg_number = reg_number;
      if (validatedNonGstBankIds !== undefined)
        user.nongst_firm.bank_ids = validatedNonGstBankIds;
    }

    await user.save();
    return user.toSafeObject();
  }

  async deactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = false;
    await user.save();

    await Session.deleteMany({ user_id: userId });
    return user.toSafeObject();
  }

  async reactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = true;
    await user.save();

    await this._ensureDemoSubscription(user._id);

    const safeUser = user.toSafeObject();
    const [withSubscription] = await this._attachSubscriptionSummary([
      safeUser,
    ]);
    return withSubscription;
  }

  async deleteSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    if (user.signature) {
      await s3Service.deleteFile(user.signature);
    }

    await Session.deleteMany({ user_id: userId });
    await Subscription.findOneAndDelete({ user_id: userId });
    await User.findByIdAndDelete(userId);
  }

  async uploadSignature(userId, file) {
    if (!file) {
      throw ApiError.badRequest("Signature image file is required");
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (user.signature) {
      throw ApiError.badRequest(
        "Signature already exists. Use the update endpoint to replace it.",
      );
    }

    const signatureUrl = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      "users/signatures",
    );

    user.signature = signatureUrl;
    await user.save();

    return user.toSafeObject();
  }

  async updateSignature(userId, file) {
    if (!file) {
      throw ApiError.badRequest("Signature image file is required");
    }

    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    if (user.signature) {
      await s3Service.deleteFile(user.signature);
    }

    const signatureUrl = await s3Service.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      "users/signatures",
    );

    user.signature = signatureUrl;
    await user.save();

    return user.toSafeObject();
  }
}

export default new AdminService();
