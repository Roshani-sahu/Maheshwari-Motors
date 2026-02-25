import Category from "../../models/master/category.model.js";
import Brand from "../../models/master/brand.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class CategoryService {
  _escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  _sanitizeDiscountField(value, label) {
    if (value === undefined || value === null) {
      return { normal: 0, special: 0 };
    }

    if (typeof value !== "object" || Array.isArray(value)) {
      throw ApiError.badRequest(`${label} must be an object`);
    }

    const normal = value.normal === undefined ? 0 : Number(value.normal);
    const special = value.special === undefined ? 0 : Number(value.special);

    if (!Number.isFinite(normal) || normal < 0 || normal > 100) {
      throw ApiError.badRequest(`${label}.normal must be between 0 and 100`);
    }

    if (!Number.isFinite(special) || special < 0 || special > 100) {
      throw ApiError.badRequest(`${label}.special must be between 0 and 100`);
    }

    return { normal, special };
  }

  async _sanitizeLabels(labels, userId, allowedBrandIds = null) {
    if (labels === undefined) return undefined;

    if (!Array.isArray(labels)) {
      throw ApiError.badRequest("labels must be an array");
    }

    const seenLabelNames = new Set();
    const normalized = labels.map((label, index) => {
      if (!label || typeof label !== "object" || Array.isArray(label)) {
        throw ApiError.badRequest(`labels[${index}] must be an object`);
      }

      const name = typeof label.name === "string" ? label.name.trim() : "";
      if (!name) {
        throw ApiError.badRequest(`labels[${index}].name is required`);
      }

      const lower = name.toLowerCase();
      if (seenLabelNames.has(lower)) {
        throw ApiError.badRequest(`Duplicate label name '${name}'`);
      }
      seenLabelNames.add(lower);

      const rawBrandDiscounts =
        Array.isArray(label.brand_discounts) ? label.brand_discounts
        : Array.isArray(label.brands) ? label.brands
        : [];

      const brandSeen = new Set();
      const brandDiscounts = rawBrandDiscounts.map((entry, entryIndex) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          throw ApiError.badRequest(
            `labels[${index}].brand_discounts[${entryIndex}] must be an object`,
          );
        }

        if (!entry.brand_id) {
          throw ApiError.badRequest(
            `labels[${index}].brand_discounts[${entryIndex}].brand_id is required`,
          );
        }

        const brandIdString = String(entry.brand_id);
        if (brandSeen.has(brandIdString)) {
          throw ApiError.badRequest(
            `Duplicate brand_id '${brandIdString}' in label '${name}'`,
          );
        }
        brandSeen.add(brandIdString);

        const disc1 = this._sanitizeDiscountField(
          entry.disc1 ?? entry.discount1,
          `labels[${index}].brand_discounts[${entryIndex}].disc1`,
        );

        const disc2 = this._sanitizeDiscountField(
          entry.disc2 ?? entry.discount2,
          `labels[${index}].brand_discounts[${entryIndex}].disc2`,
        );

        return {
          brand_id: entry.brand_id,
          item_ids: Array.isArray(entry.item_ids) ? entry.item_ids : [],
          disc1,
          disc2,
        };
      });

      return {
        ...(label._id ? { _id: label._id } : {}),
        name,
        description:
          typeof label.description === "string" ? label.description.trim() : "",
        is_active:
          label.is_active === undefined ? true : Boolean(label.is_active),
        brand_discounts: brandDiscounts,
      };
    });

    const allBrandIds = [
      ...new Set(
        normalized.flatMap((label) =>
          label.brand_discounts.map((entry) => String(entry.brand_id)),
        ),
      ),
    ];

    if (allBrandIds.length > 0) {
      const validBrandCount = await Brand.countDocuments({
        _id: { $in: allBrandIds },
        user_id: userId,
      });

      if (validBrandCount !== allBrandIds.length) {
        throw ApiError.badRequest(
          "One or more brands in labels are invalid or do not belong to you",
        );
      }
    }

    if (allowedBrandIds && allowedBrandIds.length > 0) {
      const allowedSet = new Set(allowedBrandIds.map(String));
      const invalid = allBrandIds.filter((id) => !allowedSet.has(id));
      if (invalid.length > 0) {
        throw ApiError.badRequest(
          "All label brands must belong to category brand_ids",
        );
      }
    }

    if (normalized.length > 1) {
      const canonical = [
        ...new Set(
          normalized[0].brand_discounts.map((entry) => String(entry.brand_id)),
        ),
      ].sort();

      for (let i = 1; i < normalized.length; i++) {
        const current = [
          ...new Set(
            normalized[i].brand_discounts.map((entry) =>
              String(entry.brand_id),
            ),
          ),
        ].sort();

        if (canonical.join("|") !== current.join("|")) {
          throw ApiError.badRequest(
            "All labels in a category must contain the same set of brands",
          );
        }
      }
    }

    return normalized;
  }

  _extractLabelBrandIds(labels = []) {
    return [
      ...new Set(
        labels.flatMap((label) =>
          (label.brand_discounts || []).map((entry) => String(entry.brand_id)),
        ),
      ),
    ];
  }

  async getCategories(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = this._escapeRegex(query.search);
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Category, filter, {
      ...query,
      populate: [
        { path: "brand_ids", select: "name" },
        { path: "labels.brand_discounts.brand_id", select: "name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getCategoryById(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    }).populate([
      { path: "brand_ids", select: "name" },
      { path: "labels.brand_discounts.brand_id", select: "name" },
    ]);
    if (!category) throw ApiError.notFound("Category not found");
    return category;
  }

  async createCategory(categoryData, userId) {
    const { name, description, brand_ids, labels } = categoryData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Category name is required");
    }

    const escapedName = this._escapeRegex(name.trim());
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (existingCategory) {
      throw ApiError.conflict("Category with this name already exists");
    }

    let normalizedBrandIds = Array.isArray(brand_ids) ? brand_ids : [];

    if (normalizedBrandIds.length > 0) {
      const validBrandCount = await Brand.countDocuments({
        _id: { $in: normalizedBrandIds },
        user_id: userId,
      });
      if (validBrandCount !== normalizedBrandIds.length) {
        throw ApiError.badRequest(
          "One or more selected brands are invalid or do not belong to you",
        );
      }
    }

    const normalizedLabels =
      (await this._sanitizeLabels(labels, userId, normalizedBrandIds)) || [];

    if (normalizedBrandIds.length === 0 && normalizedLabels.length > 0) {
      normalizedBrandIds = this._extractLabelBrandIds(normalizedLabels);
    }

    const category = await Category.create({
      id: await getNextId("Category", userId),
      name: name.trim(),
      description,
      brand_ids: normalizedBrandIds,
      labels: normalizedLabels,
      user_id: userId,
    });
    return category;
  }

  async updateCategory(categoryId, userId, updateData) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) throw ApiError.notFound("Category not found");

    const { name, description, brand_ids, labels } = updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Category name cannot be empty");
      }
      const escapedName = this._escapeRegex(name.trim());
      const duplicate = await Category.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: categoryId },
      });
      if (duplicate) {
        throw ApiError.conflict(
          "Another category with this name already exists",
        );
      }
    }

    let normalizedBrandIds;
    if (brand_ids !== undefined) {
      normalizedBrandIds = Array.isArray(brand_ids) ? brand_ids : [];

      if (normalizedBrandIds.length > 0) {
        const validBrandCount = await Brand.countDocuments({
          _id: { $in: normalizedBrandIds },
          user_id: userId,
        });
        if (validBrandCount !== normalizedBrandIds.length) {
          throw ApiError.badRequest(
            "One or more selected brands are invalid or do not belong to you",
          );
        }
      }
    }

    const effectiveBrandIds =
      normalizedBrandIds !== undefined ? normalizedBrandIds : (
        category.brand_ids
      );

    const normalizedLabels = await this._sanitizeLabels(
      labels,
      userId,
      effectiveBrandIds,
    );

    if (labels === undefined && normalizedBrandIds !== undefined) {
      const currentLabelBrandIds = this._extractLabelBrandIds(
        category.labels || [],
      );
      if (currentLabelBrandIds.length > 0) {
        const allowedSet = new Set(effectiveBrandIds.map(String));
        const invalid = currentLabelBrandIds.filter(
          (id) => !allowedSet.has(id),
        );
        if (invalid.length > 0) {
          throw ApiError.badRequest(
            "Cannot remove brands that are used in existing labels. Update labels first.",
          );
        }
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (description !== undefined) fields.description = description;
    if (normalizedBrandIds !== undefined) fields.brand_ids = normalizedBrandIds;
    if (normalizedLabels !== undefined) fields.labels = normalizedLabels;

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      fields,
      { new: true },
    );
    return updatedCategory;
  }

  async deleteCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) throw ApiError.notFound("Category not found");

    await Category.findByIdAndDelete(categoryId);
  }
}

export default new CategoryService();
