import mongoose from "mongoose";
import Item from "../../models/master/item.model.js";
import Party from "../../models/master/party.model.js";
import Supplier from "../../models/master/supplier.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import Purchase from "../../models/transaction/purchase.model.js";

class DashboardService {
  async getDashboard(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      itemCount,
      partyCount,
      supplierCount,
      gstChallanCount,
      nongstChallanCount,
      gstBillCount,
      nongstBillCount,
      gstRevenue,
      nongstRevenue,
    ] = await Promise.all([
      Item.countDocuments({ user_id: userId }),
      Party.countDocuments({ user_id: userId }),
      Supplier.countDocuments({ user_id: userId }),
      Challan.countDocuments({ user_id: userId, is_gst: 1 }),
      Challan.countDocuments({ user_id: userId, is_gst: 0 }),
      Bill.countDocuments({ user_id: userId, is_gst: 1 }),
      Bill.countDocuments({ user_id: userId, is_gst: 0 }),
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
      .populate("party_id", "name")
      .lean();

    const recentBills = await Bill.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("party_id", "name")
      .lean();

    return {
      counts: {
        items: itemCount,
        parties: partyCount,
        suppliers: supplierCount,
        gst_challans: gstChallanCount,
        nongst_challans: nongstChallanCount,
        gst_bills: gstBillCount,
        nongst_bills: nongstBillCount,
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
    if (period === "yearly") {
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
    const purchaseType = isGst === 1 ? "GST" : "NON_GST";
    const purchaseFilter = {
      user_id: userId,
      purchase_type: purchaseType,
      createdAt: { $gte: startDate },
    };
    const aggPurchaseFilter = {
      user_id: userObjectId,
      purchase_type: purchaseType,
      createdAt: { $gte: startDate },
    };

    const [
      challanCount,
      billCount,
      revenue,
      pendingAmount,
      transactionCount,
      purchaseCount,
      purchaseAmount,
    ] = await Promise.all([
      Challan.countDocuments(periodFilter),
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
      Transaction.countDocuments(periodFilter),
      Purchase.countDocuments(purchaseFilter),
      Purchase.aggregate([
        { $match: aggPurchaseFilter },
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
      challans: challanCount,
      bills: billCount,
      total_revenue: revenue[0]?.total || 0,
      pending_amount: pendingAmount[0]?.total || 0,
      transactions: transactionCount,
      purchases: purchaseCount,
      purchase_amount: purchaseAmount[0]?.total || 0,
      monthly_revenue: monthlyRevenue,
    };
  }
}

export default new DashboardService();
