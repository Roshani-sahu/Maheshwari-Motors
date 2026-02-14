import Category from "../../models/master/category.model.js";
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
      populate: [{ path: "brand_ids", select: "name item_ids" }],
      sort: { createdAt: -1 },
    });
  }

  async getCategoryById(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    }).populate("brand_ids", "name item_ids");
    if (!category) throw ApiError.notFound("Category not found");
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
      name: categoryData.name,
      brand_ids: categoryData.brand_ids || [],
      id: await getNextId("Category", userId),
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
    if (!category) throw ApiError.notFound("Category not found");

    await Category.findByIdAndDelete(categoryId);
  }
}

export default new CategoryService();
