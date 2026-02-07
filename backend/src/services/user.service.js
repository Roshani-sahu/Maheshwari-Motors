import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Firm from "../models/firm.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class UserService {
  async getSecondaryUsers(mainUserId, query) {
    const mainUser = await User.findById(mainUserId);
    if (!mainUser || mainUser.type !== "main") {
      throw ApiError.forbidden("Only main user can access this");
    }

    return Pagination.paginate(
      User,
      { type: "secondary" },
      { ...query, select: "-password -token", sort: { createdAt: -1 } },
    );
  }

  async getSecondaryUserById(userId, mainUserId) {
    const user = await User.findOne({ _id: userId, type: "secondary" })
      .select("-password -token")
      .populate("firm_ids");

    if (!user) {
      throw ApiError.notFound("Secondary user not found");
    }
    return user;
  }

  async createSecondaryUser(userData, mainUserId) {
    const { username, email, password, firm_ids = [] } = userData;

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw ApiError.conflict("Username or email already exists");
    }

    if (firm_ids.length > 0) {
      const validFirms = await Firm.countDocuments({
        _id: { $in: firm_ids },
        user_id: mainUserId,
      });
      if (validFirms !== firm_ids.length) {
        throw ApiError.badRequest("Invalid firm IDs provided");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      type: "secondary",
      firm_ids,
    });

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      type: user.type,
      firm_ids: user.firm_ids,
    };
  }

  async updateSecondaryUser(userId, mainUserId, updateData) {
    const user = await User.findOne({ _id: userId, type: "secondary" });
    if (!user) {
      throw ApiError.notFound("Secondary user not found");
    }

    if (updateData.username || updateData.email) {
      const existingUser = await User.findOne({
        _id: { $ne: userId },
        $or: [
          ...(updateData.username ? [{ username: updateData.username }] : []),
          ...(updateData.email ? [{ email: updateData.email }] : []),
        ],
      });

      if (existingUser) {
        throw ApiError.conflict("Username or email already exists");
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
      updateData.token = null;
    }

    delete updateData.type;
    delete updateData.firm_ids;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password -token");
    return updatedUser;
  }

  async deleteSecondaryUser(userId, mainUserId) {
    const user = await User.findOne({ _id: userId, type: "secondary" });
    if (!user) {
      throw ApiError.notFound("Secondary user not found");
    }

    await User.findByIdAndDelete(userId);
  }

  async updateSecondaryUserFirms(userId, mainUserId, firmIds) {
    const user = await User.findOne({ _id: userId, type: "secondary" });
    if (!user) {
      throw ApiError.notFound("Secondary user not found");
    }

    if (firmIds.length > 0) {
      const validFirms = await Firm.countDocuments({
        _id: { $in: firmIds },
        user_id: mainUserId,
      });
      if (validFirms !== firmIds.length) {
        throw ApiError.badRequest("Invalid firm IDs provided");
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firm_ids: firmIds },
      { new: true },
    )
      .select("-password -token")
      .populate("firm_ids");

    return updatedUser;
  }
}

export default new UserService();
