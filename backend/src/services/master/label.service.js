import mongoose from "mongoose";
import Label from "../../models/master/label.model.js";
import Brand from "../../models/master/brand.model.js";
import Contact from "../../models/master/contact.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

const LABEL_POPULATE = [
  { path: "brand_discounts.brand_id", select: "name" },
  { path: "brand_discounts.item_discounts.item_id", select: "item_name" },
];

class LabelService {
  _escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  _sanitizeDiscountField(value, path) {
    if (value === undefined || value === null) {
      return { normal: 0, special: 0 };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw ApiError.badRequest(`${path} must be an object`);
    }

    const normal = value.normal === undefined ? 0 : Number(value.normal);
    const special = value.special === undefined ? 0 : Number(value.special);

    if (!Number.isFinite(normal) || normal < 0 || normal > 100) {
      throw ApiError.badRequest(`${path}.normal must be between 0 and 100`);
    }

    if (!Number.isFinite(special) || special < 0 || special > 100) {
      throw ApiError.badRequest(`${path}.special must be between 0 and 100`);
    }

    return { normal, special };
  }

  async _sanitizeBrandDiscounts(brandDiscounts, userId) {
    if (!Array.isArray(brandDiscounts)) {
      throw ApiError.badRequest("brand_discounts must be an array");
    }

    const brandSeen = new Set();
    const normalized = [];

    for (let index = 0; index < brandDiscounts.length; index++) {
      const entry = brandDiscounts[index];
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw ApiError.badRequest(
          `brand_discounts[${index}] must be an object`,
        );
      }

      if (!entry.brand_id) {
        throw ApiError.badRequest(
          `brand_discounts[${index}].brand_id is required`,
        );
      }

      const brandIdStr = String(entry.brand_id);
      if (brandSeen.has(brandIdStr)) {
        throw ApiError.badRequest(
          `Duplicate brand_id '${brandIdStr}' in brand_discounts`,
        );
      }
      brandSeen.add(brandIdStr);

      const disc1 = this._sanitizeDiscountField(
        entry.disc1 ?? entry.discount1,
        `brand_discounts[${index}].disc1`,
      );

      const disc2 = this._sanitizeDiscountField(
        entry.disc2 ?? entry.discount2,
        `brand_discounts[${index}].disc2`,
      );

      const itemDiscounts = await this._sanitizeItemDiscounts(
        entry.item_discounts || [],
        brandIdStr,
        userId,
        index,
      );

      normalized.push({
        brand_id: entry.brand_id,
        disc1,
        disc2,
        item_discounts: itemDiscounts,
      });
    }

    const allBrandIds = [...new Set(normalized.map((e) => String(e.brand_id)))];

    if (allBrandIds.length > 0) {
      const validCount = await Brand.countDocuments({
        _id: { $in: allBrandIds },
        user_id: userId,
      });
      if (validCount !== allBrandIds.length) {
        throw ApiError.badRequest(
          "One or more brands in brand_discounts are invalid or do not belong to you",
        );
      }
    }

