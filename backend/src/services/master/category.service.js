import Category from "../../models/master/category.model.js";
import Label from "../../models/master/label.model.js";
import Brand from "../../models/master/brand.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class CategoryService {
  _escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        { path: "label_ids", select: "name is_active" },
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
      {
        path: "label_ids",
        populate: { path: "brand_discounts.brand_id", select: "name" },
      },
    ]);
    if (!category) throw ApiError.notFound("Category not found");
    return category;
  }

  async createCategory(categoryData, userId) {
    const { name, description, brand_ids } = categoryData;

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

    const normalizedBrandIds = Array.isArray(brand_ids) ? brand_ids : [];

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

    const category = await Category.create({
      id: await getNextId("Category", userId),
      name: name.trim(),
      description,
      brand_ids: normalizedBrandIds,
      label_ids: [],
      user_id: userId,
    });

    return category.populate([
      { path: "brand_ids", select: "name" },
      { path: "label_ids", select: "name is_active" },
    ]);
  }

  async updateCategory(categoryId, userId, updateData) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) throw ApiError.notFound("Category not found");

    const { name, description, brand_ids } = updateData;

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

      // Check if removing brands that are used in existing labels
      const existingLabels = await Label.find({
        category_id: categoryId,
        user_id: userId,
      });

      if (existingLabels.length > 0) {
        const allowedSet = new Set(normalizedBrandIds.map(String));
        const usedBrandIds = [
          ...new Set(
            existingLabels.flatMap((l) =>
              (l.brand_discounts || []).map((bd) => String(bd.brand_id)),
            ),
          ),
        ];
        const invalid = usedBrandIds.filter((id) => !allowedSet.has(id));
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

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      fields,
      { new: true },
    ).populate([
      { path: "brand_ids", select: "name" },
      {
        path: "label_ids",
        populate: { path: "brand_discounts.brand_id", select: "name" },
      },
    ]);
    return updatedCategory;
  }

  async deleteCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) throw ApiError.notFound("Category not found");

    // Delete all labels belonging to this category
    await Label.deleteMany({ category_id: categoryId, user_id: userId });

    // Clear label_id from any contacts referencing labels of this category
    const labelIds = category.label_ids || [];
    if (labelIds.length > 0) {
      await import("../../models/master/contact.model.js").then(
        ({ default: Contact }) =>
          Contact.updateMany(
            { label_id: { $in: labelIds }, user_id: userId },
            { $set: { label_id: null, assigned_label: null } },
          ),
      );
    }

    await Category.findByIdAndDelete(categoryId);
  }
}

export default new CategoryService();
