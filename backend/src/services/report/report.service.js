import mongoose from "mongoose";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Contact from "../../models/master/contact.model.js";

class ReportService {
  async getPurchaseReport(userId, isGst, query = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = { user_id: userObjectId, challan_type: "purchase" };

    if (isGst !== undefined && isGst !== null) {
      filter.is_gst = Number(isGst);
    }

    if (query.from_date || query.to_date) {
      filter.createdAt = {};
      if (query.from_date) filter.createdAt.$gte = new Date(query.from_date);
      if (query.to_date) filter.createdAt.$lte = new Date(query.to_date);
    }

    const [totalAmount, purchaseCount, supplierCount, topSuppliers] =
      await Promise.all([
        Challan.aggregate([
          { $match: filter },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        Challan.countDocuments(filter),
        Contact.countDocuments({ user_id: userId, type: "supplier" }),
        Challan.aggregate([
          { $match: filter },
          {
            $group: {
              _id: "$contact_id",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { total: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "contacts",
              localField: "_id",
              foreignField: "_id",
              as: "contact",
            },
          },
          { $unwind: "$contact" },
          {
            $project: {
              _id: 1,
              name: "$contact.name",
              total: 1,
              count: 1,
            },
          },
        ]),
      ]);

    return {
      total_purchases: totalAmount[0]?.total || 0,
      total_suppliers: supplierCount,
      total_purchase_challans: purchaseCount,
      top_suppliers: topSuppliers,
    };
  }

  async getSalesReport(userId, isGst, query = {}) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const filter = { user_id: userObjectId, is_gst: isGst };

    if (query.from_date || query.to_date) {
      filter.createdAt = {};
      if (query.from_date) filter.createdAt.$gte = new Date(query.from_date);
      if (query.to_date) filter.createdAt.$lte = new Date(query.to_date);
    }

    const [totalAmount, billCount, partyCount, topParties] = await Promise.all([
      Bill.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Bill.countDocuments(filter),
      Contact.countDocuments({ user_id: userId, type: "party" }),
      Bill.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$contact_id",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "contacts",
            localField: "_id",
            foreignField: "_id",
            as: "contact",
          },
        },
        { $unwind: "$contact" },
        {
          $project: {
            _id: 1,
            name: "$contact.name",
            total: 1,
            count: 1,
          },
        },
      ]),
    ]);

    return {
      total_sales: totalAmount[0]?.total || 0,
      total_parties: partyCount,
      total_bills: billCount,
      top_parties: topParties,
    };
  }
}

export default new ReportService();