    return normalized;
  }

  async _sanitizeItemDiscounts(itemDiscounts, brandIdStr, userId, brandIndex) {
    if (!Array.isArray(itemDiscounts)) {
      throw ApiError.badRequest(
        `brand_discounts[${brandIndex}].item_discounts must be an array`,
      );
    }

    if (itemDiscounts.length === 0) return [];

    const itemSeen = new Set();
    const normalized = itemDiscounts.map((entry, i) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw ApiError.badRequest(
          `brand_discounts[${brandIndex}].item_discounts[${i}] must be an object`,
        );
      }

      if (!entry.item_id) {
        throw ApiError.badRequest(
          `brand_discounts[${brandIndex}].item_discounts[${i}].item_id is required`,
        );
      }

      const itemIdStr = String(entry.item_id);
      if (itemSeen.has(itemIdStr)) {
        throw ApiError.badRequest(
          `Duplicate item_id '${itemIdStr}' in brand_discounts[${brandIndex}].item_discounts`,
        );
      }
      itemSeen.add(itemIdStr);

      const discount =
        entry.discount === undefined ? 0 : Number(entry.discount);
      if (!Number.isFinite(discount) || discount < 0) {
        throw ApiError.badRequest(
          `brand_discounts[${brandIndex}].item_discounts[${i}].discount must be a non-negative number`,
        );
      }

      return { item_id: entry.item_id, discount };
    });

    // Validate all item_ids belong to this brand via Brand.item_ids
    const brand = await Brand.findOne({
      _id: brandIdStr,
      user_id: userId,
    }).select("item_ids");

    if (!brand) {
      throw ApiError.badRequest(
        `Brand in brand_discounts[${brandIndex}] not found`,
      );
    }

    const brandItemIdSet = new Set((brand.item_ids || []).map(String));
    for (const item of normalized) {
      if (!brandItemIdSet.has(String(item.item_id))) {
        throw ApiError.badRequest(
          `Item '${item.item_id}' does not belong to brand '${brandIdStr}'`,
        );
      }
    }

    return normalized;
  }

  async getLabels(userId, query) {
    const filter = { user_id: userId };

    if (query.search) {
      const escaped = this._escapeRegex(query.search);
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Label, filter, {
      ...query,
      select: "-brand_discounts",
      sort: { createdAt: -1 },
    });
  }

  async getLabelsDetailed(userId, query) {
    const filter = { user_id: userId };

    if (query.search) {
      const escaped = this._escapeRegex(query.search);
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Label, filter, {
      ...query,
      populate: LABEL_POPULATE,
      sort: { createdAt: -1 },
    });
  }

  async getLabelById(labelId, userId) {
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw ApiError.badRequest("Invalid label ID");
    }

    const label = await Label.findOne({
      _id: labelId,
      user_id: userId,
    }).populate(LABEL_POPULATE);

    if (!label) throw ApiError.notFound("Label not found");
    return label;
  }

  async createLabel(labelData, userId) {
    const { name, description, is_active, brand_discounts } = labelData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Label name is required");
    }

    const escapedName = this._escapeRegex(name.trim());
    const duplicate = await Label.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.badRequest("A label with this name already exists");
    }

    const normalizedBrandDiscounts = await this._sanitizeBrandDiscounts(
      brand_discounts || [],
      userId,
    );

    const label = await Label.create({
      id: await getNextId("Label", userId),
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      is_active: is_active === undefined ? true : Boolean(is_active),
      brand_discounts: normalizedBrandDiscounts,
      user_id: userId,
    });

    return label.populate(LABEL_POPULATE);
  }

  async updateLabel(labelId, userId, updateData) {
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw ApiError.badRequest("Invalid label ID");
    }

    const label = await Label.findOne({ _id: labelId, user_id: userId });
    if (!label) throw ApiError.notFound("Label not found");

    const { name, description, is_active, brand_discounts } = updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Label name cannot be empty");
      }
      const escapedName = this._escapeRegex(name.trim());
      const duplicate = await Label.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: labelId },
      });
      if (duplicate) {
        throw ApiError.badRequest(
          "Another label with this name already exists",
        );
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (description !== undefined) {
      fields.description =
        typeof description === "string" ? description.trim() : "";
    }
    if (is_active !== undefined) fields.is_active = Boolean(is_active);

    if (brand_discounts !== undefined) {
      fields.brand_discounts = await this._sanitizeBrandDiscounts(
        brand_discounts,
        userId,
      );
    }

    const updatedLabel = await Label.findByIdAndUpdate(labelId, fields, {
      new: true,
    }).populate(LABEL_POPULATE);

    return updatedLabel;
  }

  async deleteLabel(labelId, userId) {
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw ApiError.badRequest("Invalid label ID");
    }

    const label = await Label.findOne({ _id: labelId, user_id: userId });
    if (!label) throw ApiError.notFound("Label not found");

    const contactCount = await Contact.countDocuments({
      label_ids: labelId,
      user_id: userId,
    });
    if (contactCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete label assigned to ${contactCount} contact(s). Remove label assignment from contacts first.`,
      );
    }

    await Label.findByIdAndDelete(labelId);
  }
}

export default new LabelService();
