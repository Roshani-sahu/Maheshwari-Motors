import Bill from "../../models/transaction/bill.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Contact from "../../models/master/contact.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class BillService {
  async getBills(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

    if (query.contact_id) filter.contact_id = query.contact_id;
    if (query.payment_status) filter.payment_status = query.payment_status;

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Bill, filter, {
      ...query,
      populate: { path: "contact_id", select: "name phone type balance" },
      sort: { createdAt: -1 },
    });
  }

  async getBillById(billId, userId, isGst) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate("contact_id")
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
      contact_id,
      apply_balance = false,
      delivered_amount,
    } = billData;

    if (!challan_ids || challan_ids.length === 0) {
      throw ApiError.badRequest("At least one challan is required");
    }

    const challans = await Challan.find({
      _id: { $in: challan_ids },
      contact_id,
      user_id: userId,
      is_gst: isGst,
      challan_type: "sale",
      converted_to_bill: false,
    });

    if (challans.length !== challan_ids.length) {
      throw ApiError.badRequest(
        "Some challans are invalid, already billed, or do not belong to this contact/firm",
      );
    }

    let totalAmount = challans.reduce(
      (sum, challan) => sum + challan.amount,
      0,
    );

    const contact = await Contact.findById(contact_id);
    if (!contact) throw ApiError.notFound("Contact not found");

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
    if (apply_balance && contact.balance !== 0) {
      balanceApplied = contact.balance;
      totalAmount -= contact.balance;
    }

    if (totalAmount < 0) totalAmount = 0;

    if (deliveredNum !== null && deliveredNum > totalAmount) {
      throw ApiError.badRequest("Delivered amount cannot exceed total amount");
    }

    if (balanceApplied !== 0) {
      await Contact.findByIdAndUpdate(contact_id, { balance: 0 });
    }

    let partialReturnAmount = 0;
    let billAmount = totalAmount;

    if (deliveredNum !== null) {
      partialReturnAmount = totalAmount - deliveredNum;
      billAmount = deliveredNum;
    }

    const billNoSeq = await getNextId(
      `BillNo_${isGst === 1 ? "GST" : "NONGST"}`,
      userId,
    );
    const bill_no = `BL-${String(billNoSeq).padStart(6, "0")}`;
    const nextId = await getNextId("Bill", userId);

    const bill = await Bill.create({
      id: nextId,
      bill_no,
      contact_id,
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
      await Contact.findByIdAndUpdate(contact_id, {
        $inc: { balance: partialReturnAmount },
      });
    }

    await Challan.updateMany(
      { _id: { $in: challan_ids } },
      { converted_to_bill: true, bill_id: bill._id },
    );

    const populatedBill = await Bill.findById(bill._id)
      .populate("contact_id", "name type balance")
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

    const newPaidAmount = Math.round((bill.paid_amount + amount) * 100) / 100;
    let paymentStatus;
    let balanceToAdd = 0;

    if (Math.abs(newPaidAmount - bill.amount) < 0.01) {
      paymentStatus = "paid";
    } else if (newPaidAmount < bill.amount) {
      paymentStatus = "due";
    } else {
      paymentStatus = "overpaid";
      balanceToAdd = Math.round((newPaidAmount - bill.amount) * 100) / 100;
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      { paid_amount: newPaidAmount, payment_status: paymentStatus },
      { new: true },
    ).populate("contact_id", "name type balance");

    if (balanceToAdd > 0) {
      await Contact.findByIdAndUpdate(bill.contact_id, {
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
    ).populate("contact_id", "name type balance");

    await Contact.findByIdAndUpdate(bill.contact_id, {
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
      await Contact.findByIdAndUpdate(bill.contact_id, {
        $inc: { balance: -excessAmount },
      });
    }

    if (bill.return_amount > 0) {
      await Contact.findByIdAndUpdate(bill.contact_id, {
        $inc: { balance: -bill.return_amount },
      });
    }

    await Challan.updateMany(
      { _id: { $in: bill.challan_ids } },
      { converted_to_bill: false, bill_id: null },
    );

    await Bill.findByIdAndDelete(billId);
  }

  async getBillsForContact(contactId, userId, isGst, query) {
    const filter = {
      contact_id: contactId,
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
