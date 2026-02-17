import Supplier from "../../models/master/supplier.model.js";
import Purchase from "../../models/transaction/purchase.model.js";
import Transaction from "../../models/transaction/transaction.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class SupplierService {
  async getSuppliers(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Supplier, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getSupplierById(supplierId, userId) {
    const supplier = await Supplier.findOne({
      _id: supplierId,
      user_id: userId,
    });
    if (!supplier) {
      throw ApiError.notFound("Supplier not found");
    }
    return supplier;
  }

  async createSupplier(supplierData, userId) {
    const { name, phone, email, address, city, state, gstin } = supplierData;

    // --- Required field check ---
    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Supplier name is required");
    }

    // --- Duplicate name check ---
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Supplier.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Supplier with this name already exists");
    }

    const supplier = await Supplier.create({
      id: await getNextId("Supplier", userId),
      name: name.trim(),
      phone,
      email,
      address,
      city,
      state,
      gstin,
      user_id: userId,
    });
    return supplier;
  }

  async updateSupplier(supplierId, userId, updateData) {
    const supplier = await Supplier.findOne({
      _id: supplierId,
      user_id: userId,
    });
    if (!supplier) {
      throw ApiError.notFound("Supplier not found");
    }

    const { name, phone, email, address, city, state, gstin } = updateData;

    // --- Name validation on rename ---
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Supplier name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Supplier.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: supplierId },
      });
      if (duplicate) {
        throw ApiError.conflict(
          "Another supplier with this name already exists",
        );
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

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      fields,
      { new: true },
    );
    return updatedSupplier;
  }

  async deleteSupplier(supplierId, userId) {
    const supplier = await Supplier.findOne({
      _id: supplierId,
      user_id: userId,
    });
    if (!supplier) {
      throw ApiError.notFound("Supplier not found");
    }

    const unpaidPurchaseCount = await Purchase.countDocuments({
      supplier_id: supplierId,
      payment_status: "due",
    });
    if (unpaidPurchaseCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete supplier with ${unpaidPurchaseCount} unpaid purchase(s). Settle them first.`,
      );
    }

    await Promise.all([
      Transaction.deleteMany({ supplier_id: supplierId }),
      Purchase.deleteMany({ supplier_id: supplierId }),
    ]);

    await Supplier.findByIdAndDelete(supplierId);
  }
}

export default new SupplierService();
