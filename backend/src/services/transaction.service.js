import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import Bill from "../models/bill.model.js";
import Purchase from "../models/purchase.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class TransactionService {
  async getTransactions(firmId, userId, query) {
    const filter = { firm_id: firmId, user_id: userId };

    if (query.type) filter.type = query.type;
    if (query.payment_mode) filter.payment_mode = query.payment_mode;

    if (query.from_date || query.to_date) {
      filter.createdAt = {};
      if (query.from_date) filter.createdAt.$gte = new Date(query.from_date);
      if (query.to_date) filter.createdAt.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Transaction, filter, {
      ...query,
      populate: [
        { path: "party_id", select: "name" },
        { path: "supplier_id", select: "name" },
        { path: "bill_id", select: "amount payment_status" },
        { path: "purchase_id", select: "amount payment_status" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getTransactionById(transactionId, firmId, userId) {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      firm_id: firmId,
      user_id: userId,
    })
      .populate("party_id")
      .populate("supplier_id")
      .populate("bill_id")
      .populate("purchase_id");

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }
    return transaction;
  }

  async createSaleTransaction(transactionData, firmId, userId) {
    const { bill_id, amount, payment_mode, utr, transaction_ref, remarks } =
      transactionData;

    const bill = await Bill.findOne({
      _id: bill_id,
      firm_id: firmId,
      user_id: userId,
    });

    if (!bill) {
      throw ApiError.notFound("Bill not found");
    }

    const transaction = await Transaction.create({
      type: "sale",
      party_id: bill.party_id,
      bill_id,
      amount,
      payment_mode,
      utr,
      transaction_ref,
      remarks,
      firm_id: firmId,
      user_id: userId,
    });

    const newPaidAmount = bill.paid_amount + amount;
    let paymentStatus;

    if (newPaidAmount < bill.amount) {
      paymentStatus = "due";
    } else if (newPaidAmount === bill.amount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overpaid";
    }

    await Bill.findByIdAndUpdate(bill_id, {
      paid_amount: newPaidAmount,
      payment_status: paymentStatus,
    });

    return transaction.populate([
      { path: "party_id", select: "name" },
      { path: "bill_id", select: "amount" },
    ]);
  }

  async createPurchaseTransaction(transactionData, firmId, userId) {
    const { purchase_id, amount, payment_mode, utr, transaction_ref, remarks } =
      transactionData;

    const purchase = await Purchase.findOne({
      _id: purchase_id,
      firm_id: firmId,
      user_id: userId,
    });

    if (!purchase) {
      throw ApiError.notFound("Purchase not found");
    }

    const transaction = await Transaction.create({
      type: "purchase",
      supplier_id: purchase.supplier_id,
      purchase_id,
      amount,
      payment_mode,
      utr,
      transaction_ref,
      remarks,
      firm_id: firmId,
      user_id: userId,
    });

    const newPaidAmount = purchase.paid_amount + amount;
    let paymentStatus;

    if (newPaidAmount < purchase.amount) {
      paymentStatus = "due";
    } else if (newPaidAmount === purchase.amount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overpaid";
    }

    await Purchase.findByIdAndUpdate(purchase_id, {
      paid_amount: newPaidAmount,
      payment_status: paymentStatus,
    });

    return transaction.populate([
      { path: "supplier_id", select: "name" },
      { path: "purchase_id", select: "amount" },
    ]);
  }

  async getTransactionSummary(firmId, userId) {
    const firmObjectId = new mongoose.Types.ObjectId(firmId);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [
      totalTransactions,
      totalSaleAmount,
      totalPurchaseAmount,
      gstTransactions,
      nonGstTransactions,
    ] = await Promise.all([
      Transaction.countDocuments({ firm_id: firmId, user_id: userId }),
      Transaction.aggregate([
        {
          $match: {
            firm_id: firmObjectId,
            user_id: userObjectId,
            type: "sale",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            firm_id: firmObjectId,
            user_id: userObjectId,
            type: "purchase",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({
        firm_id: firmId,
        user_id: userId,
        type: "sale",
      }),
      Transaction.countDocuments({
        firm_id: firmId,
        user_id: userId,
        type: "purchase",
      }),
    ]);

    return {
      total_transactions: totalTransactions,
      total_sale_amount: totalSaleAmount[0]?.total || 0,
      total_purchase_amount: totalPurchaseAmount[0]?.total || 0,
      sale_transactions: gstTransactions,
      purchase_transactions: nonGstTransactions,
    };
  }
}

export default new TransactionService();
