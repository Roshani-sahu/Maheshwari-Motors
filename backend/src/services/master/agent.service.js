import Agent from "../../models/master/agent.model.js";
import Contact from "../../models/master/contact.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class AgentService {
  async getAgents(userId, query) {
    const filter = { user_id: userId };

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }
    if (query.party_id) filter.party_id = query.party_id;

    return Pagination.paginate(Agent, filter, {
      ...query,
      populate: { path: "party_id", select: "name type phone" },
      sort: { createdAt: -1 },
    });
  }

  async getAgentById(agentId, userId) {
    const agent = await Agent.findOne({
      _id: agentId,
      user_id: userId,
    }).populate("party_id", "name type phone");
    if (!agent) throw ApiError.notFound("Agent not found");
    return agent;
  }

  async createAgent(agentData, userId) {
    const { name, address, city, pincode, phone, whatsapp, party_id } =
      agentData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Agent name is required");
    }
    if (!party_id) {
      throw ApiError.badRequest("Party is required for an agent");
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Agent.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Agent with this name already exists");
    }

    const party = await Contact.findOne({
      _id: party_id,
      user_id: userId,
      type: "party",
    }).lean();
    if (!party) {
      throw ApiError.badRequest(
        "Party not found. Please select a valid party.",
      );
    }

    const agent = await Agent.create({
      id: await getNextId("Agent", userId),
      name: name.trim(),
      address,
      city,
      pincode,
      phone,
      whatsapp,
      party_id,
      user_id: userId,
    });

    return agent;
  }

  async updateAgent(agentId, userId, updateData) {
    const agent = await Agent.findOne({ _id: agentId, user_id: userId });
    if (!agent) throw ApiError.notFound("Agent not found");

    const { name, address, city, pincode, phone, whatsapp, party_id } =
      updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Agent name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Agent.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: agentId },
      });
      if (duplicate) {
        throw ApiError.conflict("Another agent with this name already exists");
      }
    }

    if (party_id !== undefined) {
      const party = await Contact.findOne({
        _id: party_id,
        user_id: userId,
        type: "party",
      }).lean();
      if (!party) {
        throw ApiError.badRequest(
          "Party not found. Please select a valid party.",
        );
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (address !== undefined) fields.address = address;
    if (city !== undefined) fields.city = city;
    if (pincode !== undefined) fields.pincode = pincode;
    if (phone !== undefined) fields.phone = phone;
    if (whatsapp !== undefined) fields.whatsapp = whatsapp;
    if (party_id !== undefined) fields.party_id = party_id;

    const updatedAgent = await Agent.findByIdAndUpdate(agentId, fields, {
      new: true,
    }).populate("party_id", "name type phone");
    return updatedAgent;
  }

  async deleteAgent(agentId, userId) {
    const agent = await Agent.findOne({ _id: agentId, user_id: userId });
    if (!agent) throw ApiError.notFound("Agent not found");
    await Agent.findByIdAndDelete(agentId);
  }
}

export default new AgentService();
