import mongoose from "mongoose";
import Transaction from "../../models/transaction/transaction.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Purchase from "../../models/transaction/purchase.model.js";
import Party from "../../models/master/party.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class TransactionService {
  async getTransactions(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

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

  async getTransactionById(transactionId, userId, isGst) {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("party_id")
      .populate("supplier_id")
      .populate("bill_id")
      .populate("purchase_id");

    if (!transaction) throw ApiError.notFound("Transaction not found");
    return transaction;
  }

  async createSaleTransaction(transactionData, userId, isGst) {
    const { bill_id, amount, payment_mode, utr, transaction_ref, remarks } =
      transactionData;

    const bill = await Bill.findOne({
      _id: bill_id,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

    const transaction = await Transaction.create({
      id: await getNextId("Transaction", userId),
      type: "sale",
      party_id: bill.party_id,
      bill_id,
      amount,
      payment_mode,
      utr,
      transaction_ref,
      remarks,
      user_id: userId,
      is_gst: isGst,
    });

    const newPaidAmount = bill.paid_amount + amount;
    let paymentStatus;
    let balanceToAdd = 0;

    if (newPaidAmount < bill.amount) {
      paymentStatus = "due";
    } else if (newPaidAmount === bill.amount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overpaid";
      balanceToAdd = newPaidAmount - bill.amount;
    }

    await Bill.findByIdAndUpdate(bill_id, {
      paid_amount: newPaidAmount,
      payment_status: paymentStatus,
    });

    if (balanceToAdd > 0) {
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: balanceToAdd },
      });
    }

    return transaction.populate([
      { path: "party_id", select: "name" },
      { path: "bill_id", select: "amount" },
    ]);
  }

  async createPurchaseTransaction(transactionData, userId, isGst) {
    const { purchase_id, amount, payment_mode, utr, transaction_ref, remarks } =
      transactionData;

    const purchase = await Purchase.findOne({
      _id: purchase_id,
      user_id: userId,
    });
    if (!purchase) throw ApiError.notFound("Purchase not found");

    const transaction = await Transaction.create({
      id: await getNextId("Transaction", userId),
      type: "purchase",
      supplier_id: purchase.supplier_id,
      purchase_id,
      amount,
      payment_mode,
      utr,
      transaction_ref,
      remarks,
      user_id: userId,
      is_gst: isGst,
    });

    const newPaidAmount = purchase.paid_amount + amount;
    let paymentStatus;
    if (newPaidAmount < purchase.amount) paymentStatus = "due";
    else if (newPaidAmount === purchase.amount) paymentStatus = "paid";
    else paymentStatus = "overpaid";

    await Purchase.findByIdAndUpdate(purchase_id, {
      paid_amount: newPaidAmount,
      payment_status: paymentStatus,
    });

    return transaction.populate([
      { path: "supplier_id", select: "name" },
      { path: "purchase_id", select: "amount" },
    ]);
  }

  async getTransactionSummary(userId, isGst) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const baseMatch = { user_id: userObjectId, is_gst: isGst };

    const [
      totalTransactions,
      totalSaleAmount,
      totalPurchaseAmount,
      saleCount,
      purchaseCount,
    ] = await Promise.all([
      Transaction.countDocuments({ user_id: userId, is_gst: isGst }),
      Transaction.aggregate([
        { $match: { ...baseMatch, type: "sale" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        { $match: { ...baseMatch, type: "purchase" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({
        user_id: userId,
        is_gst: isGst,
        type: "sale",
      }),
      Transaction.countDocuments({
        user_id: userId,
        is_gst: isGst,
        type: "purchase",
      }),
    ]);

    return {
      total_transactions: totalTransactions,
      total_sale_amount: totalSaleAmount[0]?.total || 0,
      total_purchase_amount: totalPurchaseAmount[0]?.total || 0,
      sale_transactions: saleCount,
      purchase_transactions: purchaseCount,
    };
  }

  async deleteTransaction(transactionId, userId, isGst) {
    const transaction = await Transaction.findOne({
      _id: transactionId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!transaction) throw ApiError.notFound("Transaction not found");

    if (transaction.type === "sale" && transaction.bill_id) {
      const bill = await Bill.findById(transaction.bill_id);
      if (bill) {
        const oldExcess =
          bill.paid_amount > bill.amount ? bill.paid_amount - bill.amount : 0;
        const newPaidAmount = Math.max(
          0,
          bill.paid_amount - transaction.amount,
        );
        const newExcess =
          newPaidAmount > bill.amount ? newPaidAmount - bill.amount : 0;
        const balanceToReverse = oldExcess - newExcess;
        if (balanceToReverse > 0) {
          await Party.findByIdAndUpdate(bill.party_id, {
            $inc: { balance: -balanceToReverse },
          });
        }

        let paymentStatus = "due";
        if (newPaidAmount >= bill.amount) paymentStatus = "paid";
        if (newPaidAmount > bill.amount) paymentStatus = "overpaid";
        await Bill.findByIdAndUpdate(transaction.bill_id, {
          paid_amount: newPaidAmount,
          payment_status: paymentStatus,
        });
      }
    } else if (transaction.type === "purchase" && transaction.purchase_id) {
      const purchase = await Purchase.findById(transaction.purchase_id);
      if (purchase) {
        const newPaidAmount = Math.max(
          0,
          purchase.paid_amount - transaction.amount,
        );
        let paymentStatus = "due";
        if (newPaidAmount >= purchase.amount) paymentStatus = "paid";
        if (newPaidAmount > purchase.amount) paymentStatus = "overpaid";
        await Purchase.findByIdAndUpdate(transaction.purchase_id, {
          paid_amount: newPaidAmount,
          payment_status: paymentStatus,
        });
      }
    }

    await Transaction.findByIdAndDelete(transactionId);
  }

  async getTransactionsByBill(billId, userId, isGst) {
    return Transaction.find({
      bill_id: billId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("party_id", "name")
      .sort({ createdAt: -1 });
  }

  async getTransactionsByPurchase(purchaseId, userId, isGst) {
    return Transaction.find({
      purchase_id: purchaseId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("supplier_id", "name")
      .sort({ createdAt: -1 });
  }
}

export default new TransactionService();
