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
    const supplier = await Supplier.create({
      ...supplierData,
      id: await getNextId("Supplier", userId),
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

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      supplierId,
      updateData,
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
