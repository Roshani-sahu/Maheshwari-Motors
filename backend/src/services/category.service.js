import Category from "../models/category.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class CategoryService {
  async getCategories(userId, query) {
    const filter = { user_id: userId };
    if (query.search) filter.name = { $regex: query.search, $options: "i" };

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
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryData.name}$`, "i") },
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

    await Category.findByIdAndDelete(categoryId);
  }
}

export default new CategoryService();
