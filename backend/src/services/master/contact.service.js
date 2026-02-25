import mongoose from "mongoose";
import Contact from "../../models/master/contact.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Item from "../../models/master/item.model.js";
import Category from "../../models/master/category.model.js";
import Bank from "../../models/master/bank.model.js";
import { ApiError, Pagination, toNumber } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class ContactService {
  _escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  _normalizeString(value) {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : "";
  }

  _normalizeOptionalString(value) {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") {
      throw ApiError.badRequest("Value must be a string");
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  _sanitizeDiscountField(value, label) {
    if (value === undefined || value === null) {
      return { normal: 0, special: 0 };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw ApiError.badRequest(`${label} must be an object`);
    }

    const normal = value.normal === undefined ? 0 : Number(value.normal);
    const special = value.special === undefined ? 0 : Number(value.special);

    if (!Number.isFinite(normal) || normal < 0 || normal > 100) {
      throw ApiError.badRequest(`${label}.normal must be between 0 and 100`);
    }

    if (!Number.isFinite(special) || special < 0 || special > 100) {
      throw ApiError.badRequest(`${label}.special must be between 0 and 100`);
    }

    return { normal, special };
  }

  async _validateBankId(bankId, userId) {
    if (bankId === undefined) return undefined;
    if (bankId === null || bankId === "") return null;
    if (!mongoose.Types.ObjectId.isValid(bankId)) {
      throw ApiError.badRequest("Invalid bank_id");
    }
    const bank = await Bank.exists({ _id: bankId, user_id: userId });
    if (!bank) {
      throw ApiError.badRequest("Bank not found. Please select a valid bank.");
    }
    return bankId;
  }

  async _sanitizeItemDiscounts(itemDiscounts, userId) {
    if (itemDiscounts === undefined) return undefined;

    if (!Array.isArray(itemDiscounts)) {
      throw ApiError.badRequest("item_discounts must be an array");
    }

    const itemIds = itemDiscounts.map((entry, index) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw ApiError.badRequest(`item_discounts[${index}] must be an object`);
      }

      if (!entry.item_id) {
        throw ApiError.badRequest(
          `item_discounts[${index}].item_id is required`,
        );
      }

      return entry.item_id;
    });

    const uniqueItemIds = [...new Set(itemIds.map(String))];
    const validItems = await Item.countDocuments({
      _id: { $in: uniqueItemIds },
      user_id: userId,
    });

    if (validItems !== uniqueItemIds.length) {
      throw ApiError.badRequest(
        "One or more items in item_discounts are invalid or do not belong to you",
      );
    }

    return itemDiscounts.map((entry) => ({
      item_id: entry.item_id,
      discount1: this._sanitizeDiscountField(entry.discount1, "discount1"),
      discount2: this._sanitizeDiscountField(entry.discount2, "discount2"),
    }));
  }

  async _validateAssignedLabel(assignedLabel, userId) {
    if (assignedLabel === undefined) return undefined;

    if (assignedLabel === null || assignedLabel === "") {
      return null;
    }

    if (typeof assignedLabel !== "string" || !assignedLabel.trim()) {
      throw ApiError.badRequest("assigned_label must be a non-empty string");
    }

    const normalized = assignedLabel.trim();
    const escaped = this._escapeRegex(normalized);

    const labelExists = await Category.exists({
      user_id: userId,
      "labels.name": { $regex: new RegExp(`^${escaped}$`, "i") },
    });

    if (!labelExists) {
      throw ApiError.badRequest(
        "Assigned label not found in category labels. Create label in category first.",
      );
    }

    return normalized;
  }

  async _validateLabelId(labelId, categoryId, userId) {
    if (labelId === undefined) return undefined;
    if (labelId === null || labelId === "") return null;

    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw ApiError.badRequest("Invalid label_id");
    }

    if (!categoryId) {
      throw ApiError.badRequest(
        "category_id is required when assigning a label_id",
      );
    }

    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
      "labels._id": labelId,
    });

    if (!category) {
      throw ApiError.badRequest(
        "Label not found in the selected category. Ensure label_id belongs to the contact's category.",
      );
    }

    return labelId;
  }

  async _validateRelations(type, userId, data) {
    const { category_id, transport_id, area_id, agent_id } = data;

    if (category_id) {
      const catExists = await Category.exists({
        _id: category_id,
        user_id: userId,
      });
      if (!catExists) {
        throw ApiError.badRequest(
          "Category not found. Please select a valid category.",
        );
      }
    }

    if (type === "party" && transport_id) {
      const { default: Transport } =
        await import("../../models/master/transport.model.js");
      const transportExists = await Transport.exists({
        _id: transport_id,
        user_id: userId,
      });
      if (!transportExists) {
        throw ApiError.badRequest(
          "Transport not found. Please select a valid transport.",
        );
      }
    }

    if (type === "party" && area_id) {
      const { default: Area } =
        await import("../../models/master/area.model.js");
      const areaExists = await Area.exists({
        _id: area_id,
        user_id: userId,
      });
      if (!areaExists) {
        throw ApiError.badRequest(
          "Area not found. Please select a valid area.",
        );
      }
    }

    if (type === "party" && agent_id) {
      const { default: Agent } =
        await import("../../models/master/agent.model.js");
      const agentExists = await Agent.exists({
        _id: agent_id,
        user_id: userId,
      });
      if (!agentExists) {
        throw ApiError.badRequest(
          "Agent not found. Please select a valid agent.",
        );
      }
    }
  }

  async getContacts(userId, query) {
    const filter = { user_id: userId };

    if (query.type) filter.type = query.type;

    if (query.search) {
      const escaped = this._escapeRegex(query.search);
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { alias: { $regex: escaped, $options: "i" } },
      ];
    }

    if (query.balance_status === "due") filter.balance = { $lt: 0 };
    if (query.balance_status === "overpaid") filter.balance = { $gt: 0 };

    return Pagination.paginate(Contact, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getContactById(contactId, userId) {
    const contact = await Contact.findOne({
      _id: contactId,
      user_id: userId,
    });
    if (!contact) throw ApiError.notFound("Contact not found");
    return contact;
  }

  async createContact(contactData, userId) {
    const {
      name,
      alias,
      type,
      phone,
      whatsapp_number,
      email,
      address,
      city,
      state,
      gstin,
      cin,
      reg_number,
      signature,
      assigned_label,
      label_id,
      bank_id,
      item_discounts,
      transport_charge,
      area,
      is_gst,
      category_id,
      transport_id,
      agent_id,
      area_id,
    } = contactData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Contact name is required");
    }

    if (!type || !["party", "supplier"].includes(type)) {
      throw ApiError.badRequest("Contact type must be 'party' or 'supplier'");
    }

    const escapedName = this._escapeRegex(name.trim());
    const duplicate = await Contact.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      type,
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict(
        `${type === "party" ? "Party" : "Supplier"} with this name already exists`,
      );
    }

    await this._validateRelations(type, userId, {
      category_id,
      transport_id,
      area_id,
      agent_id,
    });

    let normalizedTransportCharge = 0;
    if (type === "party") {
      if (transport_charge === undefined || transport_charge === null) {
        throw ApiError.badRequest("transport_charge is required for party");
      }

      normalizedTransportCharge = Number(transport_charge);
      if (
        !Number.isFinite(normalizedTransportCharge) ||
        normalizedTransportCharge < 0
      ) {
        throw ApiError.badRequest(
          "transport_charge must be a non-negative number",
        );
      }
    } else if (transport_charge !== undefined && transport_charge !== null) {
      normalizedTransportCharge = Number(transport_charge);
      if (
        !Number.isFinite(normalizedTransportCharge) ||
        normalizedTransportCharge < 0
      ) {
        throw ApiError.badRequest(
          "transport_charge must be a non-negative number",
        );
      }
    }

    const normalizedBankId = await this._validateBankId(bank_id, userId);

    let normalizedItemDiscounts = [];
    if (type === "party") {
      normalizedItemDiscounts =
        (await this._sanitizeItemDiscounts(item_discounts, userId)) || [];
    }

    let normalizedAssignedLabel = null;
    let normalizedLabelId = null;
    if (type === "party") {
      normalizedAssignedLabel =
        (await this._validateAssignedLabel(assigned_label, userId)) ?? null;
      normalizedLabelId =
        (await this._validateLabelId(label_id, category_id, userId)) ?? null;
    }

    const normalizedAlias =
      alias === undefined ? undefined : this._normalizeOptionalString(alias);

    const contact = await Contact.create({
      id: await getNextId("Contact", userId),
      name: name.trim(),
      ...(normalizedAlias !== undefined ? { alias: normalizedAlias } : {}),
      type,
      phone,
      whatsapp_number,
      email,
      address,
      city,
      state,
      gstin,
      cin,
      reg_number,
      signature: this._normalizeOptionalString(signature) ?? null,
      assigned_label: normalizedAssignedLabel,
      label_id: normalizedLabelId,
      bank_id: normalizedBankId ?? null,
      item_discounts: normalizedItemDiscounts,
      transport_charge: normalizedTransportCharge,
      area,
      is_gst: is_gst ?? 1,
      category_id: category_id || null,
      transport_id: type === "party" ? transport_id || null : undefined,
      agent_id: type === "party" ? agent_id || null : undefined,
      area_id: type === "party" ? area_id || null : undefined,
      user_id: userId,
    });
    return contact;
  }

  async updateContact(contactId, userId, updateData) {
    const contact = await Contact.findOne({
      _id: contactId,
      user_id: userId,
    });
    if (!contact) throw ApiError.notFound("Contact not found");

    const {
      name,
      alias,
      phone,
      whatsapp_number,
      email,
      address,
      city,
      state,
      gstin,
      cin,
      reg_number,
      signature,
      assigned_label,
      label_id,
      bank_id,
      item_discounts,
      transport_charge,
      area,
      is_gst,
      category_id,
      transport_id,
      agent_id,
      area_id,
    } = updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Contact name cannot be empty");
      }
      const escapedName = this._escapeRegex(name.trim());
      const duplicate = await Contact.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        type: contact.type,
        user_id: userId,
        _id: { $ne: contactId },
      });
      if (duplicate) {
        throw ApiError.conflict(
          `Another ${contact.type} with this name already exists`,
        );
      }
    }

    await this._validateRelations(contact.type, userId, {
      category_id,
      transport_id,
      area_id,
      agent_id,
    });

    let normalizedTransportCharge;
    if (transport_charge !== undefined) {
      normalizedTransportCharge = Number(transport_charge);
      if (
        !Number.isFinite(normalizedTransportCharge) ||
        normalizedTransportCharge < 0
      ) {
        throw ApiError.badRequest(
          "transport_charge must be a non-negative number",
        );
      }
    }

    if (
      contact.type === "party" &&
      contact.transport_charge === undefined &&
      normalizedTransportCharge === undefined
    ) {
      normalizedTransportCharge = 0;
    }

    const normalizedBankId = await this._validateBankId(bank_id, userId);

    let normalizedItemDiscounts = await this._sanitizeItemDiscounts(
      item_discounts,
      userId,
    );

    if (contact.type !== "party") {
      if (assigned_label !== undefined || item_discounts !== undefined) {
        throw ApiError.badRequest(
          "assigned_label and item_discounts are supported only for party contacts",
        );
      }
      normalizedItemDiscounts = undefined;
    }

    const normalizedAssignedLabel =
      contact.type === "party" ?
        await this._validateAssignedLabel(assigned_label, userId)
      : undefined;

    const effectiveCategoryId =
      category_id !== undefined ? category_id : contact.category_id;

    let normalizedLabelId;
    if (contact.type === "party") {
      if (label_id !== undefined) {
        normalizedLabelId = await this._validateLabelId(
          label_id,
          effectiveCategoryId,
          userId,
        );
      } else if (category_id !== undefined) {
        // Category changed without updating label_id — auto-clear it
        normalizedLabelId = null;
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (alias !== undefined)
      fields.alias = this._normalizeOptionalString(alias);
    if (phone !== undefined) fields.phone = phone;
    if (whatsapp_number !== undefined) fields.whatsapp_number = whatsapp_number;
    if (email !== undefined) fields.email = email;
    if (address !== undefined) fields.address = address;
    if (city !== undefined) fields.city = city;
    if (state !== undefined) fields.state = state;
    if (gstin !== undefined) fields.gstin = gstin;
    if (cin !== undefined) fields.cin = cin;
    if (reg_number !== undefined) fields.reg_number = reg_number;
    if (signature !== undefined) {
      fields.signature = this._normalizeOptionalString(signature);
    }
    if (normalizedBankId !== undefined) fields.bank_id = normalizedBankId;
    if (normalizedTransportCharge !== undefined) {
      fields.transport_charge = normalizedTransportCharge;
    }
    if (area !== undefined) fields.area = area;
    if (is_gst !== undefined) fields.is_gst = is_gst;
    if (category_id !== undefined) fields.category_id = category_id;

    if (contact.type === "party") {
      if (normalizedAssignedLabel !== undefined) {
        fields.assigned_label = normalizedAssignedLabel;
      }
      if (normalizedLabelId !== undefined) {
        fields.label_id = normalizedLabelId;
      }
      if (normalizedItemDiscounts !== undefined) {
        fields.item_discounts = normalizedItemDiscounts;
      }

      if (transport_id !== undefined) fields.transport_id = transport_id;
      if (agent_id !== undefined) fields.agent_id = agent_id;
      if (area_id !== undefined) fields.area_id = area_id;
    }

    const updatedContact = await Contact.findByIdAndUpdate(contactId, fields, {
      new: true,
    });
    return updatedContact;
  }

  async getContactBalance(contactId, userId) {
    const contact = await Contact.findOne({ _id: contactId, user_id: userId })
      .select("balance")
      .lean();

    if (!contact) throw ApiError.notFound("Contact not found");
    return contact.balance || 0;
  }

  async updateBalance(contactId, userId, amount, operation) {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      throw ApiError.badRequest("amount must be a positive number");
    }

    if (!["add", "subtract"].includes(operation)) {
      throw ApiError.badRequest("operation must be 'add' or 'subtract'");
    }

    const increment = operation === "add" ? value : -value;

    const updated = await Contact.findOneAndUpdate(
      { _id: contactId, user_id: userId },
      { $inc: { balance: increment } },
      { new: true },
    )
      .select("balance")
      .lean();

    if (!updated) throw ApiError.notFound("Contact not found");
    return updated.balance || 0;
  }

  async deleteContact(contactId, userId) {
    const contact = await Contact.findOne({
      _id: contactId,
      user_id: userId,
    });
    if (!contact) throw ApiError.notFound("Contact not found");

    if (contact.type === "party") {
      const activeChallanCount = await Challan.countDocuments({
        contact_id: contactId,
        user_id: userId,
        challan_type: "sale",
        converted_to_bill: false,
      });
      if (activeChallanCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete party with ${activeChallanCount} active challan(s). Delete or bill them first.`,
        );
      }

      const unpaidBillCount = await Bill.countDocuments({
        contact_id: contactId,
        user_id: userId,
        payment_status: "due",
      });
      if (unpaidBillCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete party with ${unpaidBillCount} unpaid bill(s). Settle them first.`,
        );
      }

      await Promise.all([
        Bill.deleteMany({ contact_id: contactId, user_id: userId }),
        Challan.deleteMany({ contact_id: contactId, user_id: userId }),
      ]);
    } else {
      const unpaidPurchaseCount = await Challan.countDocuments({
        contact_id: contactId,
        user_id: userId,
        challan_type: "purchase",
        payment_status: "due",
      });
      if (unpaidPurchaseCount > 0) {
        throw ApiError.badRequest(
          `Cannot delete supplier with ${unpaidPurchaseCount} unpaid purchase(s). Settle them first.`,
        );
      }

      await Challan.deleteMany({
        contact_id: contactId,
        user_id: userId,
      });
    }

    await Contact.findByIdAndDelete(contactId);
  }
}

export default new ContactService();
