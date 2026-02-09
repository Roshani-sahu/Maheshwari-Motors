import Supplier from "../models/supplier.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class SupplierService {
  async getSuppliers(userId, query) {
    const filter = { user_id: userId };
    if (query.search) filter.name = { $regex: query.search, $options: "i" };

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
    await Supplier.findByIdAndDelete(supplierId);
  }
}

export default new SupplierService();
