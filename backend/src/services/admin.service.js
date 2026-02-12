import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class AdminService {
  async createSecondaryUser(mainUserId, data) {
    const { name, email, phone, gst_firm, nongst_firm } = data;

    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const user = await User.create({
      type: "secondary",
      name,
      email,
      phone,
      admin: null, // secondary users don't have admin credentials
      gst_firm: { ...gst_firm, password: gstPwHash },
      nongst_firm: { ...nongst_firm, password: nongstPwHash },
      created_by: mainUserId,
    });

    return user.toSafeObject();
  }

  async getSecondaryUsers(mainUserId, query) {
    return Pagination.paginate(
      User,
      { type: "secondary", created_by: mainUserId },
      { ...query, sort: { createdAt: -1 } },
    );
  }

  async getSecondaryUserById(userId, mainUserId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
      created_by: mainUserId,
    });
    if (!user) throw ApiError.notFound("Secondary user not found");
    return user.toSafeObject();
  }

  async updateSecondaryUser(userId, mainUserId, updateData) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
      created_by: mainUserId,
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    if (updateData.name) user.name = updateData.name;
    if (updateData.email) user.email = updateData.email;
    if (updateData.phone) user.phone = updateData.phone;
    if (updateData.is_active !== undefined)
      user.is_active = updateData.is_active;

    if (updateData.gst_firm) {
      const gf = { ...updateData.gst_firm };
      if (gf.password) gf.password = await bcrypt.hash(gf.password, 10);
      Object.assign(user.gst_firm, gf);
    }

    if (updateData.nongst_firm) {
      const nf = { ...updateData.nongst_firm };
      if (nf.password) nf.password = await bcrypt.hash(nf.password, 10);
      Object.assign(user.nongst_firm, nf);
    }

    await user.save();
    return user.toSafeObject();
  }

  async deactivateSecondaryUser(userId, mainUserId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
      created_by: mainUserId,
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = false;
    await user.save();

    await Session.deleteMany({ user_id: userId });
    return user.toSafeObject();
  }

  async reactivateSecondaryUser(userId, mainUserId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
      created_by: mainUserId,
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = true;
    await user.save();
    return user.toSafeObject();
  }

  async deleteSecondaryUser(userId, mainUserId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
      created_by: mainUserId,
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    await Session.deleteMany({ user_id: userId });
    await User.findByIdAndDelete(userId);
  }
}

export default new AdminService();
