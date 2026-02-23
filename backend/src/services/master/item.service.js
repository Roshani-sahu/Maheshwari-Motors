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
      barcode,
      item_id,
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
      const barcodeExists = await Item.exists({ barcode });
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
    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      throw ApiError.badRequest("Stock must be a non-negative number");
    }
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
      stock,
      threshold,
      is_gst,
      category_id,
      brand_id,
      contact_id,
      dept_id,
      image: imageUrl,
      user_id: userId,
    });

    // Sync: add item to brand's item_ids
    if (brand_id) {
      await Brand.findByIdAndUpdate(brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }

    return item;
  }

  async updateItem(itemId, userId, updateData, file = null) {
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
    if (stock !== undefined && (typeof stock !== "number" || stock < 0)) {
      throw ApiError.badRequest("Stock must be a non-negative number");
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
    if (barcode !== undefined && barcode !== null && barcode !== "")
      fields.barcode = barcode.toUpperCase();
    if (item_id !== undefined && item_id !== null && item_id !== "")
      fields.item_id = Number(item_id);
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
    if (contact_id !== undefined) fields.contact_id = contact_id;
    if (dept_id !== undefined) fields.dept_id = dept_id;

    // Sync brand item_ids when brand_id changes
    if (brand_id !== undefined) {
      const oldBrandId = item.brand_id ? String(item.brand_id) : null;
      const newBrandId = brand_id ? String(brand_id) : null;

      if (oldBrandId !== newBrandId) {
        // Remove item from old brand's item_ids
        if (oldBrandId) {
          await Brand.findByIdAndUpdate(oldBrandId, {
            $pull: { item_ids: item._id },
          });
        }
        // Add item to new brand's item_ids
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
    });
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

    // Remove item from brand's item_ids
    if (item.brand_id) {
      await Brand.findByIdAndUpdate(item.brand_id, {
        $pull: { item_ids: item._id },
      });
    }

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
    return item;
  }

  async getLowStockItems(userId, query = {}) {
    const filter = {
      user_id: userId,
      threshold: { $gt: 0 },
      $expr: { $lte: ["$stock", "$threshold"] },
    };

    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Item, filter, {
      ...query,
      sort: { stock: 1 },
    });
  }
}

export default new ItemService();
