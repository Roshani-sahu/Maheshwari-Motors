import Firm from "../models/firm.model.js";
import User from "../models/user.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class FirmService {
  async getFirms(userId, query) {
    return Pagination.paginate(
      Firm,
      { user_id: userId },
      { ...query, sort: { createdAt: -1 } },
    );
  }

  async getFirmById(firmId, userId) {
    const firm = await Firm.findOne({ _id: firmId, user_id: userId });
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }
    return firm;
  }

  async createFirm(firmData, userId) {
    const existingFirmsCount = await Firm.countDocuments({ user_id: userId });
    if (existingFirmsCount >= 2) {
      throw ApiError.badRequest("Maximum 2 firms allowed per user");
    }

    const existingFirmType = await Firm.findOne({
      user_id: userId,
      type: firmData.type,
    });
    if (existingFirmType) {
      throw ApiError.conflict(`You already have a ${firmData.type} firm`);
    }

    const firm = await Firm.create({ ...firmData, user_id: userId });
    await User.findByIdAndUpdate(userId, { $push: { firm_ids: firm._id } });

    return firm;
  }

  async updateFirm(firmId, userId, updateData) {
    const firm = await Firm.findOne({ _id: firmId, user_id: userId });
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    if (updateData.type && updateData.type !== firm.type) {
      throw ApiError.badRequest("Cannot change firm type");
    }

    const updatedFirm = await Firm.findByIdAndUpdate(firmId, updateData, {
      new: true,
    });
    return updatedFirm;
  }

  async deleteFirm(firmId, userId) {
    const firm = await Firm.findOne({ _id: firmId, user_id: userId });
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    await User.findByIdAndUpdate(userId, { $pull: { firm_ids: firmId } });
    await Firm.findByIdAndDelete(firmId);
  }
}

export default new FirmService();
