import Firm from "../models/firm.model.js";
import User from "../models/user.model.js";
import Party from "../models/party.model.js";
import Challan from "../models/challan.model.js";
import Bill from "../models/bill.model.js";
import Purchase from "../models/purchase.model.js";
import Transaction from "../models/transaction.model.js";
import Discount from "../models/discount.model.js";
import StockAlert from "../models/stockAlert.model.js";
import { ApiError, Pagination } from "../utils/index.js";
import stockService from "./stock.service.js";

class FirmService {
  async getFirms(userId, query) {
    // Return firms the user owns OR has been assigned
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let filter;
    if (user.type === "main") {
      filter = { user_id: userId };
    } else {
      // Secondary user — only firms in their firm_ids
      filter = { _id: { $in: user.firm_ids || [] } };
    }

    return Pagination.paginate(Firm, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getFirmById(firmId, userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound("User not found");

    let firm;
    if (user.type === "main") {
      firm = await Firm.findOne({ _id: firmId, user_id: userId });
    } else {
      // Secondary user — check firm is in their firm_ids
      const isAssigned = user.firm_ids?.some(
        (id) => id.toString() === firmId.toString(),
      );
      if (!isAssigned)
        throw ApiError.forbidden("You do not have access to this firm");
      firm = await Firm.findById(firmId);
    }

    if (!firm) throw ApiError.notFound("Firm not found");
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

    // ── CASCADE DELETE ──

    // 1. Restore stock from all unbilled challans before deletion
    const challans = await Challan.find({ firm_id: firmId, user_id: userId });
    for (const challan of challans) {
      if (!challan.converted_to_bill && challan.items?.length > 0) {
        try {
          await stockService.restoreStock(challan.items, firm.type, userId);
        } catch (e) {
          // Best-effort stock restore; continue with deletion
        }
      }
    }

    // 2. Restore stock from all purchases before deletion
    const purchases = await Purchase.find({ firm_id: firmId, user_id: userId });
    for (const purchase of purchases) {
      if (purchase.items?.length > 0) {
        try {
          await stockService.removeStock(
            purchase.items,
            purchase.purchase_type,
            userId,
          );
        } catch (e) {
          // Best-effort stock restore
        }
      }
    }

    // 3. Delete all firm-scoped records
    await Promise.all([
      Transaction.deleteMany({ firm_id: firmId, user_id: userId }),
      Bill.deleteMany({ firm_id: firmId, user_id: userId }),
      Purchase.deleteMany({ firm_id: firmId, user_id: userId }),
      Challan.deleteMany({ firm_id: firmId, user_id: userId }),
      Party.deleteMany({ firm_id: firmId, user_id: userId }),
      Discount.deleteMany({ firm_id: firmId, user_id: userId }),
      StockAlert.deleteMany({ firm_id: firmId, user_id: userId }),
    ]);

    // 4. Pull firm_id from ALL users who had it assigned (owner + secondary users)
    await User.updateMany(
      { firm_ids: firmId },
      { $pull: { firm_ids: firmId } },
    );

    // 5. Delete the firm itself
    await Firm.findByIdAndDelete(firmId);
  }
}

export default new FirmService();
