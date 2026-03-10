import mongoose from "mongoose";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Contact from "../../models/master/contact.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import User from "../../models/auth/user.model.js";
import Item from "../../models/master/item.model.js";
import Hsn from "../../models/master/hsn.model.js";

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

  async getAccountLedger(userId, query = {}) {
    const uid = new mongoose.Types.ObjectId(userId);
    const { contact_id, from_date, to_date, type, doc_no, narration, firm } =
      query;

    if (!contact_id) {
      const e = new Error("contact_id (Party) is required");
      e.statusCode = 400;
      throw e;
    }
    const cid = new mongoose.Types.ObjectId(contact_id);

    const dateFilter = {};
    if (from_date) dateFilter.$gte = new Date(from_date);
    if (to_date) {
      const end = new Date(to_date);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const firmFilter = (f) => {
      if (!firm || firm === "all") return true;
      if (firm === "gst") return f === 1;
      if (firm === "nongst") return f === 0;
      return true;
    };

    const typeWanted = (t) => !type || type === "all" || type === t;

    const user = await User.findById(uid).lean();
    const firmName = (isGst) =>
      isGst === 1 ?
        user?.gst_firm?.name || "GST"
      : user?.nongst_firm?.name || "Non-GST";

    const challanFilter = { user_id: uid, contact_id: cid };
    if (Object.keys(dateFilter).length) challanFilter.date = dateFilter;

    const challans = await Challan.find(challanFilter)
      .select("id challan_no challan_type date amount is_gst")
      .sort({ date: 1 })
      .lean();

    const txnFilter = { user_id: uid, contact_id: cid };
    if (Object.keys(dateFilter).length) txnFilter.date = dateFilter;

    const transactions = await Transaction.find(txnFilter)
      .select("id transaction_no type date amount is_gst remarks")
      .sort({ date: 1 })
      .lean();

    const entries = [];

    const TYPE_MAP = {
      sale: "Sale",
      purchase: "Purchase",
      bank_received: "Bank Rec",
      cash_received: "Cash Rec",
      bank_payment: "Bank Pay",
      cash_payment: "Cash Pay",
    };

    const BOOK_MAP = {
      sale_1: "SALE BOOK (GST)",
      sale_0: "SALE BOOK (NON-GST)",
      purchase_1: "PURCHASE BOOK (GST)",
      purchase_0: "PURCHASE BOOK (NON-GST)",
      bank_received: "AC BOOK",
      cash_received: "CASH BOOK",
      bank_payment: "AC BOOK",
      cash_payment: "CASH BOOK",
    };

    for (const ch of challans) {
      if (!firmFilter(ch.is_gst)) continue;

      const isSale = ch.challan_type === "sale";
      const entryType = isSale ? "sale" : "purchase";
      if (!typeWanted(entryType)) continue;

      const bookKey = `${ch.challan_type}_${ch.is_gst}`;

      entries.push({
        date: ch.date,
        v_no: String(ch.id).padStart(5, "0"),
        type: TYPE_MAP[ch.challan_type],
        doc_no: BOOK_MAP[bookKey] || ch.challan_no,
        narration: BOOK_MAP[bookKey] || ch.challan_no,
        debit_amount: isSale ? ch.amount : 0,
        credit_amount: isSale ? 0 : ch.amount,
        is_gst: ch.is_gst,
        firm: firmName(ch.is_gst),
        _sort: new Date(ch.date).getTime(),
      });
    }

    for (const txn of transactions) {
      if (!firmFilter(txn.is_gst)) continue;

      const isReceived = txn.type.includes("received");
      const shortType = txn.type;
      const entryType = shortType.replace("_", "_");
      const filterType =
        isReceived ?
          txn.type === "bank_received" ?
            "bank_rec"
          : "cash_rec"
        : txn.type === "bank_payment" ? "bank_pay"
        : "cash_pay";

      if (!typeWanted(filterType) && !typeWanted(entryType)) continue;

      entries.push({
        date: txn.date,
        v_no: String(txn.id).padStart(5, "0"),
        type: TYPE_MAP[txn.type] || txn.type,
        doc_no: BOOK_MAP[txn.type] || txn.transaction_no,
        narration: txn.remarks || BOOK_MAP[txn.type] || txn.transaction_no,
        debit_amount: isReceived ? 0 : txn.amount,
        credit_amount: isReceived ? txn.amount : 0,
        is_gst: txn.is_gst,
        firm: firmName(txn.is_gst),
        _sort: new Date(txn.date).getTime(),
      });
    }

    const filtered = entries.filter((e) => {
      if (doc_no && !e.doc_no.toLowerCase().includes(doc_no.toLowerCase()))
        return false;
      if (
        narration &&
        !e.narration.toLowerCase().includes(narration.toLowerCase())
      )
        return false;
      return true;
    });

    filtered.sort((a, b) => a._sort - b._sort || a.v_no.localeCompare(b.v_no));

    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = filtered.map((e) => {
      totalDebit += e.debit_amount;
      totalCredit += e.credit_amount;
      balance += e.debit_amount - e.credit_amount;

      return {
        date: e.date,
        v_no: e.v_no,
        type: e.type,
        doc_no: e.doc_no,
        narration: e.narration,
        debit_amount: Math.round(e.debit_amount * 100) / 100,
        credit_amount: Math.round(e.credit_amount * 100) / 100,
        balance: Math.round(Math.abs(balance) * 100) / 100,
        cd: balance >= 0 ? "Dr" : "Cr",
        is_gst: e.is_gst,
        firm: e.firm,
      };
    });

    return {
      entries: rows,
      total_debit: Math.round(totalDebit * 100) / 100,
      total_credit: Math.round(totalCredit * 100) / 100,
      closing_balance: Math.round(Math.abs(balance) * 100) / 100,
      closing_cd: balance >= 0 ? "Dr" : "Cr",
    };
  }

  async getGstReport(userId, query = {}) {
    const uid = new mongoose.Types.ObjectId(userId);
    const { type, from_date, to_date, ac_name, gstin, hsn_code } = query;

    const user = await User.findById(uid).lean();
    const firmState = (user?.gst_firm?.state || "").toLowerCase().trim();

    const filter = { user_id: uid, is_gst: 1 };

    if (type === "sale" || type === "purchase") {
      filter.challan_type = type;
    }

    if (from_date || to_date) {
      filter.date = {};
      if (from_date) filter.date.$gte = new Date(from_date);
      if (to_date) {
        const end = new Date(to_date);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const challans = await Challan.find(filter)
      .populate({
        path: "contact_id",
        select: "name gstin state",
      })
      .populate({
        path: "items.item_id",
        select: "item_name hsn_id",
        populate: { path: "hsn_id", select: "hsn_code" },
      })
      .sort({ date: 1 })
      .lean();

    const rows = [];
    let totalTaxable = 0;
    let totalGst = 0;
    let totalSgst = 0;
    let totalCgst = 0;
    let totalIgst = 0;
    let totalNet = 0;

    for (const ch of challans) {
      const contact = ch.contact_id || {};
      const contactName = contact.name || "";
      const contactGstin = contact.gstin || "";
      const contactState = (contact.state || "").toLowerCase().trim();

      if (ac_name && !contactName.toLowerCase().includes(ac_name.toLowerCase()))
        continue;
      if (gstin && !contactGstin.toLowerCase().includes(gstin.toLowerCase()))
        continue;

      const isIntraState =
        firmState && contactState && firmState === contactState;

      for (const line of ch.items || []) {
        const item = line.item_id || {};
        const itemName = item.item_name || "";
        const hsnObj = item.hsn_id || {};
        const hsnCodeVal = hsnObj.hsn_code || "";

        if (
          hsn_code &&
          !hsnCodeVal.toLowerCase().includes(hsn_code.toLowerCase())
        )
          continue;

        const taxableAmt = line.taxable_amount || 0;
        const gstPct = line.gst_percent || 0;
        const gstAmt = line.gst_amount || 0;

        let sgst = 0;
        let cgst = 0;
        let igst = 0;

        if (isIntraState) {
          sgst = Math.round((gstAmt / 2) * 100) / 100;
          cgst = Math.round((gstAmt / 2) * 100) / 100;
        } else {
          igst = Math.round(gstAmt * 100) / 100;
        }

        const netAmt = Math.round((taxableAmt + gstAmt) * 100) / 100;

        totalTaxable += taxableAmt;
        totalGst += gstAmt;
        totalSgst += sgst;
        totalCgst += cgst;
        totalIgst += igst;
        totalNet += netAmt;

        rows.push({
          date: ch.date,
          vno: ch.id,
          ac_name: contactName,
          gstin: contactGstin,
          item_name: itemName,
          hsn_code: hsnCodeVal,
          pcs: line.quantity || 0,
          rate: line.rate || 0,
          discount: line.discount || 0,
          special_discount: line.special_discount || 0,
          taxable_amount: Math.round(taxableAmt * 100) / 100,
          gst_percent: gstPct,
          gst_amount: Math.round(gstAmt * 100) / 100,
          sgst_amount: sgst,
          cgst_amount: cgst,
          igst_amount: igst,
          net_amount: netAmt,
        });
      }
    }

    return {
      entries: rows,
      totals: {
        taxable: Math.round(totalTaxable * 100) / 100,
        gst: Math.round(totalGst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        cgst: Math.round(totalCgst * 100) / 100,
        igst: Math.round(totalIgst * 100) / 100,
        net: Math.round(totalNet * 100) / 100,
      },
    };
  }
}

export default new ReportService();
