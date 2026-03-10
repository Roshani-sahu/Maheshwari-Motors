import Item from "../../models/master/item.model.js";
import Brand from "../../models/master/brand.model.js";
import Contact from "../../models/master/contact.model.js";
import Department from "../../models/master/department.model.js";
import Hsn from "../../models/master/hsn.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Bill from "../../models/transaction/bill.model.js";
import {
  ApiError,
  Pagination,
  toNumber,
  toNumberIfDefined,
} from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import {
  generateUniqueBarcode,
  generateUniqueItemId,
  isValidBarcodeFormat,
} from "../../helpers/identifierGenerator.js";
import s3Service from "../common/s3.service.js";

const ITEM_POPULATE = [
  { path: "brand_id", select: "name" },
  // { path: "contact_id", select: "name" },
  { path: "dept_id", select: "name" },
  { path: "hsn_id", select: "hsn_code description gst_rate" },
];

class ItemService {
  _toNumber(value, fieldLabel, opts) {
    return toNumber(value, fieldLabel, opts);
  }

  _resolveVisibleStock(item, isGst) {
    const physical =
      typeof item.physical_stock === "number" ?
        item.physical_stock
      : item.stock || 0;
    const logical =
      typeof item.logical_stock === "number" ? item.logical_stock : 0;

    if (isGst === 0) return physical + logical;
    return physical;
  }

  _normalizeStockForResponse(item, isGst) {
    if (!item) return item;

    const normalized =
      typeof item.toObject === "function" ? item.toObject() : { ...item };

    const physical =
      typeof normalized.physical_stock === "number" ? normalized.physical_stock
      : typeof normalized.stock === "number" ? normalized.stock
      : 0;

    const logical =
      typeof normalized.logical_stock === "number" ?
        normalized.logical_stock
      : 0;

    normalized.physical_stock = physical;
    normalized.logical_stock = logical;
    normalized.stock = this._resolveVisibleStock(normalized, isGst);

    return normalized;
  }

  async getItems(userId, query, isGst) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { item_name: { $regex: escaped, $options: "i" } },
        { alias: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const result = await Pagination.paginate(Item, filter, {
      ...query,
      populate: ITEM_POPULATE,
      sort: { createdAt: -1 },
    });

    result.data = result.data.map((item) =>
      this._normalizeStockForResponse(item, isGst),
    );

    return result;
  }

  async getItemById(itemId, userId, isGst) {
    const item = await Item.findOne({ _id: itemId, user_id: userId })
      .populate(ITEM_POPULATE)
      .lean();
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
      alias,
      description,
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
      brand_id,
      contact_id,
      dept_id,
      hsn_id,
    } = itemData;

    if (!item_name || typeof item_name !== "string" || !item_name.trim()) {
      throw ApiError.badRequest("Item name is required");
    }
    if (sale_rate === undefined || sale_rate === null) {
      throw ApiError.badRequest("Sale rate is required");
    }
    const parsedSaleRate = toNumber(sale_rate, "Sale rate");

    let finalBarcode;
    if (barcode !== undefined && barcode !== null && barcode !== "") {
      if (!isValidBarcodeFormat(barcode)) {
        throw ApiError.badRequest(
          "Barcode must be exactly 10 alphanumeric characters",
        );
      }
      const barcodeExists = await Item.exists({
        barcode: barcode.toUpperCase(),
        user_id: userId,
      });
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
      const itemIdExists = await Item.exists({
        item_id: numericId,
        user_id: userId,
      });
      if (itemIdExists) {
        throw ApiError.conflict(
          `Item ID '${numericId}' is already in use by another item`,
        );
      }
      finalItemId = numericId;
    } else {
      finalItemId = await generateUniqueItemId(userId);
    }

    const parsedPurchaseRate = toNumberIfDefined(
      purchase_rate,
      "Purchase rate",
    );
    const parsedMrpRate = toNumberIfDefined(mrp_rate, "MRP rate");
    const parsedGstPercent = toNumberIfDefined(gst_percent, "GST percent", {
      min: 0,
      max: 100,
    });
    const parsedDiscount = toNumberIfDefined(discount, "Discount", {
      min: 0,
      max: 100,
    });

    const finalPhysicalStock =
      physical_stock !== undefined ? toNumber(physical_stock, "Physical stock")
      : stock !== undefined ? toNumber(stock, "Stock")
      : 0;

    const finalLogicalStock =
      logical_stock !== undefined ?
        toNumber(logical_stock, "Logical stock", { allowNegative: true })
      : 0;

    const parsedThreshold = toNumberIfDefined(threshold, "Threshold");

