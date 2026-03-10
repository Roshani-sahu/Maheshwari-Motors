import mongoose from "mongoose";
import Bill from "../../models/transaction/bill.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Contact from "../../models/master/contact.model.js";
import Transport from "../../models/master/transport.model.js";
import Bank from "../../models/master/bank.model.js";
import { ApiError, Pagination, toNumber } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

const PAYMENT_TYPES = [
  "bank_transaction_received_amount",
  "cash_payment_received_amount",
  "bank_transfer_payment_given",
  "cash_payment_given",
];

const PAYMENT_TYPE_ALIASES = {
  bank_transaction_recieved_amount: "bank_transaction_received_amount",
  cash_payment_recieved_amount: "cash_payment_received_amount",
  bank_transaction_received_amount: "bank_transaction_received_amount",
  cash_payment_received_amount: "cash_payment_received_amount",
  bank_transfer_payment_given: "bank_transfer_payment_given",
  cash_payment_given: "cash_payment_given",
  "bank transaction recieved amount": "bank_transaction_received_amount",
  "cash payment recieved amount": "cash_payment_received_amount",
  "bank transfer payment given": "bank_transfer_payment_given",
  "cash payment given": "cash_payment_given",
};

const BANK_REQUIRED_PAYMENT_TYPES = new Set([
  "bank_transaction_received_amount",
  "bank_transfer_payment_given",
]);

