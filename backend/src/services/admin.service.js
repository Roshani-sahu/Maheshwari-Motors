import bcrypt from "bcryptjs";
import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
import { ApiError } from "../utils/index.js";

/**
 * Admin Service
 *
 * Functions for admin-only operations:
 * - Create firm pair (GST + NON_GST)
 * - Manage firms
 * - View all firm pairs
 */
class AdminService {
  /**
   * Create a new firm pair (GST + NON_GST firms together)
   * This creates both firms and links them as a pair
   */
  async createFirmPair(adminId, pairData) {
    const { business_name, gst_firm, nongst_firm } = pairData;

    // Validate GST firm has GSTIN
    if (!gst_firm.GSTIN) {
      throw ApiError.badRequest("GST firm must have GSTIN");
    }

    // Check username uniqueness
    const existingGstUsername = await Firm.findOne({
      username: gst_firm.username,
    });
    if (existingGstUsername) {
      throw ApiError.conflict(`Username '${gst_firm.username}' already exists`);
    }

    const existingNongstUsername = await Firm.findOne({
      username: nongst_firm.username,
    });
    if (existingNongstUsername) {
      throw ApiError.conflict(
        `Username '${nongst_firm.username}' already exists`,
      );
    }

    // Hash passwords
    const gstHashedPassword = await bcrypt.hash(gst_firm.password, 10);
    const nongstHashedPassword = await bcrypt.hash(nongst_firm.password, 10);

    // Create GST firm
    const gstFirm = await Firm.create({
      ...gst_firm,
      password: gstHashedPassword,
      type: "GST",
      admin_id: adminId,
    });

    // Create NON_GST firm
    const nongstFirm = await Firm.create({
      ...nongst_firm,
      password: nongstHashedPassword,
      type: "NON_GST",
      admin_id: adminId,
    });

    // Create the pair
    const pair = await FirmPair.create({
      name: business_name,
      gst_firm_id: gstFirm._id,
      nongst_firm_id: nongstFirm._id,
      admin_id: adminId,
    });

    return {
      pair: pair,
      gst_firm: {
        _id: gstFirm._id,
        name: gstFirm.name,
        username: gstFirm.username,
        type: gstFirm.type,
      },
      nongst_firm: {
        _id: nongstFirm._id,
        name: nongstFirm.name,
        username: nongstFirm.username,
        type: nongstFirm.type,
      },
    };
  }

  /**
   * Get all firm pairs for this admin
   */
  async getFirmPairs(adminId) {
    const pairs = await FirmPair.find({ admin_id: adminId, is_active: true })
      .populate("gst_firm_id", "name username email phone GSTIN is_active")
      .populate("nongst_firm_id", "name username email phone is_active")
      .sort({ createdAt: -1 });

    return pairs;
  }

  /**
   * Get a single firm pair by ID
   */
  async getFirmPairById(pairId, adminId) {
    const pair = await FirmPair.findOne({ _id: pairId, admin_id: adminId })
      .populate("gst_firm_id", "-password")
      .populate("nongst_firm_id", "-password");

    if (!pair) {
      throw ApiError.notFound("Firm pair not found");
    }

    return pair;
  }

  /**
   * Update a firm's credentials
   */
  async updateFirmCredentials(firmId, adminId, updateData) {
    const firm = await Firm.findOne({ _id: firmId, admin_id: adminId });
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    if (updateData.username && updateData.username !== firm.username) {
      const existing = await Firm.findOne({ username: updateData.username });
      if (existing) {
        throw ApiError.conflict(
          `Username '${updateData.username}' already exists`,
        );
      }
      firm.username = updateData.username;
    }

    if (updateData.password) {
      firm.password = await bcrypt.hash(updateData.password, 10);
    }

    if (updateData.name) firm.name = updateData.name;
    if (updateData.email) firm.email = updateData.email;
    if (updateData.phone) firm.phone = updateData.phone;
    if (updateData.address) firm.address = updateData.address;
    if (updateData.godown_address !== undefined)
      firm.godown_address = updateData.godown_address;
    if (updateData.city) firm.city = updateData.city;
    if (updateData.state) firm.state = updateData.state;
    if (updateData.GSTIN !== undefined) firm.GSTIN = updateData.GSTIN;
    if (updateData.CIN !== undefined) firm.CIN = updateData.CIN;
    if (updateData.reg_number !== undefined)
      firm.reg_number = updateData.reg_number;
    if (updateData.bank_name !== undefined)
      firm.bank_name = updateData.bank_name;
    if (updateData.bank_branch !== undefined)
      firm.bank_branch = updateData.bank_branch;
    if (updateData.ifsc_code !== undefined)
      firm.ifsc_code = updateData.ifsc_code;
    if (updateData.account_number !== undefined)
      firm.account_number = updateData.account_number;

    await firm.save();

    const result = firm.toObject();
    delete result.password;
    return result;
  }

  /**
   * Deactivate a firm pair (soft delete)
   */
  async deactivateFirmPair(pairId, adminId) {
    const pair = await FirmPair.findOne({ _id: pairId, admin_id: adminId });
    if (!pair) {
      throw ApiError.notFound("Firm pair not found");
    }

    // Deactivate both firms
    await Firm.updateMany(
      { _id: { $in: [pair.gst_firm_id, pair.nongst_firm_id] } },
      { is_active: false },
    );

    pair.is_active = false;
    await pair.save();

    return pair;
  }

  /**
   * Reactivate a firm pair
   */
  async reactivateFirmPair(pairId, adminId) {
    const pair = await FirmPair.findOne({ _id: pairId, admin_id: adminId });
    if (!pair) {
      throw ApiError.notFound("Firm pair not found");
    }

    // Reactivate both firms
    await Firm.updateMany(
      { _id: { $in: [pair.gst_firm_id, pair.nongst_firm_id] } },
      { is_active: true },
    );

    pair.is_active = true;
    await pair.save();

    return pair;
  }
}

export default new AdminService();
