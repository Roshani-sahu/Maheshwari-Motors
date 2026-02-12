import Party from "../models/party.model.js";
import Challan from "../models/challan.model.js";
import Bill from "../models/bill.model.js";
import Transaction from "../models/transaction.model.js";
import Discount from "../models/discount.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class PartyService {
  async getParties(firmId, userId, query) {
    // Parties are shared across paired firms — scope by ownerId only
    const filter = {};
    if (userId) filter.user_id = userId;
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }
    if (query.balance_status === "due") filter.balance = { $lt: 0 };
    if (query.balance_status === "overpaid") filter.balance = { $gt: 0 };

    return Pagination.paginate(Party, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getPartyById(partyId, firmId, userId) {
    const filter = { _id: partyId };
    if (userId) filter.user_id = userId;
    const party = await Party.findOne(filter);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }
    return party;
  }

  async createParty(partyData, firmId, userId) {
    const partyDoc = { ...partyData, firm_id: firmId };
    if (userId) partyDoc.user_id = userId;
    const party = await Party.create(partyDoc);
    return party;
  }

  async updateParty(partyId, firmId, userId, updateData) {
    const filter = { _id: partyId };
    if (userId) filter.user_id = userId;
    const party = await Party.findOne(filter);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }

    delete updateData.balance;

    const updatedParty = await Party.findByIdAndUpdate(partyId, updateData, {
      new: true,
    });
    return updatedParty;
  }

  async deleteParty(partyId, firmId, userId) {
    const filter = { _id: partyId };
    if (userId) filter.user_id = userId;
    const party = await Party.findOne(filter);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }

    // Check for active (unbilled) challans across ALL firms (shared party)
    const activeChallanCount = await Challan.countDocuments({
      party_id: partyId,
      converted_to_bill: false,
    });
    if (activeChallanCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete party with ${activeChallanCount} active challan(s). Delete or bill them first.`,
      );
    }

    // Check for unpaid bills across ALL firms (shared party)
    const unpaidBillCount = await Bill.countDocuments({
      party_id: partyId,
      payment_status: "due",
    });
    if (unpaidBillCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete party with ${unpaidBillCount} unpaid bill(s). Settle them first.`,
      );
    }

    // Cascade: delete associated data across ALL firms (shared party)
    await Promise.all([
      Transaction.deleteMany({ party_id: partyId }),
      Bill.deleteMany({ party_id: partyId }),
      Challan.deleteMany({ party_id: partyId }),
      Discount.deleteMany({ party_id: partyId }),
    ]);

    await Party.findByIdAndDelete(partyId);
  }

  async getPartyBalance(partyId, firmId, userId) {
    const filter = { _id: partyId };
    if (userId) filter.user_id = userId;
    const party = await Party.findOne(filter);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }
    return party.balance;
  }

  async updateBalance(partyId, firmId, userId, amount, operation = "add") {
    const filter = { _id: partyId };
    if (userId) filter.user_id = userId;
    const party = await Party.findOne(filter);
    if (!party) {
      throw ApiError.notFound("Party not found");
    }

    const adjustedAmount = operation === "subtract" ? -amount : amount;
    const updatedParty = await Party.findByIdAndUpdate(
      partyId,
      { $inc: { balance: adjustedAmount } },
      { new: true },
    );
    return updatedParty.balance;
  }
}

export default new PartyService();
