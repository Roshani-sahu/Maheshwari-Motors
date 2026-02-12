import mongoose from "mongoose";
import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
import User from "../models/user.model.js";
import Challan from "../models/challan.model.js";
import Bill from "../models/bill.model.js";
import Item from "../models/item.model.js";
import StockAlert from "../models/stockAlert.model.js";

class DashboardService {
  /**
   * Main dashboard: admin sees all their firms, firm login sees own firm,
   * legacy user sees all their firms.
   */
  async getDashboard(ownerId, role, firmObj) {
    let firmIds;

    if (role === "firm") {
      // Firm login — show paired firms
      const pair = await FirmPair.findOne({
        $or: [{ gst_firm_id: firmObj._id }, { nongst_firm_id: firmObj._id }],
      });
      firmIds = pair ? [pair.gst_firm_id, pair.nongst_firm_id] : [firmObj._id];
    } else if (role === "admin") {
      // Admin — all firms they own
      firmIds = (
        await Firm.find({ admin_id: ownerId }).select("_id").lean()
      ).map((f) => f._id);
    } else {
      // Legacy user login
      const user = await User.findById(ownerId);
      if (!user) throw new Error("User not found");

      let firmFilter;
      if (user.type === "main") {
        firmFilter = { user_id: ownerId };
      } else {
        firmFilter = { _id: { $in: user.firm_ids || [] } };
      }
      firmIds = (await Firm.find(firmFilter).select("_id").lean()).map(
        (f) => f._id,
      );
    }

    const dataFilter = { firm_id: { $in: firmIds } };

    const [
      firmsCount,
      challansCount,
      billsCount,
      lowStockCount,
      recentChallans,
      recentBills,
    ] = await Promise.all([
      firmIds.length,
      Challan.countDocuments({ ...dataFilter, converted_to_bill: false }),
      Bill.countDocuments(dataFilter),
      StockAlert.countDocuments({ user_id: ownerId, is_resolved: false }),
      Challan.find({ ...dataFilter, converted_to_bill: false })
        .populate("party_id", "name")
        .populate("firm_id", "name type")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Bill.find(dataFilter)
        .populate("party_id", "name")
        .populate("firm_id", "name type")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return {
      summary: {
        total_firms: firmsCount,
        total_challans: challansCount,
        total_bills: billsCount,
        low_stock_items: lowStockCount,
      },
      recent_challans: recentChallans,
      recent_bills: recentBills,
    };
  }

  async getFirmDashboard(firmId, userId, period = "all_time") {
    // Build date filter based on period
    const now = new Date();
    let dateFilter = {};

    if (period === "today") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfDay } };
    } else if (period === "last_month") {
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
    } else if (period === "last_year") {
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: oneYearAgo } };
    }
    // all_time → no dateFilter

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const baseChallanFilter = { firm_id: firmId };
    if (userId) baseChallanFilter.user_id = userId;
    const baseBillFilter = { firm_id: firmId };
    if (userId) baseBillFilter.user_id = userId;
    const periodChallanFilter = { ...baseChallanFilter, ...dateFilter };
    const periodBillFilter = { ...baseBillFilter, ...dateFilter };

    const [
      periodChallans,
      periodBills,
      dueBills,
      paidBills,
      recentChallans,
      recentBills,
    ] = await Promise.all([
      Challan.countDocuments(periodChallanFilter),
      Bill.countDocuments(periodBillFilter),
      Bill.countDocuments({ ...periodBillFilter, payment_status: "due" }),
      Bill.countDocuments({ ...periodBillFilter, payment_status: "paid" }),
      Challan.find({ ...periodChallanFilter, converted_to_bill: false })
        .populate("party_id", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Bill.find(periodBillFilter)
        .populate("party_id", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const firmObjectId = new mongoose.Types.ObjectId(firmId);
    const baseAggMatch = { firm_id: firmObjectId };
    if (userId) baseAggMatch.user_id = new mongoose.Types.ObjectId(userId);

    // Build aggregation match with date filter
    const aggChallanMatch = {
      ...baseAggMatch,
      ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
    };
    const aggBillMatch = {
      ...baseAggMatch,
      ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
    };

    const [totalChallanAmount, totalBillAmount, totalPaidAmount] =
      await Promise.all([
        Challan.aggregate([
          { $match: aggChallanMatch },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Bill.aggregate([
          { $match: aggBillMatch },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Bill.aggregate([
          { $match: aggBillMatch },
          { $group: { _id: null, total: { $sum: "$paid_amount" } } },
        ]),
      ]);

    // Monthly chart data: last 6 months of challans & bills
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [challansByMonth, billsByMonth] = await Promise.all([
      Challan.aggregate([
        {
          $match: {
            ...baseAggMatch,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Bill.aggregate([
        {
          $match: {
            ...baseAggMatch,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return {
      challans: {
        total: periodChallans,
        total_amount: totalChallanAmount[0]?.total || 0,
      },
      bills: {
        total: periodBills,
        due: dueBills,
        paid: paidBills,
        total_amount: totalBillAmount[0]?.total || 0,
        total_paid: totalPaidAmount[0]?.total || 0,
      },
      chart: {
        challans_by_month: challansByMonth,
        bills_by_month: billsByMonth,
      },
      recent_challans: recentChallans,
      recent_bills: recentBills,
    };
  }
}

export default new DashboardService();
