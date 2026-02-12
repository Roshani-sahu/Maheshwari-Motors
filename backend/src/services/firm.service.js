import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
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
  /**
   * Get firms visible to the current user/firm/admin
   */
  async getFirms(ownerId, role, firmObj, query) {
    let filter;

    if (role === "firm") {
      // Firm login — return own firm + paired firm
      const pair = await FirmPair.findOne({
        $or: [{ gst_firm_id: firmObj._id }, { nongst_firm_id: firmObj._id }],
      });
      const ids =
        pair ? [pair.gst_firm_id, pair.nongst_firm_id] : [firmObj._id];
      filter = { _id: { $in: ids } };
    } else if (role === "admin") {
      // Admin — all firms they created
      filter = { admin_id: ownerId };
    } else {
      // Legacy user login
      const user = await User.findById(ownerId);
      if (!user) throw ApiError.notFound("User not found");
      if (user.type === "main") {
        filter = { user_id: ownerId };
      } else {
        filter = { _id: { $in: user.firm_ids || [] } };
      }
    }

    return Pagination.paginate(Firm, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getFirmById(firmId, ownerId, role, firmObj) {
    if (role === "firm") {
      // Firm login — can access own or paired firm (middleware already validated)
      const firm = await Firm.findById(firmId);
      if (!firm) throw ApiError.notFound("Firm not found");
      return firm;
    }

    if (role === "admin") {
      const firm = await Firm.findOne({ _id: firmId, admin_id: ownerId });
      if (!firm) throw ApiError.notFound("Firm not found");
      return firm;
    }

    // Legacy user
    const user = await User.findById(ownerId);
    if (!user) throw ApiError.notFound("User not found");

    let firm;
    if (user.type === "main") {
      firm = await Firm.findOne({ _id: firmId, user_id: ownerId });
    } else {
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
    const filter = { _id: firmId };
    if (userId) filter.user_id = userId;
    const firm = await Firm.findOne(filter);
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    // ── CASCADE DELETE ──

    // 1. Restore stock from all unbilled GST challans before deletion
    //    (NON_GST challans never deducted stock, so nothing to restore)
    const challans = await Challan.find({ firm_id: firmId });
    for (const challan of challans) {
      if (
        !challan.converted_to_bill &&
        challan.is_gst === 1 &&
        challan.items?.length > 0
      ) {
        try {
          await stockService.restoreStock(challan.items, userId);
        } catch (e) {
          // Best-effort stock restore; continue with deletion
        }
      }
    }

    // 2. Restore stock from all purchases before deletion
    const purchases = await Purchase.find({ firm_id: firmId });
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
      Transaction.deleteMany({ firm_id: firmId }),
      Bill.deleteMany({ firm_id: firmId }),
      Purchase.deleteMany({ firm_id: firmId }),
      Challan.deleteMany({ firm_id: firmId }),
      Party.deleteMany({ firm_id: firmId }),
      Discount.deleteMany({ firm_id: firmId }),
      StockAlert.deleteMany({ firm_id: firmId }),
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
