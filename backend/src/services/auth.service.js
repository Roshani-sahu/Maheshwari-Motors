import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
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
    await user.save();

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: user.type,
      token,
    };
  }

  async login(usernameOrEmail, password) {
    const user = await User.findByCredentials(usernameOrEmail, password);
    const token = user.generateToken();
    await user.save();

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: user.type,
      firm_ids: user.firm_ids,
      token,
    };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { token: null });
  }

  async getProfile(userId) {
    const user = await User.findById(userId)
      .select("-password -token")
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
    user.token = null;
    await user.save();
  }
}

export default new AuthService();
