import Transaction from "../../models/transaction/transaction.model.js";
import Contact from "../../models/master/contact.model.js";
import Bank from "../../models/master/bank.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

const TRANSACTION_POPULATE = [
  { path: "contact_id", select: "name phone type balance" },
  { path: "bank_id", select: "bank_name account_number ifsc_code" },
];

const BANK_TYPES = ["bank_received", "bank_payment"];
const CASH_TYPES = ["cash_received", "cash_payment"];
const RECEIVED_TYPES = ["bank_received", "cash_received"];
const PAYMENT_TYPES = ["bank_payment", "cash_payment"];
const BOOK_TYPES = ["cashbook", "bankbook"];

const BOOK_FILTERS = {
  cash_book: { type: { $in: [...CASH_TYPES, "cashbook"] } },
  ac_book: { type: { $in: [...BANK_TYPES, "bankbook"] } },
  creditor: { type: { $in: PAYMENT_TYPES } },
  debitor: { type: { $in: RECEIVED_TYPES } },
};

class TransactionService {
  async getTransactions(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

    if (query.type) filter.type = query.type;
    if (query.contact_id) filter.contact_id = query.contact_id;
    if (query.bank_id) filter.bank_id = query.bank_id;

    if (query.book && BOOK_FILTERS[query.book]) {
      Object.assign(filter, BOOK_FILTERS[query.book]);
    }

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Transaction, filter, {
      ...query,
      populate: TRANSACTION_POPULATE,
      sort: { date: -1, createdAt: -1 },
    });
  }

  async getTransactionById(transactionId, userId, isGst) {
    const doc = await Transaction.findOne({
      _id: transactionId,
      user_id: userId,
      is_gst: isGst,
    })
      .populate(TRANSACTION_POPULATE)
      .lean();

    if (!doc) throw ApiError.notFound("Transaction not found");
    return doc;
  }

  async createTransaction(data, userId, isGst) {
    const {
      type,
      date,
      contact_id,
      contact_name,
      amount,
      bank_id,
      reference,
      remarks,
    } = data;

    if (!type) throw ApiError.badRequest("type is required");
    if (amount == null || amount < 0)
      throw ApiError.badRequest("amount must be >= 0");

    const isBookType = BOOK_TYPES.includes(type);

    let contact = null;
    if (isBookType) {
      // Book entries have no contact_id, but may have a contact_name
      if (contact_id)
        throw ApiError.badRequest(
          "contact_id must not be provided for book entries",
        );
    } else {
      if (!contact_id) throw ApiError.badRequest("contact_id is required");
      contact = await Contact.findOne({ _id: contact_id, user_id: userId });
      if (!contact) throw ApiError.notFound("Contact not found");

      if (RECEIVED_TYPES.includes(type) && contact.type !== "party") {
        throw ApiError.badRequest(
          "Received transactions require a party contact",
        );
      }
      if (PAYMENT_TYPES.includes(type) && contact.type !== "supplier") {
        throw ApiError.badRequest(
          "Payment transactions require a supplier contact",
        );
      }
    }

    if (BANK_TYPES.includes(type) || type === "bankbook") {
      if (!bank_id)
        throw ApiError.badRequest("bank_id is required for bank transactions");
      const bank = await Bank.findOne({ _id: bank_id, user_id: userId });
      if (!bank) throw ApiError.notFound("Bank not found");
    }

    const nextId = await getNextId("Transaction", userId);

    const doc = await Transaction.create({
      id: nextId,
      transaction_no: `TXN-${nextId}`,
      type,
      date: date ? new Date(date) : new Date(),
      contact_id: isBookType ? null : contact_id,
      contact_name: isBookType ? (contact_name || "").trim() : "",
      amount,
      bank_id:
        BANK_TYPES.includes(type) || type === "bankbook" ? bank_id : null,
      reference: reference || "",
      remarks: remarks || "",
      is_gst: isGst,
      user_id: userId,
    });

    return Transaction.findById(doc._id).populate(TRANSACTION_POPULATE).lean();
  }

  async updateTransaction(transactionId, data, userId, isGst) {
    const doc = await Transaction.findOne({
      _id: transactionId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!doc) throw ApiError.notFound("Transaction not found");

    const {
      type,
      date,
      contact_id,
      contact_name,
      amount,
      bank_id,
      reference,
      remarks,
    } = data;

    const ALL_TYPES = [...BANK_TYPES, ...CASH_TYPES, ...BOOK_TYPES];

    if (type) {
      if (!ALL_TYPES.includes(type)) {
        throw ApiError.badRequest(
          `Invalid transaction type. Must be one of: ${ALL_TYPES.join(", ")}`,
        );
      }
      doc.type = type;
    }

    const effectiveType = type || doc.type;
    const isBookType = BOOK_TYPES.includes(effectiveType);
    const wasBookType = BOOK_TYPES.includes(doc.type);

    if (isBookType) {
      // Book types must not have a contact_id
      if (contact_id) {
        throw ApiError.badRequest(
          "contact_id must not be provided for book entries",
        );
      }
      // Clear contact_id when switching to a book type
      doc.contact_id = null;
      // Allow updating contact_name for book types
      if (contact_name !== undefined) {
        doc.contact_name = (contact_name || "").trim();
      }
    } else if (contact_id) {
      // Explicit contact_id provided for non-book type
      const contact = await Contact.findOne({
        _id: contact_id,
        user_id: userId,
      });
      if (!contact) throw ApiError.notFound("Contact not found");

      if (RECEIVED_TYPES.includes(effectiveType) && contact.type !== "party") {
        throw ApiError.badRequest(
          "Received transactions require a party contact",
        );
      }
      if (
        PAYMENT_TYPES.includes(effectiveType) &&
        contact.type !== "supplier"
      ) {
        throw ApiError.badRequest(
          "Payment transactions require a supplier contact",
        );
      }
      doc.contact_id = contact_id;
    } else if (type && !isBookType) {
      // Type changed to a non-book type, validate existing contact still fits
      if (!doc.contact_id) {
        throw ApiError.badRequest(
          "contact_id is required for non-book transactions",
        );
      }
      const existingContact = await Contact.findOne({
        _id: doc.contact_id,
        user_id: userId,
      });
      if (!existingContact) {
        throw ApiError.badRequest(
          "Existing contact no longer valid. Please provide a new contact_id.",
        );
      }
      if (
        RECEIVED_TYPES.includes(effectiveType) &&
        existingContact.type !== "party"
      ) {
        throw ApiError.badRequest(
          "Received transactions require a party contact. Please update contact_id.",
        );
      }
      if (
        PAYMENT_TYPES.includes(effectiveType) &&
        existingContact.type !== "supplier"
      ) {
        throw ApiError.badRequest(
          "Payment transactions require a supplier contact. Please update contact_id.",
        );
      }
    }
    if (BANK_TYPES.includes(effectiveType) || effectiveType === "bankbook") {
      const effectiveBankId = bank_id !== undefined ? bank_id : doc.bank_id;
      if (!effectiveBankId)
        throw ApiError.badRequest("bank_id is required for bank transactions");
      const bank = await Bank.findOne({
        _id: effectiveBankId,
        user_id: userId,
      });
      if (!bank) throw ApiError.notFound("Bank not found");
      doc.bank_id = effectiveBankId;
    } else {
      doc.bank_id = null;
    }

    // Clear contact_name when switching away from book type
    if (!isBookType && wasBookType) {
      doc.contact_name = "";
    }

    if (date) doc.date = new Date(date);
    if (amount != null) {
      if (amount < 0) throw ApiError.badRequest("amount must be >= 0");
      doc.amount = amount;
    }
    if (reference !== undefined) doc.reference = reference;
    if (remarks !== undefined) doc.remarks = remarks;

    await doc.save();
    return Transaction.findById(doc._id).populate(TRANSACTION_POPULATE).lean();
  }

  async deleteTransaction(transactionId, userId, isGst) {
    const doc = await Transaction.findOneAndDelete({
      _id: transactionId,
      user_id: userId,
      is_gst: isGst,
    });
    if (!doc) throw ApiError.notFound("Transaction not found");
    return doc;
  }

  async getBookSummary(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    const result = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$type",
          total_amount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      bank_received: { total_amount: 0, count: 0 },
      cash_received: { total_amount: 0, count: 0 },
      bank_payment: { total_amount: 0, count: 0 },
      cash_payment: { total_amount: 0, count: 0 },
      cashbook: { total_amount: 0, count: 0 },
      bankbook: { total_amount: 0, count: 0 },
    };

    for (const r of result) {
      if (summary[r._id]) {
        summary[r._id] = {
          total_amount: r.total_amount,
          count: r.count,
        };
      }
    }

    summary.cash_book = {
      total_received: summary.cash_received.total_amount,
      total_payment: summary.cash_payment.total_amount,
      book_amount: summary.cashbook.total_amount,
      net:
        summary.cash_received.total_amount -
        summary.cash_payment.total_amount +
        summary.cashbook.total_amount,
      count:
        summary.cash_received.count +
        summary.cash_payment.count +
        summary.cashbook.count,
    };

    summary.ac_book = {
      total_received: summary.bank_received.total_amount,
      total_payment: summary.bank_payment.total_amount,
      book_amount: summary.bankbook.total_amount,
      net:
        summary.bank_received.total_amount -
        summary.bank_payment.total_amount +
        summary.bankbook.total_amount,
      count:
        summary.bank_received.count +
        summary.bank_payment.count +
        summary.bankbook.count,
    };

    summary.creditor = {
      total_amount:
        summary.bank_payment.total_amount + summary.cash_payment.total_amount,
      count: summary.bank_payment.count + summary.cash_payment.count,
    };

    summary.debitor = {
      total_amount:
        summary.bank_received.total_amount + summary.cash_received.total_amount,
      count: summary.bank_received.count + summary.cash_received.count,
    };

    return summary;
  }
}

export default new TransactionService();
