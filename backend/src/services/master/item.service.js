import Item from "../../models/master/item.model.js";
import Brand from "../../models/master/brand.model.js";
import Category from "../../models/master/category.model.js";
import Supplier from "../../models/master/supplier.model.js";
import StockAlert from "../../models/inventory/stockAlert.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import s3Service from "../common/s3.service.js";

class ItemService {
  async syncStockAlert(item, userId) {
    if (item.stock < item.threshold) {
      const existingAlert = await StockAlert.findOne({
        item_id: item._id,
        user_id: userId,
        is_resolved: false,
      });

      if (existingAlert) {
        await StockAlert.updateOne(
          { _id: existingAlert._id },
          { stock_count: item.stock, threshold: item.threshold },
        );
        return;
      }

      const nextId = await getNextId("StockAlert", userId);
      await StockAlert.create({
        id: nextId,
        item_id: item._id,
        stock_count: item.stock,
        threshold: item.threshold,
        user_id: userId,
      });
      return;
    }

    await StockAlert.updateMany(
      { item_id: item._id, user_id: userId, is_resolved: false },
      { is_resolved: true },
    );
  }

  async getItems(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Item, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getItemById(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }
    return item;
  }

  async createItem(itemData, userId, file = null) {
    const {
      item_name,
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      supplier_id,
    } = itemData;

    // --- Required field checks ---
    if (!item_name || typeof item_name !== "string" || !item_name.trim()) {
      throw ApiError.badRequest("Item name is required");
    }
    if (sale_rate === undefined || sale_rate === null) {
      throw ApiError.badRequest("Sale rate is required");
    }
    if (typeof sale_rate !== "number" || sale_rate < 0) {
      throw ApiError.badRequest("Sale rate must be a non-negative number");
    }

    // --- Optional numeric field guards ---
    if (
      purchase_rate !== undefined &&
      (typeof purchase_rate !== "number" || purchase_rate < 0)
    ) {
      throw ApiError.badRequest("Purchase rate must be a non-negative number");
    }
    if (
      mrp_rate !== undefined &&
      (typeof mrp_rate !== "number" || mrp_rate < 0)
    ) {
      throw ApiError.badRequest("MRP rate must be a non-negative number");
    }
    if (
      gst_percent !== undefined &&
      (typeof gst_percent !== "number" || gst_percent < 0 || gst_percent > 100)
    ) {
      throw ApiError.badRequest("GST percent must be between 0 and 100");
    }
    if (
      discount !== undefined &&
      (typeof discount !== "number" || discount < 0 || discount > 100)
    ) {
      throw ApiError.badRequest("Discount must be between 0 and 100");
    }
    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      throw ApiError.badRequest("Stock must be a non-negative number");
    }
    if (
      threshold !== undefined &&
      (typeof threshold !== "number" || threshold < 0)
    ) {
      throw ApiError.badRequest("Threshold must be a non-negative number");
    }

    // --- Duplicate name check ---
    const escapedName = item_name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Item.findOne({
      item_name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Item with this name already exists");
    }

    // --- Reference existence checks ---
    if (category_id) {
      const categoryExists = await Category.exists({
        _id: category_id,
        user_id: userId,
      });
      if (!categoryExists) {
        throw ApiError.badRequest(
          "Category not found. Please select a valid category.",
        );
      }
    }
    if (brand_id) {
      const brandExists = await Brand.exists({
        _id: brand_id,
        user_id: userId,
      });
      if (!brandExists) {
        throw ApiError.badRequest(
          "Brand not found. Please select a valid brand.",
        );
      }
    }
    if (supplier_id) {
      const supplierExists = await Supplier.exists({
        _id: supplier_id,
        user_id: userId,
      });
      if (!supplierExists) {
        throw ApiError.badRequest(
          "Supplier not found. Please select a valid supplier.",
        );
      }
    }

    let imageUrl = null;

    if (file) {
      imageUrl = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "items",
      );
    }

    const nextId = await getNextId("Item", userId);

    const item = await Item.create({
      id: nextId,
      item_name: item_name.trim(),
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      supplier_id,
      image: imageUrl,
      user_id: userId,
    });

    if (brand_id) {
      await Brand.findByIdAndUpdate(brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }

    await this.syncStockAlert(item, userId);

    return item;
  }

  async updateItem(itemId, userId, updateData, file = null) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    const {
      item_name,
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      supplier_id,
    } = updateData;

