import { categoryService } from "../../services/index.js";
import { asyncHandler, ApiResponse, ApiError } from "../../utils/index.js";

class CategoryController {
  getCategories = asyncHandler(async (req, res) => {
    const result = await categoryService.getCategories(req.user._id, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Categories fetched successfully"));
  });

  getCategoryById = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryById(
      req.params.categoryId,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, category, "Category fetched successfully"));
  });

  createCategory = asyncHandler(async (req, res) => {
    const data = req.body;
    const resolvedName = data.category_name ?? data.name;
    if (!resolvedName) {
      throw ApiError.badRequest("Category name is required");
    }

    const category = await categoryService.createCategory(
      {
        name: resolvedName,
        description: data.description,
        brand_ids: data.brands,
        labels: data.labels,
      },
      req.user._id,
    );
    res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  });

  updateCategory = asyncHandler(async (req, res) => {
    const data = req.body;
    const updateData = {};
    if (data.category_name !== undefined) updateData.name = data.category_name;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.brands !== undefined) updateData.brand_ids = data.brands;
    if (data.labels !== undefined) updateData.labels = data.labels;

    const category = await categoryService.updateCategory(
      req.params.categoryId,
      req.user._id,
      updateData,
    );
    res
      .status(200)
      .json(new ApiResponse(200, category, "Category updated successfully"));
  });

  deleteCategory = asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.categoryId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Category deleted successfully"));
  });
}

const categoryController = new CategoryController();

export const getCategories = categoryController.getCategories;
export const getCategoryById = categoryController.getCategoryById;
export const createCategory = categoryController.createCategory;
export const updateCategory = categoryController.updateCategory;
export const deleteCategory = categoryController.deleteCategory;

export default categoryController;
