import Bill from "../models/bill.model.js";
import Challan from "../models/challan.model.js";
import Party from "../models/party.model.js";
import Transaction from "../models/transaction.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class BillService {
  async getBills(firmId, userId, query) {
    const filter = { firm_id: firmId };
    // Only add user_id filter if userId is provided (backward compat)
    if (userId) filter.user_id = userId;

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

  async getBillById(billId, firmId, userId) {
    const filter = { _id: billId, firm_id: firmId };
    if (userId) filter.user_id = userId;

    const bill = await Bill.findOne(filter)
      .populate("party_id")
      .populate({
        path: "challan_ids",
        populate: { path: "items.item_id", select: "item_name" },
      });

    if (!bill) {
      throw ApiError.notFound("Bill not found");
    }
    return bill;
  }

  /**
   * Create a bill from challans.
   *
   * Since challans are already split by firm (auto-split at challan creation),
   * each bill belongs to exactly one firm. No bill splitting needed.
   */
  async createBill(billData, firmId, userId) {
    const {
      challan_ids,
      party_id,
      apply_balance = false,
      delivered_amount,
    } = billData;

    if (!challan_ids || challan_ids.length === 0) {
      throw ApiError.badRequest("At least one challan is required");
    }

    // Fetch and validate challans (must belong to this firm)
    const challans = await Challan.find({
      _id: { $in: challan_ids },
      party_id,
      firm_id: firmId,
      converted_to_bill: false,
    });

    if (challans.length !== challan_ids.length) {
      throw ApiError.badRequest(
        "Some challans are invalid, already billed, or do not belong to this party/firm",
      );
    }

    // Determine bill is_gst from the challans (all should be same type for this firm)
    const billIsGst = challans[0].is_gst;

    let totalAmount = challans.reduce(
      (sum, challan) => sum + challan.amount,
      0,
    );

    const party = await Party.findById(party_id);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }

    // Validate delivered_amount FIRST (before any DB writes)
    let deliveredNum = null;
    if (delivered_amount !== undefined && delivered_amount !== null) {
      deliveredNum = Number(delivered_amount);
      if (isNaN(deliveredNum) || deliveredNum < 0) {
        throw ApiError.badRequest(
          "Delivered amount must be a non-negative number",
        );
      }
    }

    // Party balance logic
    let balanceApplied = 0;

    if (apply_balance && party.balance !== 0) {
      balanceApplied = party.balance;
      totalAmount -= party.balance;
    }

    // Prevent negative bill amount
    if (totalAmount < 0) totalAmount = 0;

    // Validate delivered amount against adjusted total
    if (deliveredNum !== null && deliveredNum > totalAmount) {
      throw ApiError.badRequest("Delivered amount cannot exceed total amount");
    }

    // All validation passed — NOW zero the party balance
    if (balanceApplied !== 0) {
      await Party.findByIdAndUpdate(party_id, { balance: 0 });
    }

    // Partial delivery logic
    let partialReturnAmount = 0;
    let billAmount = totalAmount;

    if (deliveredNum !== null) {
      partialReturnAmount = totalAmount - deliveredNum;
      billAmount = deliveredNum;
    }

    const billCount = await Bill.countDocuments({ firm_id: firmId });
    const bill_no = `BL-${String(billCount + 1).padStart(6, "0")}`;

    const bill = await Bill.create({
      bill_no,
      party_id,
      date: new Date(),
      amount: billAmount,
      return_amount: partialReturnAmount,
      challan_ids,
      firm_id: firmId,
      user_id: userId,
      is_gst: billIsGst,
      paid_amount: 0,
      payment_status: "due",
      // NON_GST bills never affect physical stock (stock was never deducted)
      skip_stock_calculation: billIsGst === 0,
    });

    // Credit undelivered amount to party balance
    if (partialReturnAmount > 0) {
      await Party.findByIdAndUpdate(party_id, {
        $inc: { balance: partialReturnAmount },
      });
    }

    // Mark challans as converted
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

  async recordPayment(billId, firmId, userId, amount) {
    const filter = { _id: billId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const bill = await Bill.findOne(filter);

    if (!bill) {
      throw ApiError.notFound("Bill not found");
    }

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

  async handleReturn(billId, firmId, userId, returnAmount) {
    const filter = { _id: billId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const bill = await Bill.findOne(filter);

    if (!bill) {
      throw ApiError.notFound("Bill not found");
    }

    if (returnAmount > bill.amount) {
      throw ApiError.badRequest("Return amount cannot exceed bill amount");
    }

    const newAmount = bill.amount - returnAmount;
    let paymentStatus;
    if (bill.paid_amount < newAmount) {
      paymentStatus = "due";
    } else if (bill.paid_amount === newAmount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overpaid";
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        amount: newAmount,
        payment_status: paymentStatus,
        $inc: { return_amount: returnAmount },
      },
      { new: true },
    ).populate("party_id", "name balance");

    // Credit party balance with the return amount
    await Party.findByIdAndUpdate(bill.party_id, {
      $inc: { balance: returnAmount },
    });

    return updatedBill;
  }

  async getBillSummary(firmId, userId) {
    const baseFilter = { firm_id: firmId };
    if (userId) baseFilter.user_id = userId;
    const [total, paid, due] = await Promise.all([
      Bill.countDocuments(baseFilter),
      Bill.countDocuments({ ...baseFilter, payment_status: "paid" }),
      Bill.countDocuments({ ...baseFilter, payment_status: "due" }),
    ]);

    return { total, paid, due };
  }

  async deleteBill(billId, firmId, userId) {
    const filter = { _id: billId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const bill = await Bill.findOne(filter);

    if (!bill) {
      throw ApiError.notFound("Bill not found");
    }

    // If overpaid, the excess was credited to party balance — reverse it
    if (bill.paid_amount > bill.amount) {
      const excessAmount = bill.paid_amount - bill.amount;
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: -excessAmount },
      });
    }

    // If returns were processed AND we are NOT already in overpaid state
    // (overpaid state means return already accounted for above as part of excess)
    if (bill.return_amount > 0 && bill.paid_amount <= bill.amount) {
      await Party.findByIdAndUpdate(bill.party_id, {
        $inc: { balance: -bill.return_amount },
      });
    }

    // Release challans back to unbilled state
    await Challan.updateMany(
      { _id: { $in: bill.challan_ids } },
      { converted_to_bill: false, bill_id: null },
    );

    // Delete all transactions associated with this bill
    await Transaction.deleteMany({ bill_id: billId, firm_id: firmId });

    await Bill.findByIdAndDelete(billId);
  }

  async getBillsForParty(partyId, firmId, userId, query) {
    const filter = { party_id: partyId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    if (query.payment_status) filter.payment_status = query.payment_status;
    return Pagination.paginate(Bill, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }
}

export default new BillService();
