import mongoose from "mongoose";
import Firm from "../models/firm.model.js";
import User from "../models/user.model.js";
import Challan from "../models/challan.model.js";
import Bill from "../models/bill.model.js";
import Item from "../models/item.model.js";
import StockAlert from "../models/stockAlert.model.js";

class DashboardService {
  async getDashboard(userId) {
    // For secondary users, scope to firms they have access to
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    let firmFilter;
    if (user.type === "main") {
      firmFilter = { user_id: userId };
    } else {
      firmFilter = { _id: { $in: user.firm_ids || [] } };
    }

    const firmIds = (await Firm.find(firmFilter).select("_id").lean()).map(
      (f) => f._id,
    );

    // For data queries, use firm_id scope instead of user_id
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
      StockAlert.countDocuments({ user_id: userId, is_resolved: false }),
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

  async getFirmDashboard(firmId, userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayChallans,
      monthChallans,
      totalChallans,
      todayBills,
      monthBills,
      totalBills,
      dueBills,
      paidBills,
      recentChallans,
      recentBills,
    ] = await Promise.all([
      Challan.countDocuments({
        firm_id: firmId,
        user_id: userId,
        createdAt: { $gte: today },
      }),
      Challan.countDocuments({
        firm_id: firmId,
        user_id: userId,
        createdAt: { $gte: thisMonth },
      }),
      Challan.countDocuments({
        firm_id: firmId,
        user_id: userId,
        converted_to_bill: false,
      }),
      Bill.countDocuments({
        firm_id: firmId,
        user_id: userId,
        createdAt: { $gte: today },
      }),
      Bill.countDocuments({
        firm_id: firmId,
        user_id: userId,
        createdAt: { $gte: thisMonth },
      }),
      Bill.countDocuments({ firm_id: firmId, user_id: userId }),
      Bill.countDocuments({
        firm_id: firmId,
        user_id: userId,
        payment_status: "due",
      }),
      Bill.countDocuments({
        firm_id: firmId,
        user_id: userId,
        payment_status: "paid",
      }),
      Challan.find({
        firm_id: firmId,
        user_id: userId,
        converted_to_bill: false,
      })
        .populate("party_id", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Bill.find({ firm_id: firmId, user_id: userId })
        .populate("party_id", "name")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const firmObjectId = new mongoose.Types.ObjectId(firmId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [totalChallanAmount, totalBillAmount, totalPaidAmount] =
      await Promise.all([
        Challan.aggregate([
          {
            $match: {
              firm_id: firmObjectId,
              user_id: userObjectId,
              converted_to_bill: false,
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Bill.aggregate([
          { $match: { firm_id: firmObjectId, user_id: userObjectId } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Bill.aggregate([
          { $match: { firm_id: firmObjectId, user_id: userObjectId } },
          { $group: { _id: null, total: { $sum: "$paid_amount" } } },
        ]),
      ]);

    return {
      challans: {
        today: todayChallans,
        this_month: monthChallans,
        total: totalChallans,
        total_amount: totalChallanAmount[0]?.total || 0,
      },
      bills: {
        today: todayBills,
        this_month: monthBills,
        total: totalBills,
        due: dueBills,
        paid: paidBills,
        total_amount: totalBillAmount[0]?.total || 0,
        total_paid: totalPaidAmount[0]?.total || 0,
      },
      recent_challans: recentChallans,
      recent_bills: recentBills,
    };
  }
}

export default new DashboardService();
