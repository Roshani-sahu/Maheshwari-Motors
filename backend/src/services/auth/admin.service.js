import bcrypt from "bcryptjs";
import User from "../../models/auth/user.model.js";
import Session from "../../models/auth/session.model.js";
import { ApiError, Pagination } from "../../utils/index.js";

class AdminService {
  async createSecondaryUser(data) {
    const { name, email, phone, gst_firm, nongst_firm } = data;

    const gstPwHash = await bcrypt.hash(gst_firm.password, 10);
    const nongstPwHash = await bcrypt.hash(nongst_firm.password, 10);

    const user = await User.create({
      type: "secondary",
      name,
      email,
      phone,
      admin: null,
      gst_firm: { ...gst_firm, password: gstPwHash },
      nongst_firm: { ...nongst_firm, password: nongstPwHash },
    });

    return user.toSafeObject();
  }

  async getSecondaryUsers(query) {
    return Pagination.paginate(
      User,
      { type: "secondary" },
      { ...query, sort: { createdAt: -1 } },
    );
  }

  async getSecondaryUserById(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");
    return user.toSafeObject();
  }

  async updateSecondaryUser(userId, updateData) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
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

  async deactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = false;
    await user.save();

    await Session.deleteMany({ user_id: userId });
    return user.toSafeObject();
  }

  async reactivateSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    user.is_active = true;
    await user.save();
    return user.toSafeObject();
  }

  async deleteSecondaryUser(userId) {
    const user = await User.findOne({
      _id: userId,
      type: "secondary",
    });
    if (!user) throw ApiError.notFound("Secondary user not found");

    await Session.deleteMany({ user_id: userId });
    await User.findByIdAndDelete(userId);
  }
}

export default new AdminService();
