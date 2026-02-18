import Party from "../../models/master/party.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class PartyService {
  async getParties(userId, query) {
    const filter = { user_id: userId };
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

  async getPartyById(partyId, userId) {
    const party = await Party.findOne({ _id: partyId, user_id: userId });
    if (!party) throw ApiError.notFound("Party not found");
    return party;
  }

  async createParty(partyData, userId) {
    const { name, phone, email, address, city, state, gstin } = partyData;

    // --- Required field check ---
    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Party name is required");
    }

    // --- Duplicate name check ---
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Party.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Party with this name already exists");
    }

    const party = await Party.create({
      id: await getNextId("Party", userId),
      name: name.trim(),
      phone,
      email,
      address,
      city,
      state,
      gstin,
      user_id: userId,
    });
    return party;
  }

  async updateParty(partyId, userId, updateData) {
    const party = await Party.findOne({ _id: partyId, user_id: userId });
    if (!party) throw ApiError.notFound("Party not found");

    const { name, phone, email, address, city, state, gstin } = updateData;

    // --- Name validation on rename ---
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Party name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Party.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: partyId },
      });
      if (duplicate) {
        throw ApiError.conflict("Another party with this name already exists");
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (phone !== undefined) fields.phone = phone;
    if (email !== undefined) fields.email = email;
    if (address !== undefined) fields.address = address;
    if (city !== undefined) fields.city = city;
    if (state !== undefined) fields.state = state;
    if (gstin !== undefined) fields.gstin = gstin;

    const updatedParty = await Party.findByIdAndUpdate(partyId, fields, {
      new: true,
    });
    return updatedParty;
  }

  async deleteParty(partyId, userId) {
    const party = await Party.findOne({ _id: partyId, user_id: userId });
    if (!party) throw ApiError.notFound("Party not found");

    // Hard delete party and all linked records, including old/legacy data.
    await Promise.all([
      Transaction.deleteMany({ party_id: partyId, user_id: userId }),
      Bill.deleteMany({ party_id: partyId, user_id: userId }),
      Challan.deleteMany({ party_id: partyId, user_id: userId }),
    ]);

    await Party.findByIdAndDelete(partyId);
  }

  async getPartyBalance(partyId, userId) {
    const party = await Party.findOne({ _id: partyId, user_id: userId });
    if (!party) throw ApiError.notFound("Party not found");
    return party.balance;
  }

  async updateBalance(partyId, userId, amount, operation = "add") {
    const party = await Party.findOne({ _id: partyId, user_id: userId });
    if (!party) throw ApiError.notFound("Party not found");

    if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
      throw ApiError.badRequest("Amount must be a non-negative number");
    }
    if (!["add", "subtract"].includes(operation)) {
      throw ApiError.badRequest("Operation must be 'add' or 'subtract'");
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
