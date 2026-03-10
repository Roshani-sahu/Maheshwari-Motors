import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../../models/auth/user.model.js";
import Session from "../../models/auth/session.model.js";
import Bank from "../../models/master/bank.model.js";
import Contact from "../../models/master/contact.model.js";
import s3Service from "../common/s3.service.js";
import { ApiError } from "../../utils/index.js";

class AuthService {
  _normalizeBankIds(bankIds, label) {
    if (bankIds === undefined || bankIds === null) return [];
    if (!Array.isArray(bankIds)) {
      throw ApiError.badRequest(`${label} bank_ids must be an array`);
    }

    const normalized = [];
    const seen = new Set();

    for (const id of bankIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw ApiError.badRequest(`${label} contains an invalid bank_id`);
      }

      const key = String(id);
      if (!seen.has(key)) {
        seen.add(key);
        normalized.push(id);
      }
    }

    return normalized;
  }

  async _resolveFirmBanks(userId, firmObj) {
    const configuredBankIds =
      Array.isArray(firmObj.bank_ids) ? firmObj.bank_ids : [];

    if (configuredBankIds.length > 0) {
      return Bank.find({
        _id: { $in: configuredBankIds },
        user_id: userId,
      }).lean();
    }

    return Bank.find({ user_id: userId }).lean();
  }

  async registerMainUser(data) {
    const { name, email, phone, admin, gst_firm, nongst_firm } = data;

    const existingMain = await User.findOne({ type: "main" });
    if (existingMain) {
      throw ApiError.conflict("Main user already exists. Only one is allowed.");
    }

    const adminPwHash = await bcrypt.hash(admin.password, 10);
    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const gstBankIds = this._normalizeBankIds(gst_firm?.bank_ids, "GST firm");
    const nongstBankIds = this._normalizeBankIds(
      nongst_firm?.bank_ids,
      "Non-GST firm",
    );

    const user = await User.create({
      type: "main",
      name,
      email,
      phone,
      admin: { ...admin, password: adminPwHash },
      gst_firm: { ...gst_firm, password: gstPwHash, bank_ids: gstBankIds },
      nongst_firm: {
        ...nongst_firm,
        password: nongstPwHash,
        bank_ids: nongstBankIds,
      },
    });

    const token = user.generateAdminToken();

    await Session.create({
      user_id: user._id,
      role: "admin",
      token,
      device_name: "Registration Device",
      device_type: "unknown",
    });

    await Contact.insertMany([
      { name: "CashBook", type: "book", user_id: user._id },
      { name: "BankBook", type: "book", user_id: user._id },
    ]);

    return {
      _id: user._id,
      name: user.name,
      type: "main",
      role: "admin",
      token,
    };
  }

  async login(username, password, deviceInfo = {}) {
    try {
      const user = await User.findByAdminCredentials(username, password);
      const token = user.generateAdminToken();

      await Session.create({
        user_id: user._id,
        role: "admin",
        token,
        device_name: deviceInfo.device_name || "Unknown Device",
        device_type: deviceInfo.device_type || "unknown",
        ip_address: deviceInfo.ip_address || "",
      });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        type: user.type,
        is_admin: true,
        role: "admin",
        token,
      };
    } catch (_) {
      const { user, firmType } = await User.findByFirmCredentials(
        username,
        password,
      );
      const token = user.generateFirmToken(firmType);

      await Session.create({
        user_id: user._id,
        role: "firm",
        firm_type: firmType,
        token,
        device_name: deviceInfo.device_name || "Unknown Device",
        device_type: deviceInfo.device_type || "unknown",
        ip_address: deviceInfo.ip_address || "",
      });

      const firmObj = firmType === "GST" ? user.gst_firm : user.nongst_firm;

      const banks = await this._resolveFirmBanks(user._id, firmObj);

      const firmData = {
        firm_type: firmType,
        name: firmObj.name,
        username: firmObj.username,
        email: firmObj.email,
        phone: firmObj.phone,
        address: firmObj.address,
        godown_address: firmObj.godown_address || null,
        city: firmObj.city,
        state: firmObj.state,
        GSTIN: firmObj.GSTIN || null,
        CIN: firmObj.CIN || null,
        reg_number: firmObj.reg_number || null,
        bank_ids: Array.isArray(firmObj.bank_ids) ? firmObj.bank_ids : [],
        banks,
      };

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        type: user.type,
        is_admin: false,
        role: "firm",
        firm_data: firmData,
        signature: user.signature || null,
        token,
      };
    }
  }

  async getProfile(user, role, firmType) {
    await user.populate([
      { path: "gst_firm.bank_ids", model: "Bank" },
      { path: "nongst_firm.bank_ids", model: "Bank" },
    ]);
    const safe = user.toSafeObject();
    return { ...safe, current_role: role, current_firm_type: firmType || null };
  }

  async logout(token) {
    await Session.findOneAndDelete({ token });
  }

  async changePassword(userId, role, firmType, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let storedHash;
    let updatePath;

    if (role === "admin") {
      storedHash = user.admin.password;
      updatePath = "admin.password";
    } else if (firmType === "GST") {
      storedHash = user.gst_firm.password;
      updatePath = "gst_firm.password";
    } else {
      storedHash = user.nongst_firm.password;
      updatePath = "nongst_firm.password";
    }

    const isMatch = await bcrypt.compare(currentPassword, storedHash);
    if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

    const newHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { [updatePath]: newHash });

    const sessionFilter = { user_id: userId, role };
    if (role === "firm") sessionFilter.firm_type = firmType;
    await Session.deleteMany(sessionFilter);
  }

  async getSessions(userId, role, firmType, currentToken) {
    const query = { user_id: userId, role };
    if (role === "firm" && firmType) query.firm_type = firmType;

    const sessions = await Session.find(query)
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return sessions.map((s) => ({
      _id: s._id,
      device_name: s.device_name,
      device_type: s.device_type,
      ip_address: s.ip_address,
      last_active: s.last_active,
      is_current: s.token === currentToken,
      createdAt: s.createdAt,
    }));
  }

  async revokeSession(sessionId, userId) {
    const session = await Session.findOneAndDelete({
      _id: sessionId,
      user_id: userId,
    });
    if (!session) throw ApiError.notFound("Session not found");
    return session;
  }

  async revokeAllOtherSessions(userId, role, firmType, currentToken) {
    const query = { user_id: userId, token: { $ne: currentToken }, role };
    if (role === "firm" && firmType) query.firm_type = firmType;
    await Session.deleteMany(query);
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

export default new AuthService();
