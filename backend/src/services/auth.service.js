import bcrypt from "bcryptjs";
import Admin from "../models/admin.model.js";
import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
import User from "../models/user.model.js"; // DEPRECATED
import Session from "../models/session.model.js";
import { ApiError } from "../utils/index.js";

/**
 * Auth Service (Redesigned)
 *
 * NEW LOGIN FLOW:
 * 1. Admin Login: For managing firms, users, and system configuration
 * 2. Firm Login: Each firm has unique credentials for daily operations
 *
 * DEPRECATED: User login (kept for backward compatibility)
 */
class AuthService {
  // ============ ADMIN AUTH ============

  async registerAdmin(adminData) {
    const { username, email, password, name } = adminData;

    const existingAdmin = await Admin.findOne({
      $or: [{ username }, { email }],
    });
    if (existingAdmin) {
      throw ApiError.conflict("Admin username or email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await Admin.create({
      username,
      email,
      password: hashedPassword,
      name,
    });

    const token = admin.generateToken();

    await Session.create({
      admin_id: admin._id,
      role: "admin",
      token,
      device_name: "Registration Device",
      device_type: "unknown",
    });

    return {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      type: "admin",
      role: "admin",
      token,
    };
  }

  async loginAdmin(usernameOrEmail, password, deviceInfo = {}) {
    const admin = await Admin.findByCredentials(usernameOrEmail, password);
    const token = admin.generateToken();

    await Session.create({
      admin_id: admin._id,
      role: "admin",
      token,
      device_name: deviceInfo.device_name || "Unknown Device",
      device_type: deviceInfo.device_type || "unknown",
      ip_address: deviceInfo.ip_address || "",
    });

    return {
      _id: admin._id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      type: "admin",
      role: "admin",
      token,
    };
  }

  // ============ FIRM AUTH ============

  async loginFirm(username, password, deviceInfo = {}) {
    const firm = await Firm.findByCredentials(username, password);
    const token = firm.generateToken();

    await Session.create({
      firm_id: firm._id,
      role: "firm",
      token,
      device_name: deviceInfo.device_name || "Unknown Device",
      device_type: deviceInfo.device_type || "unknown",
      ip_address: deviceInfo.ip_address || "",
    });

    // Get the paired firm (GST ↔ NON_GST)
    const pair = await FirmPair.findOne({
      $or: [{ gst_firm_id: firm._id }, { nongst_firm_id: firm._id }],
    });

    let pairedFirmId = null;
    if (pair) {
      pairedFirmId =
        pair.gst_firm_id.toString() === firm._id.toString() ?
          pair.nongst_firm_id
        : pair.gst_firm_id;
    }

    return {
      _id: firm._id,
      username: firm.username,
      name: firm.name,
      type: "firm",
      firm_type: firm.type, // "GST" or "NON_GST"
      email: firm.email,
      phone: firm.phone,
      GSTIN: firm.GSTIN,
      role: "firm",
      paired_firm_id: pairedFirmId,
      token,
    };
  }

  async getFirmProfile(firmId) {
    const firm = await Firm.findById(firmId).select("-password");
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    // Get the paired firm
    const pair = await FirmPair.findOne({
      $or: [{ gst_firm_id: firmId }, { nongst_firm_id: firmId }],
    });

    let pairedFirm = null;
    if (pair) {
      const pairedFirmId =
        pair.gst_firm_id.toString() === firmId.toString() ?
          pair.nongst_firm_id
        : pair.gst_firm_id;
      pairedFirm = await Firm.findById(pairedFirmId).select(
        "_id name type username",
      );
    }

    return { ...firm.toObject(), paired_firm: pairedFirm };
  }

  // ============ GENERIC AUTH METHODS ============

  async logout(token) {
    // Remove session by token (works for admin, firm, or user)
    await Session.findOneAndDelete({ token });
  }

  async changePassword(role, id, currentPassword, newPassword) {
    let entity;
    if (role === "admin") {
      entity = await Admin.findById(id);
    } else if (role === "firm") {
      entity = await Firm.findById(id);
    } else {
      entity = await User.findById(id);
    }

    if (!entity) {
      throw ApiError.notFound(`${role} not found`);
    }

    const isMatch = await bcrypt.compare(currentPassword, entity.password);
    if (!isMatch) {
      throw ApiError.badRequest("Current password is incorrect");
    }

    entity.password = await bcrypt.hash(newPassword, 10);
    await entity.save();

    // Revoke ALL sessions when password is changed (security)
    if (role === "admin") {
      await Session.deleteMany({ admin_id: id });
    } else if (role === "firm") {
      await Session.deleteMany({ firm_id: id });
    } else {
      await Session.deleteMany({ user_id: id });
    }
  }

  async getSessions(role, id, currentToken) {
    let query = {};
    if (role === "admin") {
      query = { admin_id: id };
    } else if (role === "firm") {
      query = { firm_id: id };
    } else {
      query = { user_id: id };
    }

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

  async revokeSession(sessionId, role, id) {
    let query = { _id: sessionId };
    if (role === "admin") {
      query.admin_id = id;
    } else if (role === "firm") {
      query.firm_id = id;
    } else {
      query.user_id = id;
    }

    const session = await Session.findOneAndDelete(query);
    if (!session) {
      throw ApiError.notFound("Session not found");
    }
    return session;
  }

  async revokeAllOtherSessions(role, id, currentToken) {
    let query = { token: { $ne: currentToken } };
    if (role === "admin") {
      query.admin_id = id;
    } else if (role === "firm") {
      query.firm_id = id;
    } else {
      query.user_id = id;
    }
    await Session.deleteMany(query);
  }

  // ============ DEPRECATED: USER AUTH (backward compat) ============

  async register(userData) {
    const { username, email, password, type = "main" } = userData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw ApiError.conflict("Username or email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      type,
    });

    const token = user.generateToken();

    await Session.create({
      user_id: user._id,
      role: "user",
      token,
      device_name: "Registration Device",
      device_type: "unknown",
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: "user",
      role: "user",
      token,
    };
  }

  async login(usernameOrEmail, password, deviceInfo = {}) {
    const user = await User.findByCredentials(usernameOrEmail, password);
    const token = user.generateToken();

    await Session.create({
      user_id: user._id,
      role: "user",
      token,
      device_name: deviceInfo.device_name || "Unknown Device",
      device_type: deviceInfo.device_type || "unknown",
      ip_address: deviceInfo.ip_address || "",
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: "user",
      user_type: user.type, // "main" or "secondary"
      firm_ids: user.firm_ids,
      role: "user",
      token,
    };
  }

  async getProfile(userId) {
    const user = await User.findById(userId)
      .select("-password")
      .populate("firm_ids");
    if (!user) {
      throw ApiError.notFound("User not found");
    }
    return user;
  }
}

export default new AuthService();
