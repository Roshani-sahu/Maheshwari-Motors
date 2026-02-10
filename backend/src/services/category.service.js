import Category from "../models/category.model.js";
import Item from "../models/item.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class CategoryService {
  async getCategories(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Category, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getCategoryById(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) {
      throw ApiError.notFound("Category not found");
    }
    return category;
  }

  async createCategory(categoryData, userId) {
    const escapedName = categoryData.name.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });

    if (existingCategory) {
      throw ApiError.badRequest("Category with this name already exists");
    }

    const category = await Category.create({
      ...categoryData,
      user_id: userId,
    });
    return category;
  }

  async updateCategory(categoryId, userId, updateData) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true },
    );
    return updatedCategory;
  }

  async deleteCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    });
    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    // Pull this category from all items that reference it
    await Item.updateMany(
      { category_ids: categoryId, user_id: userId },
      { $pull: { category_ids: categoryId } },
    );

    await Category.findByIdAndDelete(categoryId);
  }
}

export default new CategoryService();
