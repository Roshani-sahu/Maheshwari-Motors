import Category from "../../models/master/category.model.js";
import Brand from "../../models/master/brand.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class CategoryService {
  async getCategories(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Category, filter, {
      ...query,
      populate: [{ path: "brand_ids", select: "name" }],
      sort: { createdAt: -1 },
    });
  }

  async getCategoryById(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    }).populate("brand_ids", "name");
    if (!category) throw ApiError.notFound("Category not found");
    return category;
  }

  async createCategory(categoryData, userId) {
    const { name, description, brand_ids } = categoryData;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Category name is required");
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (existingCategory) {
      throw ApiError.conflict("Category with this name already exists");
    }

    if (brand_ids && brand_ids.length > 0) {
      const validBrandCount = await Brand.countDocuments({
        _id: { $in: brand_ids },
        user_id: userId,
      });
      if (validBrandCount !== brand_ids.length) {
        throw ApiError.badRequest(
          "One or more selected brands are invalid or do not belong to you",
        );
      }
    }

    const category = await Category.create({
      id: await getNextId("Category", userId),
      name: name.trim(),
      description,
      brand_ids: brand_ids || [],
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

    const { name, description, brand_ids } = updateData;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Category name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    if (brand_ids !== undefined && brand_ids.length > 0) {
      const validBrandCount = await Brand.countDocuments({
        _id: { $in: brand_ids },
        user_id: userId,
      });
      if (validBrandCount !== brand_ids.length) {
        throw ApiError.badRequest(
          "One or more selected brands are invalid or do not belong to you",
        );
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (description !== undefined) fields.description = description;
    if (brand_ids !== undefined) fields.brand_ids = brand_ids;

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