    const escapedName = item_name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await Item.findOne({
      item_name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.conflict("Item with this name already exists");
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

    if (hsn_id !== undefined && hsn_id !== null && hsn_id !== "") {
      const hsnExists = await Hsn.exists({
        _id: hsn_id,
        user_id: userId,
      });
      if (!hsnExists) {
        throw ApiError.badRequest("HSN not found. Please select a valid HSN.");
      }
    }

    let normalizedAlias;
    if (alias !== undefined) {
      if (alias !== null && typeof alias !== "string") {
        throw ApiError.badRequest("Alias must be a string");
      }
      normalizedAlias = alias?.trim() || undefined;
    }

    let normalizedDescription;
    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        throw ApiError.badRequest("Description must be a string");
      }
      normalizedDescription = description?.trim() || undefined;
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
      ...(normalizedAlias !== undefined ? { alias: normalizedAlias } : {}),
      ...(normalizedDescription !== undefined ?
        { description: normalizedDescription }
      : {}),
      sale_rate: parsedSaleRate,
      purchase_rate: parsedPurchaseRate,
      mrp_rate: parsedMrpRate,
      gst_percent: parsedGstPercent,
      discount: parsedDiscount,
      stock: finalPhysicalStock,
      physical_stock: finalPhysicalStock,
      logical_stock: finalLogicalStock,
      threshold: parsedThreshold,
      is_gst,
      brand_id,
      contact_id,
      dept_id,
      ...(hsn_id !== undefined && hsn_id !== null && hsn_id !== "" ?
        { hsn_id }
      : {}),
      image: imageUrl,
      user_id: userId,
    });

    if (brand_id) {
      await Brand.findByIdAndUpdate(brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }

    await item.populate(ITEM_POPULATE);
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
      alias,
      description,
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
      brand_id,
      contact_id,
      dept_id,
      hsn_id,
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
        user_id: userId,
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
        user_id: userId,
        _id: { $ne: itemId },
      });
      if (itemIdExists) {
        throw ApiError.conflict(
          `Item ID '${numericId}' is already in use by another item`,
        );
      }
    }
    const parsedSaleRate = toNumberIfDefined(sale_rate, "Sale rate");
    const parsedPurchaseRate = toNumberIfDefined(
      purchase_rate,
      "Purchase rate",
    );
    const parsedMrpRate = toNumberIfDefined(mrp_rate, "MRP rate");
    const parsedGstPercent = toNumberIfDefined(gst_percent, "GST percent", {
      min: 0,
      max: 100,
    });
    const parsedDiscount = toNumberIfDefined(discount, "Discount", {
      min: 0,
      max: 100,
    });

    const parsedThreshold = toNumberIfDefined(threshold, "Threshold");

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

    const normalizedHsnId = hsn_id === "" || hsn_id === null ? null : hsn_id;
    if (hsn_id !== undefined && normalizedHsnId !== null) {
      const hsnExists = await Hsn.exists({
        _id: normalizedHsnId,
        user_id: userId,
      });
      if (!hsnExists) {
        throw ApiError.badRequest("HSN not found. Please select a valid HSN.");
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
    if (sale_rate !== undefined) fields.sale_rate = parsedSaleRate;
    if (purchase_rate !== undefined) fields.purchase_rate = parsedPurchaseRate;
    if (mrp_rate !== undefined) fields.mrp_rate = parsedMrpRate;
    if (gst_percent !== undefined) fields.gst_percent = parsedGstPercent;
    if (discount !== undefined) fields.discount = parsedDiscount;

    if (physical_stock !== undefined) {
      fields.physical_stock = toNumber(physical_stock, "Physical stock");
      fields.stock = fields.physical_stock;
    }

    if (logical_stock !== undefined) {
      fields.logical_stock = toNumber(logical_stock, "Logical stock", {
        allowNegative: true,
      });
    }

    if (stock !== undefined) {
      const numericStock = toNumber(stock, "Stock");
      fields.physical_stock = numericStock;
      fields.stock = numericStock;
    }

    if (threshold !== undefined) fields.threshold = parsedThreshold;
    if (is_gst !== undefined) fields.is_gst = is_gst;
    if (brand_id !== undefined) fields.brand_id = brand_id;
    if (contact_id !== undefined) fields.contact_id = contact_id;
    if (dept_id !== undefined) fields.dept_id = dept_id;
    if (hsn_id !== undefined) fields.hsn_id = normalizedHsnId;

    if (alias !== undefined) {
      if (alias !== null && typeof alias !== "string") {
        throw ApiError.badRequest("Alias must be a string");
      }
      fields.alias = alias === null ? null : alias.trim() || null;
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        throw ApiError.badRequest("Description must be a string");
      }
      fields.description =
        description === null ? null : description.trim() || null;
    }

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
    })
      .populate(ITEM_POPULATE)
      .lean();

    return this._normalizeStockForResponse(updatedItem, isGst);
  }

  async deleteItem(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    const challanCount = await Challan.countDocuments({
      "items.item_id": itemId,
      user_id: userId,
    });
    if (challanCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete item used in ${challanCount} challan(s). Remove all related challans/bills first.`,
      );
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
      const physical = toNumber(stockData.physical_stock, "Physical stock");
      item.physical_stock = physical;
      item.stock = physical;
    }

    if (stockData.logical_stock !== undefined) {
      item.logical_stock = toNumber(stockData.logical_stock, "Logical stock", {
        allowNegative: true,
      });
    }

    if (stockData.stock !== undefined) {
      const numericStock = toNumber(stockData.stock, "Stock");
      if (isGst === 0) {
        const physical =
          typeof item.physical_stock === "number" ?
            item.physical_stock
          : item.stock || 0;
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
      baseMatch.$or = [
        { item_name: { $regex: escaped, $options: "i" } },
        { alias: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
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
        {
          $addFields: { visible_stock: { $add: ["$_physical", "$_logical"] } },
        },
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
      filter.$or = [
        { item_name: { $regex: escaped, $options: "i" } },
        { alias: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
      ];
    }

    const result = await Pagination.paginate(Item, filter, {
      ...query,
      sort: { physical_stock: 1, createdAt: -1 },
    });

    result.data = result.data.map((item) =>
      this._normalizeStockForResponse(item, isGst),
    );
    return result;
  }

  async checkBarcodeUnique(barcode) {
    if (!barcode || typeof barcode !== "string" || !barcode.trim()) {
      throw ApiError.badRequest("barcode is required");
    }
    const trimmed = barcode.trim().toUpperCase();
    const exists = await Item.exists({ barcode: trimmed });
    return { barcode: trimmed, is_unique: !exists };
  }
}

export default new ItemService();
