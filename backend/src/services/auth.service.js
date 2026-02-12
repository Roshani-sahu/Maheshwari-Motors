import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { ApiError } from "../utils/index.js";

class AuthService {
  async registerMainUser(data) {
    const { name, email, phone, admin, gst_firm, nongst_firm } = data;

    const existingMain = await User.findOne({ type: "main" });
    if (existingMain) {
      throw ApiError.conflict("Main user already exists. Only one is allowed.");
    }

    const adminPwHash = await bcrypt.hash(admin.password, 10);
    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const user = await User.create({
      type: "main",
      name,
      email,
      phone,
      admin: { ...admin, password: adminPwHash },
      gst_firm: { ...gst_firm, password: gstPwHash },
      nongst_firm: { ...nongst_firm, password: nongstPwHash },
    });

    const token = user.generateAdminToken();

    await Session.create({
      user_id: user._id,
      role: "admin",
      token,
      device_name: "Registration Device",
      device_type: "unknown",
    });

    return {
      _id: user._id,
      name: user.name,
      type: "main",
      role: "admin",
      token,
    };
  }

  async loginAdmin(username, password, deviceInfo = {}) {
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
  }

  async loginFirm(username, password, deviceInfo = {}) {
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
      bank_name: firmObj.bank_name || null,
      bank_branch: firmObj.bank_branch || null,
      ifsc_code: firmObj.ifsc_code || null,
      account_number: firmObj.account_number || null,
    };

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: user.type,
      is_admin: user.type === "main",
      role: "firm",
      firm_data: firmData,
      token,
    };
  }

  async getProfile(user, role, firmType) {
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
}

export default new AuthService();
