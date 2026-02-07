import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
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

    if (user.token !== token) {
      throw ApiError.unauthorized("Token expired or invalid");
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.unauthorized("Invalid token");
  }
});

export default auth;
