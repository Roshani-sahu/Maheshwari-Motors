import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { ApiError } from "../utils/index.js";

class AuthService {
  async register(userData) {
    const { username, email, password, type = "secondary" } = userData;

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

    // Create a session for the registering device
    await Session.create({
      user_id: user._id,
      token,
      device_name: "Registration Device",
      device_type: "unknown",
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: user.type,
      token,
    };
  }

  async login(usernameOrEmail, password, deviceInfo = {}) {
    const user = await User.findByCredentials(usernameOrEmail, password);
    const token = user.generateToken();

    // Create a new session for this device (multi-device support)
    await Session.create({
      user_id: user._id,
      token,
      device_name: deviceInfo.device_name || "Unknown Device",
      device_type: deviceInfo.device_type || "unknown",
      ip_address: deviceInfo.ip_address || "",
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: user.type,
      firm_ids: user.firm_ids,
      token,
    };
  }

  async logout(userId, token) {
    // Remove only the current session (not all sessions)
    await Session.findOneAndDelete({ user_id: userId, token });
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

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw ApiError.badRequest("Current password is incorrect");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Revoke ALL sessions when password is changed (security)
    await Session.deleteMany({ user_id: userId });
  }

  async getSessions(userId, currentToken) {
    const sessions = await Session.find({ user_id: userId })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    // Mark which session is the current one
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
    if (!session) {
      throw ApiError.notFound("Session not found");
    }
    return session;
  }

  async revokeAllOtherSessions(userId, currentToken) {
    await Session.deleteMany({
      user_id: userId,
      token: { $ne: currentToken },
    });
  }
}

export default new AuthService();
