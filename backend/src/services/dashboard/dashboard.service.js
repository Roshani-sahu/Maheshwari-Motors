import mongoose from "mongoose";
import Item from "../../models/master/item.model.js";
import Contact from "../../models/master/contact.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";

class DashboardService {
  async getDashboard(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      itemCount,
      partyCount,
      supplierCount,
      saleChallanCount,
      purchaseChallanCount,
      gstBillCount,
      nongstBillCount,
      lowStockCount,
      gstRevenue,
      nongstRevenue,
    ] = await Promise.all([
      Item.countDocuments({ user_id: userId }),
      Contact.countDocuments({ user_id: userId, type: "party" }),
      Contact.countDocuments({ user_id: userId, type: "supplier" }),
      Challan.countDocuments({ user_id: userId, challan_type: "sale" }),
      Challan.countDocuments({ user_id: userId, challan_type: "purchase" }),
      Bill.countDocuments({ user_id: userId, is_gst: 1 }),
      Bill.countDocuments({ user_id: userId, is_gst: 0 }),
      Item.countDocuments({
        user_id: userId,
        threshold: { $gt: 0 },
        $expr: { $lte: ["$stock", "$threshold"] },
      }),
      Bill.aggregate([
        { $match: { user_id: userObjectId, is_gst: 1 } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Bill.aggregate([
        { $match: { user_id: userObjectId, is_gst: 0 } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const recentChallans = await Challan.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("contact_id", "name type")
      .lean();

    const recentBills = await Bill.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("contact_id", "name type")
      .lean();

    return {
      counts: {
        items: itemCount,
        parties: partyCount,
        suppliers: supplierCount,
        sale_challans: saleChallanCount,
        purchase_challans: purchaseChallanCount,
        gst_bills: gstBillCount,
        nongst_bills: nongstBillCount,
        low_stock_items: lowStockCount,
      },
      revenue: {
        gst: gstRevenue[0]?.total || 0,
        nongst: nongstRevenue[0]?.total || 0,
      },
      recent_challans: recentChallans,
      recent_bills: recentBills,
    };
  }

  async getFirmDashboard(userId, isGst, period) {
    const filter = { user_id: userId, is_gst: isGst };
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const now = new Date();
    let startDate;
    if (period === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const periodFilter = { ...filter, createdAt: { $gte: startDate } };
    const aggPeriodFilter = {
      user_id: userObjectId,
      is_gst: isGst,
      createdAt: { $gte: startDate },
    };
    const purchasePeriodFilter = {
      user_id: userId,
      challan_type: "purchase",
      createdAt: { $gte: startDate },
    };
    const aggPurchasePeriodFilter = {
      user_id: userObjectId,
      challan_type: "purchase",
      createdAt: { $gte: startDate },
    };

    const [
      challanCount,
      billCount,
      revenue,
      pendingAmount,
      purchaseCount,
      purchaseAmount,
    ] = await Promise.all([
      Challan.countDocuments({ ...periodFilter, challan_type: "sale" }),
      Bill.countDocuments(periodFilter),
      Bill.aggregate([
        { $match: aggPeriodFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Bill.aggregate([
        {
          $match: {
            ...aggPeriodFilter,
            payment_status: { $ne: "paid" },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $subtract: ["$amount", "$paid_amount"] } },
          },
        },
      ]),
      Challan.countDocuments(purchasePeriodFilter),
      Challan.aggregate([
        { $match: aggPurchasePeriodFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const monthlyRevenue = await Bill.aggregate([
      {
        $match: {
          user_id: userObjectId,
          is_gst: isGst,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      period: period || "monthly",
      sale_challans: challanCount,
      purchase_challans: purchaseCount,
      bills: billCount,
      total_revenue: revenue[0]?.total || 0,
      pending_amount: pendingAmount[0]?.total || 0,
      purchase_amount: purchaseAmount[0]?.total || 0,
      monthly_revenue: monthlyRevenue,
    };
  }
}

export default new DashboardService();
