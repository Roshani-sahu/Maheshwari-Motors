import Party from "../models/party.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class PartyService {
  async getParties(firmId, userId, query) {
    const filter = { firm_id: firmId, user_id: userId };
    if (query.search) filter.name = { $regex: query.search, $options: "i" };
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
