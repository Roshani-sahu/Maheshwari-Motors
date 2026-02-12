import jwt from "jsonwebtoken";
import Admin from "../models/admin.model.js";
import Firm from "../models/firm.model.js";
import User from "../models/user.model.js"; // DEPRECATED: for backward compat
import Session from "../models/session.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";
import env from "../config/env.js";

/**
 * Auth Middleware (Updated)
 * - Supports Admin login (role: "admin")
 * - Supports Firm login (role: "firm")
 * - DEPRECATED: User login (role: "user") - for backward compat
 */
const auth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const role = decoded.role || "user"; // default to user for old tokens

    // Check if a valid session exists for this token
    const session = await Session.findOne({ token });
    if (!session) {
      throw ApiError.unauthorized("Session expired or revoked");
    }

    // Update last_active timestamp (fire-and-forget)
    session.last_active = new Date();
    session.save().catch(() => {});

    if (role === "admin") {
      // Admin login
      const admin = await Admin.findById(decoded._id).select("-password");
      if (!admin || !admin.is_active) {
        throw ApiError.unauthorized("Admin not found or inactive");
      }
      req.admin = admin;
      req.role = "admin";
      req.ownerId = admin._id; // admin owns all data
    } else if (role === "firm") {
      // Firm login
      const firm = await Firm.findById(decoded._id).select("-password");
      if (!firm || !firm.is_active) {
        throw ApiError.unauthorized("Firm not found or inactive");
      }
      req.firm = firm;
      req.role = "firm";
      req.ownerId = firm.admin_id || firm.user_id; // business owner
    } else {
      // DEPRECATED: User login (backward compat)
      const user = await User.findById(decoded._id).select("-password");
      if (!user) {
        throw ApiError.unauthorized("User not found");
      }
      req.user = user;
      req.role = "user";
      req.ownerId = user._id; // user owns their own data
    }

    req.token = token;
    req.session_id = session._id;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.unauthorized("Invalid token");
  }
});

/**
 * Admin-only middleware
 * Use after auth middleware to restrict to admin users
 */
export const requireAdmin = asyncHandler(async (req, res, next) => {
  if (req.role !== "admin") {
    throw ApiError.forbidden("Admin access required");
  }
  next();
});

/**
 * Firm-only middleware
 * Use after auth middleware to restrict to firm users
 */
export const requireFirm = asyncHandler(async (req, res, next) => {
  if (req.role !== "firm") {
    throw ApiError.forbidden("Firm access required");
  }
  next();
});

export default auth;
