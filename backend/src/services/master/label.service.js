import mongoose from "mongoose";
import Label from "../../models/master/label.model.js";
import Category from "../../models/master/category.model.js";
import Brand from "../../models/master/brand.model.js";
import Contact from "../../models/master/contact.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

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

  async _sanitizeBrandDiscounts(brandDiscounts, userId, categoryBrandIds) {
    if (!Array.isArray(brandDiscounts)) {
      throw ApiError.badRequest("brand_discounts must be an array");
    }

    const brandSeen = new Set();
    const normalized = brandDiscounts.map((entry, index) => {
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

      return { brand_id: entry.brand_id, disc1, disc2 };
    });

    // Validate all brand_ids exist and belong to user
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

    // Validate brands belong to category's brand_ids
    if (categoryBrandIds && categoryBrandIds.length > 0) {
      const allowedSet = new Set(categoryBrandIds.map(String));
      const invalid = allBrandIds.filter((id) => !allowedSet.has(id));
      if (invalid.length > 0) {
        throw ApiError.badRequest(
          "All brands in label must belong to the category's brand_ids",
        );
      }
    }

    return normalized;
  }

  async _validateCategoryOwnership(categoryId, userId) {
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      throw ApiError.badRequest("Invalid category_id");
    }

    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) {
      throw ApiError.badRequest(
        "Category not found. Please select a valid category.",
      );
    }
    return category;
  }

  // ------------------------------------------------------------------
  //  CRUD
  // ------------------------------------------------------------------

  async getLabels(userId, query) {
    const filter = { user_id: userId };

    if (query.category_id) {
      filter.category_id = query.category_id;
    }

    if (query.search) {
      const escaped = this._escapeRegex(query.search);
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Label, filter, {
      ...query,
      populate: [
        { path: "category_id", select: "name" },
        { path: "brand_discounts.brand_id", select: "name" },
      ],
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
    }).populate([
      { path: "category_id", select: "name" },
      { path: "brand_discounts.brand_id", select: "name" },
    ]);

    if (!label) throw ApiError.notFound("Label not found");
    return label;
  }

  async getLabelsByCategory(categoryId, userId) {
    await this._validateCategoryOwnership(categoryId, userId);

    const labels = await Label.find({
      category_id: categoryId,
      user_id: userId,
    }).populate([{ path: "brand_discounts.brand_id", select: "name" }]);

    return labels;
  }

  async createLabel(labelData, userId) {
    const { name, description, is_active, category_id, brand_discounts } =
      labelData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Label name is required");
    }

    if (!category_id) {
      throw ApiError.badRequest("category_id is required");
    }

    const category = await this._validateCategoryOwnership(category_id, userId);

    // Check duplicate name within same category
    const escapedName = this._escapeRegex(name.trim());
    const duplicate = await Label.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      category_id,
      user_id: userId,
    });
    if (duplicate) {
      throw ApiError.badRequest(
        "A label with this name already exists in this category",
      );
    }

    const normalizedBrandDiscounts = await this._sanitizeBrandDiscounts(
      brand_discounts || [],
      userId,
      category.brand_ids,
    );

    const label = await Label.create({
      id: await getNextId("Label", userId),
      name: name.trim(),
      description: typeof description === "string" ? description.trim() : "",
      is_active: is_active === undefined ? true : Boolean(is_active),
      category_id,
      brand_discounts: normalizedBrandDiscounts,
      user_id: userId,
    });

    // Push label _id into category.label_ids
    await Category.findByIdAndUpdate(category_id, {
      $addToSet: { label_ids: label._id },
    });

    return label.populate([
      { path: "category_id", select: "name" },
      { path: "brand_discounts.brand_id", select: "name" },
    ]);
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
        category_id: label.category_id,
        user_id: userId,
        _id: { $ne: labelId },
      });
      if (duplicate) {
        throw ApiError.badRequest(
          "Another label with this name already exists in this category",
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
      const category = await Category.findById(label.category_id);
      fields.brand_discounts = await this._sanitizeBrandDiscounts(
        brand_discounts,
        userId,
        category ? category.brand_ids : [],
      );
    }

    const updatedLabel = await Label.findByIdAndUpdate(labelId, fields, {
      new: true,
    }).populate([
      { path: "category_id", select: "name" },
      { path: "brand_discounts.brand_id", select: "name" },
    ]);

    return updatedLabel;
  }

  async deleteLabel(labelId, userId) {
    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw ApiError.badRequest("Invalid label ID");
    }

    const label = await Label.findOne({ _id: labelId, user_id: userId });
    if (!label) throw ApiError.notFound("Label not found");

    // Check if any contacts reference this label
    const contactCount = await Contact.countDocuments({
      label_id: labelId,
      user_id: userId,
    });
    if (contactCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete label assigned to ${contactCount} contact(s). Remove label assignment from contacts first.`,
      );
    }

    // Remove from category.label_ids
    await Category.findByIdAndUpdate(label.category_id, {
      $pull: { label_ids: label._id },
    });

    await Label.findByIdAndDelete(labelId);
  }
}

export default new LabelService();