class BillService {
  _round(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  _resolvePaymentStatus(amount, paidAmount) {
    const normalizedAmount = this._round(amount);
    const normalizedPaid = this._round(paidAmount);

    if (Math.abs(normalizedPaid - normalizedAmount) < 0.01) {
      return "paid";
    }

    if (normalizedPaid < normalizedAmount) {
      return "due";
    }

    return "overpaid";
  }

  _getBillDue(bill) {
    return Math.max(
      0,
      this._round((bill.amount || 0) - (bill.paid_amount || 0)),
    );
  }

  _normalizePaymentType(
    paymentType,
    defaultType = "cash_payment_received_amount",
  ) {
    const raw = paymentType || defaultType;
    const normalizedRaw = String(raw).trim().toLowerCase();
    const underscored = normalizedRaw.replace(/\s+/g, "_");
    const effectiveType =
      PAYMENT_TYPE_ALIASES[normalizedRaw] ||
      PAYMENT_TYPE_ALIASES[underscored] ||
      raw;

    if (!PAYMENT_TYPES.includes(effectiveType)) {
      throw ApiError.badRequest(
        `payment_type must be one of: ${PAYMENT_TYPES.join(", ")}`,
      );
    }

    return effectiveType;
  }

  _normalizeOptionalText(value) {
    if (value === undefined || value === null) return "";
    if (typeof value !== "string") return String(value);
    return value.trim();
  }

  async _resolvePaymentBank(bankId, userId, paymentType) {
    const requiresBank = BANK_REQUIRED_PAYMENT_TYPES.has(paymentType);

    if (!bankId) {
      if (requiresBank) {
        throw ApiError.badRequest(
          `bank_id is required for payment_type '${paymentType}'`,
        );
      }
      return null;
    }

    if (!mongoose.Types.ObjectId.isValid(bankId)) {
      throw ApiError.badRequest("Invalid bank_id");
    }

    const exists = await Bank.exists({ _id: bankId, user_id: userId });
    if (!exists) {
      throw ApiError.badRequest(
        "Bank not found. Please select a valid bank for this firm.",
      );
    }

    return bankId;
  }

  _buildPaymentEntry({
    amount,
    paymentType,
    bankId,
    referenceNo,
    note,
    settledTo = "bill",
    date,
  }) {
    return {
      amount: this._round(amount),
      payment_type: paymentType,
      bank_id: bankId || null,
      reference_no: this._normalizeOptionalText(referenceNo),
      note: this._normalizeOptionalText(note),
      settled_to: settledTo,
      date: date || new Date(),
    };
  }

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
      populate: [
        {
          path: "contact_id",
          select:
            "name phone type balance transport_charge transport_id gstin reg_number area area_id city state address",
          populate: { path: "area_id", select: "city state pincode" },
        },
        { path: "transport_id", select: "name phone gstin" },
        {
          path: "challan_ids",
          select: "challan_no challan_type date amount print_option items",
          populate: {
            path: "items.item_id",
            select: "item_name barcode item_id sale_rate gst_percent",
          },
        },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getBillById(billId, userId, isGst) {
    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate({
        path: "contact_id",
        select:
          "name phone type balance transport_charge transport_id gstin reg_number area area_id city state address",
        populate: { path: "area_id", select: "city state pincode" },
      })
      .populate("transport_id")
      .populate({
        path: "challan_ids",
        populate: {
          path: "items.item_id",
          select: "item_name alias description hsn_id",
        },
      })
      .populate(
        "payment_entries.bank_id",
        "bank_name account_number ifsc_code",
      );

    if (!bill) throw ApiError.notFound("Bill not found");
    return bill;
  }

  async _resolveBillNo(providedBillNo, isGst, userId) {
    if (
      providedBillNo &&
      typeof providedBillNo === "string" &&
      providedBillNo.trim()
    ) {
      const trimmed = providedBillNo.trim();
      const exists = await Bill.exists({
        bill_no: trimmed,
        user_id: userId,
        is_gst: isGst,
      });
      if (exists) {
        throw ApiError.conflict(
          `Bill number '${trimmed}' already exists. Please use a different bill number.`,
        );
      }
      return trimmed;
    }
    const billNoSeq = await getNextId(
      `BillNo_${isGst === 1 ? "GST" : "NONGST"}`,
      userId,
    );
    return `BL-${String(billNoSeq).padStart(6, "0")}`;
  }

  async checkBillNoUnique(billNo, isGst, userId) {
    if (!billNo || typeof billNo !== "string" || !billNo.trim()) {
      throw ApiError.badRequest("bill_no is required");
    }
    const exists = await Bill.exists({
      bill_no: billNo.trim(),
      user_id: userId,
      is_gst: isGst,
    });
    return { bill_no: billNo.trim(), is_unique: !exists };
  }

  async createBill(billData, userId, isGst) {
    const {
      challan_ids,
      contact_id: rawContactId,
      party_id: partyId,
      apply_balance = false,
      delivered_amount,
      transport_id,
      customer_name,
      vehicle_number,
      vehicle_no,
      transport_charge,
      amount: providedAmount,
      total_amount: providedTotalAmount,
      bill_no: providedBillNo,
    } = billData;
    const contact_id = rawContactId || partyId;
    const normalizedVehicleNumber =
      typeof vehicle_number === "string" ? vehicle_number : vehicle_no;

    if (!challan_ids || challan_ids.length === 0) {
      throw ApiError.badRequest("At least one challan is required");
    }

    if (!contact_id) {
      throw ApiError.badRequest("contact_id is required");
    }

    const hasFirmContext = isGst === 0 || isGst === 1;
    const challanFilter = {
      _id: { $in: challan_ids },
      contact_id,
      user_id: userId,
      challan_type: "sale",
      converted_to_bill: false,
    };
    if (hasFirmContext) challanFilter.is_gst = isGst;

    const challans = await Challan.find(challanFilter);

    if (challans.length !== challan_ids.length) {
      const challansIgnoringFirm = await Challan.find({
        _id: { $in: challan_ids },
        // contact_id,
        user_id: userId,
        challan_type: "sale",
        converted_to_bill: false,
      }).select("_id is_gst");

      if (
        hasFirmContext &&
        challansIgnoringFirm.length === challan_ids.length
      ) {
        const firmLabels = [
          ...new Set(
            challansIgnoringFirm.map((challan) =>
              challan.is_gst === 1 ? "GST" : "NON_GST",
            ),
          ),
        ];

        throw ApiError.badRequest(
          `Selected challan(s) belong to ${firmLabels.join("/")} firm. Please create bill from the matching firm login.`,
        );
      }

      throw ApiError.badRequest(
        "Some challans are invalid, already billed, or do not belong to this contact/firm",
      );
    }

    if (!hasFirmContext) {
      const mixedFirmChallans = new Set(
        challans.map((challan) => challan.is_gst),
      ).size;
      if (mixedFirmChallans > 1) {
        throw ApiError.badRequest(
          "Selected challans contain mixed GST and NON_GST entries. Please create separate bills per firm.",
        );
      }
    }

    const resolvedIsGst = hasFirmContext ? isGst : challans[0].is_gst;

    let totalAmount;
    const rawAmount =
      providedAmount !== undefined ? providedAmount : providedTotalAmount;
    if (rawAmount !== undefined && rawAmount !== null && rawAmount !== "") {
      totalAmount = Number(rawAmount);
      if (!Number.isFinite(totalAmount) || totalAmount < 0) {
        throw ApiError.badRequest("amount must be a non-negative number");
      }
    } else {
      totalAmount = challans.reduce((sum, challan) => sum + challan.amount, 0);
    }

    const contact = await Contact.findOne({
      _id: contact_id,
      user_id: userId,
    }).lean();
    if (!contact) throw ApiError.notFound("Contact not found");

    let resolvedTransportId = null;
    if (transport_id) {
      const transportExists = await Transport.exists({
        _id: transport_id,
        user_id: userId,
      });
      if (!transportExists) {
        throw ApiError.badRequest(
          "Transport not found. Please select a valid transport.",
        );
      }
      resolvedTransportId = transport_id;
    } else if (contact.transport_id) {
      resolvedTransportId = contact.transport_id;
    }

    let resolvedTransportCharge = Number(contact.transport_charge || 0);
    if (transport_charge !== undefined && transport_charge !== null) {
      resolvedTransportCharge = Number(transport_charge);
    }
    if (
      !Number.isFinite(resolvedTransportCharge) ||
      resolvedTransportCharge < 0
    ) {
      throw ApiError.badRequest(
        "transport_charge must be a non-negative number",
      );
    }

    let deliveredNum = null;
    if (delivered_amount !== undefined && delivered_amount !== null) {
      deliveredNum = Number(delivered_amount);
      if (!Number.isFinite(deliveredNum) || deliveredNum < 0) {
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

    const bill_no = await this._resolveBillNo(
      providedBillNo,
      resolvedIsGst,
      userId,
    );
    const nextId = await getNextId("Bill", userId);

    const bill = await Bill.create({
      id: nextId,
      bill_no,
      contact_id,
      transport_id: resolvedTransportId,
      customer_name:
        typeof customer_name === "string" && customer_name.trim() ?
          customer_name.trim()
        : contact.name || "",
      vehicle_number:
        typeof normalizedVehicleNumber === "string" ?
          normalizedVehicleNumber.trim()
        : "",
      transport_charge: resolvedTransportCharge,
      date: new Date(),
      amount: billAmount,
      return_amount: partialReturnAmount,
      challan_ids,
      user_id: userId,
      is_gst: resolvedIsGst,
      paid_amount: 0,
      payment_status: "due",
      skip_stock_calculation: resolvedIsGst === 0,
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
      .populate("contact_id", "name type balance transport_charge")
      .populate("transport_id", "name phone")
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

  /**
   * Batch-convert multiple challans into bills, grouping by is_gst and contact_id.
   * Creates one bill per (is_gst, contact_id) combination.
   */
  async batchConvertChallans(challanIds, userId) {
    if (!Array.isArray(challanIds) || challanIds.length === 0) {
      throw ApiError.badRequest("At least one challan_id is required");
    }

    const challans = await Challan.find({
      _id: { $in: challanIds },
      user_id: userId,
      challan_type: "sale",
      converted_to_bill: false,
    })
      .populate("contact_id", "name balance transport_charge transport_id")
      .lean();

    if (challans.length !== challanIds.length) {
      throw ApiError.badRequest(
        "Some challans are invalid, already billed, or do not belong to your account",
      );
    }

    // Group by is_gst, then by contact_id
    const groups = new Map();
    for (const challan of challans) {
      const contactId = String(challan.contact_id?._id || challan.contact_id);
      const key = `${challan.is_gst}_${contactId}`;

      if (!groups.has(key)) {
        groups.set(key, {
          is_gst: challan.is_gst,
          contact_id: contactId,
          contact_name: challan.contact_id?.name || "Unknown",
          challans: [],
        });
      }
      groups.get(key).challans.push(challan);
    }

    const createdBills = [];

    for (const [, group] of groups) {
      const groupChallanIds = group.challans.map((c) => c._id);
      const totalAmount = this._round(
        group.challans.reduce((sum, c) => sum + (c.amount || 0), 0),
      );

      const contact = await Contact.findOne({
        _id: group.contact_id,
        user_id: userId,
      }).lean();

      if (!contact) {
        throw ApiError.notFound(
          `Contact not found for party '${group.contact_name}'`,
        );
      }

      let resolvedTransportId = null;
      if (contact.transport_id) {
        const transportExists = await Transport.exists({
          _id: contact.transport_id,
          user_id: userId,
        });
        if (transportExists) {
          resolvedTransportId = contact.transport_id;
        }
      }

      const resolvedTransportCharge = Number(contact.transport_charge || 0);

      const bill_no = await this._resolveBillNo(null, group.is_gst, userId);
      const nextId = await getNextId("Bill", userId);

      const bill = await Bill.create({
        id: nextId,
        bill_no,
        contact_id: group.contact_id,
        transport_id: resolvedTransportId,
        customer_name: contact.name || "",
        vehicle_number: "",
        transport_charge: resolvedTransportCharge,
        date: new Date(),
        amount: totalAmount,
        return_amount: 0,
        challan_ids: groupChallanIds,
        user_id: userId,
        is_gst: group.is_gst,
        paid_amount: 0,
        payment_status: "due",
        skip_stock_calculation: group.is_gst === 0,
      });

      await Challan.updateMany(
        { _id: { $in: groupChallanIds } },
        { converted_to_bill: true, bill_id: bill._id },
      );

      createdBills.push(bill);
    }

    const populatedBills = await Bill.find({
      _id: { $in: createdBills.map((b) => b._id) },
    })
      .populate("contact_id", "name type balance transport_charge")
      .populate("transport_id", "name phone")
      .populate({
        path: "challan_ids",
        select: "amount discount sub_total date items",
      });

    return {
      bills: populatedBills,
      total_bills_created: populatedBills.length,
      groups: [...groups.values()].map((g) => ({
        is_gst: g.is_gst,
        firm_type: g.is_gst === 1 ? "GST" : "NON_GST",
        contact_id: g.contact_id,
        contact_name: g.contact_name,
        challan_count: g.challans.length,
      })),
    };
  }

  async settleBills(payload, userId, isGst) {
    const {
      contact_id,
      total_amount,
      payment_type,
      bank_id,
      reference_no,
      note,
      allocations,
      apply_remaining_to_balance = true,
    } = payload || {};

    if (!contact_id) {
      throw ApiError.badRequest("contact_id is required");
    }

    const totalAmount = toNumber(total_amount, "Total amount", { min: 0.01 });
    const paymentType = this._normalizePaymentType(payment_type);
    const bankId = await this._resolvePaymentBank(bank_id, userId, paymentType);

    const contact = await Contact.findOne({ _id: contact_id, user_id: userId });
    if (!contact) {
      throw ApiError.notFound("Contact not found");
    }

    let allocationInputs = Array.isArray(allocations) ? allocations : [];
    const normalizedAllocations = [];

    if (allocationInputs.length > 0) {
      const seen = new Set();
      for (let i = 0; i < allocationInputs.length; i++) {
        const row = allocationInputs[i];
        if (!row?.bill_id) {
          throw ApiError.badRequest(`allocations[${i}].bill_id is required`);
        }

        const billId = String(row.bill_id);
        if (seen.has(billId)) {
          throw ApiError.badRequest(
            `Duplicate bill_id '${billId}' in allocations`,
          );
        }
        seen.add(billId);

        const amount = toNumber(row.amount, `allocations[${i}].amount`, {
          min: 0.01,
        });

        normalizedAllocations.push({
          bill_id: billId,
          amount: this._round(amount),
        });
      }

      const bills = await Bill.find({
        _id: { $in: normalizedAllocations.map((a) => a.bill_id) },
        contact_id,
        user_id: userId,
        is_gst: isGst,
      });

      if (bills.length !== normalizedAllocations.length) {
        throw ApiError.badRequest(
          "One or more allocated bills are invalid or do not belong to this contact/firm",
        );
      }

      const billMap = new Map(bills.map((bill) => [String(bill._id), bill]));
      for (const allocation of normalizedAllocations) {
        const bill = billMap.get(allocation.bill_id);
        const due = this._getBillDue(bill);
        if (allocation.amount > due + 0.009) {
          throw ApiError.badRequest(
            `Allocated amount for bill '${bill.bill_no}' exceeds due amount ${due}`,
          );
        }
      }
    } else {
      const dueBills = await Bill.find({
        contact_id,
        user_id: userId,
        is_gst: isGst,
        payment_status: { $ne: "paid" },
      }).sort({ date: 1, createdAt: 1, _id: 1 });

      let remaining = this._round(totalAmount);

      for (const bill of dueBills) {
        if (remaining <= 0) break;
        const due = this._getBillDue(bill);
        if (due <= 0) continue;

        const settleAmount = this._round(Math.min(remaining, due));
        if (settleAmount <= 0) continue;

        normalizedAllocations.push({
          bill_id: String(bill._id),
          amount: settleAmount,
        });

        remaining = this._round(remaining - settleAmount);
      }
    }

    const allocatedAmount = this._round(
      normalizedAllocations.reduce((sum, row) => sum + row.amount, 0),
    );

    if (allocatedAmount > totalAmount + 0.009) {
      throw ApiError.badRequest("Allocated total cannot exceed total_amount");
    }

    const remainingAmount = this._round(totalAmount - allocatedAmount);

    if (remainingAmount > 0 && !apply_remaining_to_balance) {
      throw ApiError.badRequest(
        "Unallocated amount remains. Either allocate to bills or set apply_remaining_to_balance=true",
      );
    }

    const billIds = normalizedAllocations.map((row) => row.bill_id);
    const bills =
      billIds.length ?
        await Bill.find({
          _id: { $in: billIds },
          contact_id,
          user_id: userId,
          is_gst: isGst,
        })
      : [];

    const billMap = new Map(bills.map((bill) => [String(bill._id), bill]));
    const applied = [];

    for (const row of normalizedAllocations) {
      const bill = billMap.get(row.bill_id);
      if (!bill) continue;

      const dueBefore = this._getBillDue(bill);
      const paidAfter = this._round((bill.paid_amount || 0) + row.amount);
      const paymentStatus = this._resolvePaymentStatus(bill.amount, paidAfter);
      const dueAfter = Math.max(0, this._round(bill.amount - paidAfter));

      const entry = this._buildPaymentEntry({
        amount: row.amount,
        paymentType,
        bankId,
        referenceNo: reference_no,
        note,
        settledTo: "bill",
      });

      const updated = await Bill.findByIdAndUpdate(
        bill._id,
        {
          paid_amount: paidAfter,
          payment_status: paymentStatus,
          $push: { payment_entries: entry },
        },
        { new: true },
      );

      if (!updated) continue;

      bill.paid_amount = paidAfter;

      applied.push({
        bill_id: updated._id,
        bill_no: updated.bill_no,
        settled_amount: row.amount,
        due_before: dueBefore,
        due_after: dueAfter,
        payment_status: updated.payment_status,
      });
    }

    let unsettledAmount = 0;
    if (remainingAmount > 0 && apply_remaining_to_balance) {
      unsettledAmount = remainingAmount;
      await Contact.findByIdAndUpdate(contact_id, {
        $inc: { balance: unsettledAmount },
      });
    }

    const latestContact = await Contact.findById(contact_id)
      .select("_id name balance")
      .lean();

    return {
      contact: latestContact,
      total_amount: this._round(totalAmount),
      allocated_amount: allocatedAmount,
      unsettled_amount: unsettledAmount,
      payment_type: paymentType,
      bank_id: bankId,
      applied,
    };
  }

  async recordPayment(billId, userId, isGst, payload) {
    const normalizedPayload =
      typeof payload === "object" && payload !== null ?
        payload
      : { amount: payload };

    const amount = toNumber(normalizedPayload.amount, "Payment amount", {
      min: 0.01,
    });

    const paymentType = this._normalizePaymentType(
      normalizedPayload.payment_type,
      "cash_payment_received_amount",
    );

    const bankId = await this._resolvePaymentBank(
      normalizedPayload.bank_id,
      userId,
      paymentType,
    );

    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

    const newPaidAmount = this._round((bill.paid_amount || 0) + amount);
    const paymentStatus = this._resolvePaymentStatus(
      bill.amount,
      newPaidAmount,
    );

    const excessAmount = Math.max(0, this._round(newPaidAmount - bill.amount));

    const entry = this._buildPaymentEntry({
      amount,
      paymentType,
      bankId,
      referenceNo: normalizedPayload.reference_no,
      note: normalizedPayload.note,
      settledTo: excessAmount > 0 ? "unsettled_balance" : "bill",
    });

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        paid_amount: newPaidAmount,
        payment_status: paymentStatus,
        $push: { payment_entries: entry },
      },
      { new: true },
    ).populate("contact_id", "name type balance");

    if (excessAmount > 0) {
      await Contact.findByIdAndUpdate(bill.contact_id, {
        $inc: { balance: excessAmount },
      });
    }

    return updatedBill;
  }

  async handleReturn(billId, userId, isGst, payload) {
    const normalizedPayload =
      typeof payload === "object" && payload !== null ?
        payload
      : { return_amount: payload };

    const returnAmount = toNumber(
      normalizedPayload.return_amount,
      "Return amount",
      { min: 0.01 },
    );

    const paymentType = this._normalizePaymentType(
      normalizedPayload.payment_type,
      "cash_payment_given",
    );

    const bankId = await this._resolvePaymentBank(
      normalizedPayload.bank_id,
      userId,
      paymentType,
    );

    const bill = await Bill.findOne({
      _id: billId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!bill) throw ApiError.notFound("Bill not found");

    if (returnAmount > bill.amount + 0.009) {
      throw ApiError.badRequest("Return amount cannot exceed bill amount");
    }

    const newAmount = this._round(bill.amount - returnAmount);
    const paymentStatus = this._resolvePaymentStatus(
      newAmount,
      bill.paid_amount || 0,
    );

    const entry = this._buildPaymentEntry({
      amount: returnAmount,
      paymentType,
      bankId,
      referenceNo: normalizedPayload.reference_no,
      note: normalizedPayload.note,
      settledTo: "unsettled_balance",
    });

    const updatedBill = await Bill.findByIdAndUpdate(
      billId,
      {
        amount: newAmount,
        payment_status: paymentStatus,
        $inc: { return_amount: returnAmount },
        $push: { payment_entries: entry },
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
      populate: [
        {
          path: "contact_id",
          select: "name phone type balance transport_charge transport_id",
        },
        { path: "transport_id", select: "name phone" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getLastSoldItem(itemId, userId, isGst) {
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      throw ApiError.badRequest("Valid item_id is required");
    }

    const challans = await Challan.find({
      user_id: userId,
      is_gst: isGst,
      challan_type: "sale",
      converted_to_bill: true,
      "items.item_id": itemId,
    })
      .sort({ date: -1, createdAt: -1, _id: -1 })
      .select("bill_id challan_no date items contact_id")
      .populate("contact_id", "name phone type")
      .populate(
        "items.item_id",
        "item_name alias description hsn_id barcode item_id sale_rate mrp_rate gst_percent image",
      )
      .lean();

    if (challans.length === 0) return [];

    const billIds = [
      ...new Set(challans.map((c) => String(c.bill_id)).filter(Boolean)),
    ];

    const bills = await Bill.find({
      _id: { $in: billIds },
      user_id: userId,
      is_gst: isGst,
    })
      .select("_id bill_no date amount payment_status")
      .lean();

    const billMap = new Map(bills.map((b) => [String(b._id), b]));
    const normalizedItemId = String(itemId);
    const entries = [];

    for (const challan of challans) {
      const bill =
        challan.bill_id ? billMap.get(String(challan.bill_id)) : null;
      if (!bill) continue;

      for (const line of challan.items || []) {
        const lineItem = line?.item_id;
        const lineItemId =
          typeof lineItem === "object" && lineItem?._id ?
            String(lineItem._id)
          : String(lineItem);

        if (lineItemId !== normalizedItemId) continue;

        entries.push({
          bill_id: bill._id,
          bill_no: bill.bill_no,
          bill_date: bill.date,
          bill_amount: bill.amount,
          bill_payment_status: bill.payment_status,
          challan_no: challan.challan_no,
          challan_date: challan.date,
          contact: challan.contact_id,
          item: lineItem,
          quantity: line.quantity,
          rate: line.rate,
          discount: line.discount,
          special_discount: line.special_discount,
          discount_amount: line.discount_amount,
          gst_percent: line.gst_percent,
          gst_amount: line.gst_amount,
          taxable_amount: line.taxable_amount,
          amount: line.amount,
          is_gst: line.is_gst,
        });
      }
    }

    entries.sort((a, b) => {
      const billDateDiff =
        new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime();
      if (billDateDiff !== 0) return billDateDiff;
      return (
        new Date(b.challan_date).getTime() - new Date(a.challan_date).getTime()
      );
    });

    return entries.slice(0, 4);
  }
}

export default new BillService();
