import Item from "../../models/master/item.model.js";
import Brand from "../../models/master/brand.model.js";
import Category from "../../models/master/category.model.js";
import Contact from "../../models/master/contact.model.js";
import Department from "../../models/master/department.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import {
  generateUniqueBarcode,
  generateUniqueItemId,
  isValidBarcodeFormat,
} from "../../helpers/identifierGenerator.js";
import s3Service from "../common/s3.service.js";

class ItemService {
  _toNumber(value, fieldLabel, { allowNegative = false } = {}) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      throw ApiError.badRequest(`${fieldLabel} must be a valid number`);
    }
    if (!allowNegative && numeric < 0) {
      throw ApiError.badRequest(`${fieldLabel} must be a non-negative number`);
    }
    return numeric;
  }

  _resolveVisibleStock(item, isGst) {
    const physical =
      typeof item.physical_stock === "number" ? item.physical_stock : (item.stock || 0);
    const logical = typeof item.logical_stock === "number" ? item.logical_stock : 0;

    if (isGst === 0) return physical + logical;
    return physical;
  }

  _normalizeStockForResponse(item, isGst) {
    if (!item) return item;

    const normalized =
      typeof item.toObject === "function" ? item.toObject() : { ...item };

    const physical =
      typeof normalized.physical_stock === "number" ?
        normalized.physical_stock
      : typeof normalized.stock === "number" ?
        normalized.stock
      : 0;

    const logical =
      typeof normalized.logical_stock === "number" ? normalized.logical_stock : 0;

    normalized.physical_stock = physical;
    normalized.logical_stock = logical;
    normalized.stock = this._resolveVisibleStock(normalized, isGst);

    return normalized;
  }

  async getItems(userId, query, isGst) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    const result = await Pagination.paginate(Item, filter, {
      ...query,
      sort: { createdAt: -1 },
    });

    result.data = result.data.map((item) => this._normalizeStockForResponse(item, isGst));
    return result;
  }

  async getItemById(itemId, userId, isGst) {
    const item = await Item.findOne({ _id: itemId, user_id: userId }).lean();
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    return this._normalizeStockForResponse(item, isGst);
  }

  async createItem(itemData, userId, file = null, isGst) {
    const {
      item_name,
      barcode,
      item_id,
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock,
      physical_stock,
      logical_stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      contact_id,
      dept_id,
    } = itemData;

    if (!item_name || typeof item_name !== "string" || !item_name.trim()) {
      throw ApiError.badRequest("Item name is required");
    }
    if (sale_rate === undefined || sale_rate === null) {
      throw ApiError.badRequest("Sale rate is required");
    }
    if (typeof sale_rate !== "number" || sale_rate < 0) {
      throw ApiError.badRequest("Sale rate must be a non-negative number");
    }

    let finalBarcode;
    if (barcode !== undefined && barcode !== null && barcode !== "") {
      if (!isValidBarcodeFormat(barcode)) {
        throw ApiError.badRequest(
          "Barcode must be exactly 10 alphanumeric characters",
        );
      }
      const barcodeExists = await Item.exists({ barcode: barcode.toUpperCase() });
      if (barcodeExists) {
        throw ApiError.conflict(
          `Barcode '${barcode}' is already in use by another item`,
        );
      }
      finalBarcode = barcode.toUpperCase();
    } else {
      finalBarcode = await generateUniqueBarcode();
    }

    let finalItemId;
    if (item_id !== undefined && item_id !== null && item_id !== "") {
      const numericId = Number(item_id);
      if (!Number.isFinite(numericId) || numericId < 1 || numericId % 1 !== 0) {
        throw ApiError.badRequest("Item ID must be a positive integer");
      }
      const itemIdExists = await Item.exists({ item_id: numericId });
      if (itemIdExists) {
        throw ApiError.conflict(
          `Item ID '${numericId}' is already in use by another item`,
        );
      }
      finalItemId = numericId;
    } else {
      finalItemId = await generateUniqueItemId(userId);
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

    const finalPhysicalStock =
      physical_stock !== undefined ?
        this._toNumber(physical_stock, "Physical stock")
      : stock !== undefined ?
        this._toNumber(stock, "Stock")
      : 0;

    const finalLogicalStock =
      logical_stock !== undefined ?
        this._toNumber(logical_stock, "Logical stock", { allowNegative: true })
      : 0;

    if (
      threshold !== undefined &&
      (typeof threshold !== "number" || threshold < 0)
    ) {
      throw ApiError.badRequest("Threshold must be a non-negative number");
    }

    const escapedName = item_name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Item.findOne({
      item_name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Item with this name already exists");
    }

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
    if (contact_id) {
      const contactExists = await Contact.exists({
        _id: contact_id,
        user_id: userId,
      });
      if (!contactExists) {
        throw ApiError.badRequest(
          "Contact not found. Please select a valid contact.",
        );
      }
    }
    if (dept_id) {
      const deptExists = await Department.exists({
        _id: dept_id,
        user_id: userId,
      });
      if (!deptExists) {
        throw ApiError.badRequest(
          "Department not found. Please select a valid department.",
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
      barcode: finalBarcode,
      item_id: finalItemId,
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock: finalPhysicalStock,
      physical_stock: finalPhysicalStock,
      logical_stock: finalLogicalStock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      contact_id,
      dept_id,
      image: imageUrl,
      user_id: userId,
    });

    if (brand_id) {
      await Brand.findByIdAndUpdate(brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }

    return this._normalizeStockForResponse(item, isGst);
  }

  async updateItem(itemId, userId, updateData, file = null, isGst) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    const {
      item_name,
      barcode,
      item_id,
      sale_rate,
      purchase_rate,
      mrp_rate,
      gst_percent,
      discount,
      stock,
      physical_stock,
      logical_stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      contact_id,
      dept_id,
    } = updateData;

    if (item_name !== undefined) {
      if (typeof item_name !== "string" || !item_name.trim()) {
        throw ApiError.badRequest("Item name cannot be empty");
      }

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

    if (barcode !== undefined && barcode !== null && barcode !== "") {
      if (!isValidBarcodeFormat(barcode)) {
        throw ApiError.badRequest(
          "Barcode must be exactly 10 alphanumeric characters",
        );
      }
      const barcodeExists = await Item.exists({
        barcode: barcode.toUpperCase(),
        _id: { $ne: itemId },
      });
      if (barcodeExists) {
        throw ApiError.conflict(
          `Barcode '${barcode}' is already in use by another item`,
        );
      }
    }

    if (item_id !== undefined && item_id !== null && item_id !== "") {
      const numericId = Number(item_id);
      if (!Number.isFinite(numericId) || numericId < 1 || numericId % 1 !== 0) {
        throw ApiError.badRequest("Item ID must be a positive integer");
      }
      const itemIdExists = await Item.exists({
        item_id: numericId,
        _id: { $ne: itemId },
      });
      if (itemIdExists) {
        throw ApiError.conflict(
          `Item ID '${numericId}' is already in use by another item`,
        );
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

    if (
      threshold !== undefined &&
      (typeof threshold !== "number" || threshold < 0)
    ) {
      throw ApiError.badRequest("Threshold must be a non-negative number");
    }

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
    if (contact_id !== undefined && contact_id !== null) {
      const contactExists = await Contact.exists({
        _id: contact_id,
        user_id: userId,
      });
      if (!contactExists) {
        throw ApiError.badRequest(
          "Contact not found. Please select a valid contact.",
        );
      }
    }
    if (dept_id !== undefined && dept_id !== null) {
      const deptExists = await Department.exists({
        _id: dept_id,
        user_id: userId,
      });
      if (!deptExists) {
        throw ApiError.badRequest(
          "Department not found. Please select a valid department.",
        );
      }
    }

    const fields = {};
    if (item_name !== undefined) fields.item_name = item_name.trim();
    if (barcode !== undefined && barcode !== null && barcode !== "") {
      fields.barcode = barcode.toUpperCase();
    }
    if (item_id !== undefined && item_id !== null && item_id !== "") {
      fields.item_id = Number(item_id);
    }
    if (sale_rate !== undefined) fields.sale_rate = sale_rate;
    if (purchase_rate !== undefined) fields.purchase_rate = purchase_rate;
    if (mrp_rate !== undefined) fields.mrp_rate = mrp_rate;
    if (gst_percent !== undefined) fields.gst_percent = gst_percent;
    if (discount !== undefined) fields.discount = discount;

    if (physical_stock !== undefined) {
      fields.physical_stock = this._toNumber(physical_stock, "Physical stock");
      fields.stock = fields.physical_stock;
    }

    if (logical_stock !== undefined) {
      fields.logical_stock = this._toNumber(logical_stock, "Logical stock", {
        allowNegative: true,
      });
    }

    if (stock !== undefined) {
      const numericStock = this._toNumber(stock, "Stock");
      fields.physical_stock = numericStock;
      fields.stock = numericStock;
    }

    if (threshold !== undefined) fields.threshold = threshold;
    if (is_gst !== undefined) fields.is_gst = is_gst;
    if (category_id !== undefined) fields.category_id = category_id;
    if (brand_id !== undefined) fields.brand_id = brand_id;
    if (contact_id !== undefined) fields.contact_id = contact_id;
    if (dept_id !== undefined) fields.dept_id = dept_id;

    if (brand_id !== undefined) {
      const oldBrandId = item.brand_id ? String(item.brand_id) : null;
      const newBrandId = brand_id ? String(brand_id) : null;

      if (oldBrandId !== newBrandId) {
        if (oldBrandId) {
          await Brand.findByIdAndUpdate(oldBrandId, {
            $pull: { item_ids: item._id },
          });
        }
        if (newBrandId) {
          await Brand.findByIdAndUpdate(newBrandId, {
            $addToSet: { item_ids: item._id },
          });
        }
      }
    }

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
    }).lean();

    return this._normalizeStockForResponse(updatedItem, isGst);
  }

  async deleteItem(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (item.image) {
      await s3Service.deleteFile(item.image);
    }

    if (item.brand_id) {
      await Brand.findByIdAndUpdate(item.brand_id, {
        $pull: { item_ids: item._id },
      });
    }

    await Item.findByIdAndDelete(itemId);
  }

  async updateStock(itemId, userId, stockData, isGst) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (stockData.physical_stock !== undefined) {
      const physical = this._toNumber(stockData.physical_stock, "Physical stock");
      item.physical_stock = physical;
      item.stock = physical;
    }

    if (stockData.logical_stock !== undefined) {
      item.logical_stock = this._toNumber(
        stockData.logical_stock,
        "Logical stock",
        { allowNegative: true },
      );
    }

    if (stockData.stock !== undefined) {
      const numericStock = this._toNumber(stockData.stock, "Stock");
      if (isGst === 0) {
        const physical =
          typeof item.physical_stock === "number" ? item.physical_stock : (item.stock || 0);
        item.logical_stock = numericStock - physical;
      } else {
        item.physical_stock = numericStock;
        item.stock = numericStock;
      }
    }

    if (item.physical_stock < 0) {
      throw ApiError.badRequest("Physical stock cannot be negative");
    }

    await item.save();
    return this._normalizeStockForResponse(item, isGst);
  }

  async getLowStockItems(userId, query = {}, isGst) {
    const { page, limit, skip } = Pagination.getParams(query);

    const baseMatch = {
      user_id: userId,
      threshold: { $gt: 0 },
    };

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      baseMatch.item_name = { $regex: escaped, $options: "i" };
    }

    if (isGst === 0) {
      const [aggResult] = await Item.aggregate([
        { $match: baseMatch },
        {
          $addFields: {
            _physical: { $ifNull: ["$physical_stock", "$stock"] },
            _logical: { $ifNull: ["$logical_stock", 0] },
          },
        },
        { $addFields: { visible_stock: { $add: ["$_physical", "$_logical"] } } },
        { $match: { $expr: { $lte: ["$visible_stock", "$threshold"] } } },
        { $sort: { visible_stock: 1, createdAt: -1 } },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            meta: [{ $count: "total" }],
          },
        },
      ]);

      const total = aggResult?.meta?.[0]?.total || 0;
      const data = (aggResult?.data || []).map((item) =>
        this._normalizeStockForResponse(item, isGst),
      );

      return {
        data,
        meta: Pagination.createMeta(total, page, limit),
      };
    }

    const filter = {
      user_id: userId,
      threshold: { $gt: 0 },
      $expr: {
        $lte: [{ $ifNull: ["$physical_stock", "$stock"] }, "$threshold"],
      },
    };

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    const result = await Pagination.paginate(Item, filter, {
      ...query,
      sort: { physical_stock: 1, createdAt: -1 },
    });

    result.data = result.data.map((item) => this._normalizeStockForResponse(item, isGst));
    return result;
  }
}

export default new ItemService();
