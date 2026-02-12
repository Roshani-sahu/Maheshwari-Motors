import mongoose from "mongoose";
import Transaction from "../models/transaction.model.js";
import Bill from "../models/bill.model.js";
import Purchase from "../models/purchase.model.js";
import Party from "../models/party.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class TransactionService {
  async getTransactions(firmId, userId, query) {
    const filter = { firm_id: firmId };
    if (userId) filter.user_id = userId;

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
    const filter = { _id: transactionId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const transaction = await Transaction.findOne(filter)
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
      ...(userId && { user_id: userId }),
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

    // Credit excess to party balance
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

  async createPurchaseTransaction(transactionData, firmId, userId) {
    const { purchase_id, amount, payment_mode, utr, transaction_ref, remarks } =
      transactionData;

    const purchase = await Purchase.findOne({
      _id: purchase_id,
      firm_id: firmId,
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
      ...(userId && { user_id: userId }),
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
    const baseMatch = { firm_id: firmObjectId };
    if (userId) baseMatch.user_id = new mongoose.Types.ObjectId(userId);

    const [
      totalTransactions,
      totalSaleAmount,
      totalPurchaseAmount,
      gstTransactions,
      nonGstTransactions,
    ] = await Promise.all([
      Transaction.countDocuments({
        firm_id: firmId,
        ...(userId && { user_id: userId }),
      }),
      Transaction.aggregate([
        {
          $match: {
            ...baseMatch,
            type: "sale",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            ...baseMatch,
            type: "purchase",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.countDocuments({
        firm_id: firmId,
        ...(userId && { user_id: userId }),
        type: "sale",
      }),
      Transaction.countDocuments({
        firm_id: firmId,
        ...(userId && { user_id: userId }),
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

  async deleteTransaction(transactionId, firmId, userId) {
    const filter = { _id: transactionId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const transaction = await Transaction.findOne(filter);

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    // Reverse the payment on the linked bill or purchase
    if (transaction.type === "sale" && transaction.bill_id) {
      const bill = await Bill.findById(transaction.bill_id);
      if (bill) {
        // Check if bill was overpaid BEFORE reversal (excess was credited to party)
        const oldExcess =
          bill.paid_amount > bill.amount ? bill.paid_amount - bill.amount : 0;

        const newPaidAmount = Math.max(
          0,
          bill.paid_amount - transaction.amount,
        );

        // Check if bill is STILL overpaid after reversal
        const newExcess =
          newPaidAmount > bill.amount ? newPaidAmount - bill.amount : 0;

        // Reverse the net change in party balance from overpayment
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

  async getTransactionsByBill(billId, firmId, userId) {
    const filter = { bill_id: billId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    return Transaction.find(filter)
      .populate("party_id", "name")
      .sort({ createdAt: -1 });
  }

  async getTransactionsByPurchase(purchaseId, firmId, userId) {
    const filter = { purchase_id: purchaseId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    return Transaction.find(filter)
      .populate("supplier_id", "name")
      .sort({ createdAt: -1 });
  }
}

export default new TransactionService();