    // --- Field-level validations for provided fields ---
    if (item_name !== undefined) {
      if (typeof item_name !== "string" || !item_name.trim()) {
        throw ApiError.badRequest("Item name cannot be empty");
      }
      // Duplicate check on rename
      const escapedName = item_name
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Item.findOne({
        item_name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: itemId },
      });
      if (duplicate) {
        throw ApiError.conflict("Another item with this name already exists");
      }
    }
    if (
      sale_rate !== undefined &&
      (typeof sale_rate !== "number" || sale_rate < 0)
    ) {
      throw ApiError.badRequest("Sale rate must be a non-negative number");
    }
    if (
      purchase_rate !== undefined &&
      (typeof purchase_rate !== "number" || purchase_rate < 0)
    ) {
      throw ApiError.badRequest("Purchase rate must be a non-negative number");
    }
    if (
      mrp_rate !== undefined &&
      (typeof mrp_rate !== "number" || mrp_rate < 0)
    ) {
      throw ApiError.badRequest("MRP rate must be a non-negative number");
    }
    if (
      gst_percent !== undefined &&
      (typeof gst_percent !== "number" || gst_percent < 0 || gst_percent > 100)
    ) {
      throw ApiError.badRequest("GST percent must be between 0 and 100");
    }
    if (
      discount !== undefined &&
      (typeof discount !== "number" || discount < 0 || discount > 100)
    ) {
      throw ApiError.badRequest("Discount must be between 0 and 100");
    }
    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      throw ApiError.badRequest("Stock must be a non-negative number");
    }
    if (
      threshold !== undefined &&
      (typeof threshold !== "number" || threshold < 0)
    ) {
      throw ApiError.badRequest("Threshold must be a non-negative number");
    }

    // --- Reference existence checks ---
    if (category_id !== undefined && category_id !== null) {
      const categoryExists = await Category.exists({
        _id: category_id,
        user_id: userId,
      });
      if (!categoryExists) {
        throw ApiError.badRequest(
          "Category not found. Please select a valid category.",
        );
      }
    }
    if (brand_id !== undefined && brand_id !== null) {
      const brandExists = await Brand.exists({
        _id: brand_id,
        user_id: userId,
      });
      if (!brandExists) {
        throw ApiError.badRequest(
          "Brand not found. Please select a valid brand.",
        );
      }
    }
    if (supplier_id !== undefined && supplier_id !== null) {
      const supplierExists = await Supplier.exists({
        _id: supplier_id,
        user_id: userId,
      });
      if (!supplierExists) {
        throw ApiError.badRequest(
          "Supplier not found. Please select a valid supplier.",
        );
      }
    }

    const fields = {};
    if (item_name !== undefined) fields.item_name = item_name.trim();
    if (sale_rate !== undefined) fields.sale_rate = sale_rate;
    if (purchase_rate !== undefined) fields.purchase_rate = purchase_rate;
    if (mrp_rate !== undefined) fields.mrp_rate = mrp_rate;
    if (gst_percent !== undefined) fields.gst_percent = gst_percent;
    if (discount !== undefined) fields.discount = discount;
    if (stock !== undefined) fields.stock = stock;
    if (threshold !== undefined) fields.threshold = threshold;
    if (is_gst !== undefined) fields.is_gst = is_gst;
    if (category_id !== undefined) fields.category_id = category_id;
    if (brand_id !== undefined) fields.brand_id = brand_id;
    if (supplier_id !== undefined) fields.supplier_id = supplier_id;

    if (file) {
      if (item.image) {
        await s3Service.deleteFile(item.image);
      }
      fields.image = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "items",
      );
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, fields, {
      new: true,
    });

    await this.syncStockAlert(updatedItem, userId);

    return updatedItem;
  }

  async deleteItem(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (item.image) {
      await s3Service.deleteFile(item.image);
    }

    await Promise.all([
      StockAlert.deleteMany({ item_id: itemId, user_id: userId }),
      Brand.updateMany(
        { item_ids: itemId, user_id: userId },
        { $pull: { item_ids: itemId } },
      ),
    ]);

    await Item.findByIdAndDelete(itemId);
  }

  async updateStock(itemId, userId, stockData) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (stockData.stock !== undefined) {
      if (typeof stockData.stock !== "number" || stockData.stock < 0) {
        throw ApiError.badRequest("Stock must be a non-negative number");
      }
      item.stock = stockData.stock;
    }

    await item.save();
    await this.syncStockAlert(item, userId);
    return item;
  }

  async getLowStockItems(userId) {
    return Item.find({
      user_id: userId,
      $expr: { $lt: ["$stock", "$threshold"] },
    }).lean();
  }
}

export default new ItemService();
