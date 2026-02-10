import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";
import env from "../config/env.js";

const auth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw ApiError.unauthorized("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    // Check if a valid session exists for this token
    const session = await Session.findOne({ user_id: user._id, token });
    if (!session) {
      throw ApiError.unauthorized("Session expired or revoked");
    }

    // Update last_active timestamp (fire-and-forget)
    session.last_active = new Date();
    session.save().catch(() => {});

    req.user = user;
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

export default auth;
