import Bill from "../models/bill.model.js";
import Challan from "../models/challan.model.js";
import Party from "../models/party.model.js";
import Transaction from "../models/transaction.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class BillService {
  async getBills(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

    if (query.party_id) filter.party_id = query.party_id;
    if (query.payment_status) filter.payment_status = query.payment_status;

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Bill, filter, {
      ...query,
      populate: { path: "party_id", select: "name phone balance" },
      sort: { createdAt: -1 },
    });
  }

  async getBillById(billId, userId, isGst) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("party_id")
      .populate({
        path: "challan_ids",
        populate: { path: "items.item_id", select: "item_name" },
      });

    if (!bill) throw ApiError.notFound("Bill not found");
    return bill;
  }

  async createBill(billData, userId, isGst) {
    const {
      challan_ids,
      party_id,
      apply_balance = false,
      delivered_amount,
    } = billData;

    if (!challan_ids || challan_ids.length === 0) {
      throw ApiError.badRequest("At least one challan is required");
    }

    const challans = await Challan.find({
      _id: { $in: challan_ids },
      party_id,
      user_id: userId,
      is_gst: isGst,
      converted_to_bill: false,
    });

    if (challans.length !== challan_ids.length) {
      throw ApiError.badRequest(
        "Some challans are invalid, already billed, or do not belong to this party/firm",
      );
    }

    let totalAmount = challans.reduce(
      (sum, challan) => sum + challan.amount,
      0,
    );

    const party = await Party.findById(party_id);
    if (!party) throw ApiError.notFound("Party not found");

    let deliveredNum = null;
    if (delivered_amount !== undefined && delivered_amount !== null) {
      deliveredNum = Number(delivered_amount);
      if (isNaN(deliveredNum) || deliveredNum < 0) {
        throw ApiError.badRequest(
          "Delivered amount must be a non-negative number",
        );
      }
    }

    let balanceApplied = 0;
    if (apply_balance && party.balance !== 0) {
      balanceApplied = party.balance;
      totalAmount -= party.balance;
    }

    if (totalAmount < 0) totalAmount = 0;

    if (deliveredNum !== null && deliveredNum > totalAmount) {
      throw ApiError.badRequest("Delivered amount cannot exceed total amount");
    }

    if (balanceApplied !== 0) {
      await Party.findByIdAndUpdate(party_id, { balance: 0 });
    }

    let partialReturnAmount = 0;
    let billAmount = totalAmount;

    if (deliveredNum !== null) {
      partialReturnAmount = totalAmount - deliveredNum;
      billAmount = deliveredNum;
    }

    const billCount = await Bill.countDocuments({
      user_id: userId,
      is_gst: isGst,
    });
    const bill_no = `BL-${String(billCount + 1).padStart(6, "0")}`;

    const bill = await Bill.create({
      bill_no,
      party_id,
      date: new Date(),
      amount: billAmount,
      return_amount: partialReturnAmount,
      challan_ids,
      user_id: userId,
      is_gst: isGst,
      paid_amount: 0,
      payment_status: "due",
      skip_stock_calculation: isGst === 0,
    });

    if (partialReturnAmount > 0) {
      await Party.findByIdAndUpdate(party_id, {
        $inc: { balance: partialReturnAmount },
      });
    }

    await Challan.updateMany(
      { _id: { $in: challan_ids } },
      { converted_to_bill: true, bill_id: bill._id },
    );

    const populatedBill = await Bill.findById(bill._id)
      .populate("party_id", "name balance")
      .populate({
        path: "challan_ids",
        select: "amount discount sub_total date items",
      });

    return {
      bill: populatedBill,
      balance_applied: balanceApplied,
      partial_return: partialReturnAmount,
    };
  }

  async recordPayment(billId, userId, isGst, amount) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

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

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      { paid_amount: newPaidAmount, payment_status: paymentStatus },
      { new: true },
    ).populate("party_id", "name balance");

    if (balanceToAdd > 0) {
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: balanceToAdd },
      });
    }

    return updatedBill;
  }

  async handleReturn(billId, userId, isGst, returnAmount) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

    if (returnAmount > bill.amount) {
      throw ApiError.badRequest("Return amount cannot exceed bill amount");
    }

    const newAmount = bill.amount - returnAmount;
    let paymentStatus;
    if (bill.paid_amount < newAmount) paymentStatus = "due";
    else if (bill.paid_amount === newAmount) paymentStatus = "paid";
    else paymentStatus = "overpaid";

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        amount: newAmount,
        payment_status: paymentStatus,
        $inc: { return_amount: returnAmount },
      },
      { new: true },
    ).populate("party_id", "name balance");

    await Party.findByIdAndUpdate(bill.party_id, {
      $inc: { balance: returnAmount },
    });

    return updatedBill;
  }

  async getBillSummary(userId, isGst) {
    const baseFilter = { user_id: userId, is_gst: isGst };
    const [total, paid, due] = await Promise.all([
      Bill.countDocuments(baseFilter),
      Bill.countDocuments({ ...baseFilter, payment_status: "paid" }),
      Bill.countDocuments({ ...baseFilter, payment_status: "due" }),
    ]);
    return { total, paid, due };
  }

  async deleteBill(billId, userId, isGst) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

    if (bill.paid_amount > bill.amount) {
      const excessAmount = bill.paid_amount - bill.amount;
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: -excessAmount },
      });
    }

    if (bill.return_amount > 0 && bill.paid_amount <= bill.amount) {
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: -bill.return_amount },
      });
    }

    await Challan.updateMany(
      { _id: { $in: bill.challan_ids } },
      { converted_to_bill: false, bill_id: null },
    );

    await Transaction.deleteMany({
      bill_id: billId,
      user_id: userId,
    });

    await Bill.findByIdAndDelete(billId);
  }

  async getBillsForParty(partyId, userId, isGst, query) {
    const filter = {
      party_id: partyId,
      user_id: userId,
      is_gst: isGst,
    };
    if (query.payment_status) filter.payment_status = query.payment_status;
    return Pagination.paginate(Bill, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }
}

export default new BillService();
