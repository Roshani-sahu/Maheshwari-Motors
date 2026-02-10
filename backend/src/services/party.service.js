import Party from "../models/party.model.js";
import Challan from "../models/challan.model.js";
import Bill from "../models/bill.model.js";
import Transaction from "../models/transaction.model.js";
import Discount from "../models/discount.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class PartyService {
  async getParties(firmId, userId, query) {
    const filter = { firm_id: firmId, user_id: userId };
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
    const party = await Party.findOne({
      _id: partyId,
      firm_id: firmId,
      user_id: userId,
    });
    if (!party) {
      throw ApiError.notFound("Party not found");
    }
    return party;
  }

  async createParty(partyData, firmId, userId) {
    const party = await Party.create({
      ...partyData,
      firm_id: firmId,
      user_id: userId,
    });
    return party;
  }

  async updateParty(partyId, firmId, userId, updateData) {
    const party = await Party.findOne({
      _id: partyId,
      firm_id: firmId,
      user_id: userId,
    });
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
    const party = await Party.findOne({
      _id: partyId,
      firm_id: firmId,
      user_id: userId,
    });
    if (!party) {
      throw ApiError.notFound("Party not found");
    }

    // Check for active (unbilled) challans
    const activeChallanCount = await Challan.countDocuments({
      party_id: partyId,
      firm_id: firmId,
      converted_to_bill: false,
    });
    if (activeChallanCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete party with ${activeChallanCount} active challan(s). Delete or bill them first.`,
      );
    }

    // Check for unpaid bills
    const unpaidBillCount = await Bill.countDocuments({
      party_id: partyId,
      firm_id: firmId,
      payment_status: "due",
    });
    if (unpaidBillCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete party with ${unpaidBillCount} unpaid bill(s). Settle them first.`,
      );
    }

    // Cascade: delete associated transactions, bills, challans, discounts
    await Promise.all([
      Transaction.deleteMany({ party_id: partyId, firm_id: firmId }),
      Bill.deleteMany({ party_id: partyId, firm_id: firmId }),
      Challan.deleteMany({ party_id: partyId, firm_id: firmId }),
      Discount.deleteMany({ party_id: partyId, user_id: userId }),
    ]);

    await Party.findByIdAndDelete(partyId);
  }

  async getPartyBalance(partyId, firmId, userId) {
    const party = await Party.findOne({
      _id: partyId,
      firm_id: firmId,
      user_id: userId,
    });
    if (!party) {
      throw ApiError.notFound("Party not found");
    }
    return party.balance;
  }

  async updateBalance(partyId, firmId, userId, amount, operation = "add") {
    const party = await Party.findOne({
      _id: partyId,
      firm_id: firmId,
      user_id: userId,
    });
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
