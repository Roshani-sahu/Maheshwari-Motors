import Contact from "../../models/master/contact.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class ContactService {
  async getContacts(userId, query) {
    const filter = { user_id: userId };

    if (query.type) filter.type = query.type;

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
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
      type,
      phone,
      email,
      address,
      city,
      state,
      gstin,
      is_gst,
      category_id,
      transport_id,
      area_id,
    } = contactData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Contact name is required");
    }

    if (!type || !["party", "supplier"].includes(type)) {
      throw ApiError.badRequest("Contact type must be 'party' or 'supplier'");
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    if (category_id) {
      const { default: Category } =
        await import("../../models/master/category.model.js");
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

    const contact = await Contact.create({
      id: await getNextId("Contact", userId),
      name: name.trim(),
      type,
      phone,
      email,
      address,
      city,
      state,
      gstin,
      is_gst: is_gst ?? 1,
      category_id: category_id || null,
      transport_id: type === "party" ? transport_id || null : undefined,
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
      phone,
      email,
      address,
      city,
      state,
      gstin,
      is_gst,
      category_id,
      transport_id,
      area_id,
    } = updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Contact name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    if (category_id !== undefined) {
      if (category_id !== null) {
        const { default: Category } =
          await import("../../models/master/category.model.js");
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
    }

    if (transport_id !== undefined && contact.type === "party") {
      if (transport_id !== null) {
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
    }

    if (area_id !== undefined && contact.type === "party") {
      if (area_id !== null) {
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
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (phone !== undefined) fields.phone = phone;
    if (email !== undefined) fields.email = email;
    if (address !== undefined) fields.address = address;
    if (city !== undefined) fields.city = city;
    if (state !== undefined) fields.state = state;
    if (gstin !== undefined) fields.gstin = gstin;
    if (is_gst !== undefined) fields.is_gst = is_gst;
    if (category_id !== undefined) fields.category_id = category_id;
    if (transport_id !== undefined && contact.type === "party")
      fields.transport_id = transport_id;
    if (area_id !== undefined && contact.type === "party")
      fields.area_id = area_id;

    const updatedContact = await Contact.findByIdAndUpdate(contactId, fields, {
      new: true,
    });
    return updatedContact;
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

  async getContactBalance(contactId, userId) {
    const contact = await Contact.findOne({
      _id: contactId,
      user_id: userId,
    });
    if (!contact) throw ApiError.notFound("Contact not found");
    return contact.balance;
  }

  async updateBalance(contactId, userId, amount, operation = "add") {
    const contact = await Contact.findOne({
      _id: contactId,
      user_id: userId,
    });
    if (!contact) throw ApiError.notFound("Contact not found");

    if (typeof amount !== "number" || isNaN(amount) || amount < 0) {
      throw ApiError.badRequest("Amount must be a non-negative number");
    }
    if (!["add", "subtract"].includes(operation)) {
      throw ApiError.badRequest("Operation must be 'add' or 'subtract'");
    }

    const adjustedAmount = operation === "subtract" ? -amount : amount;
    const updatedContact = await Contact.findByIdAndUpdate(
      contactId,
      { $inc: { balance: adjustedAmount } },
      { new: true },
    );
    return updatedContact.balance;
  }
}

export default new ContactService();
