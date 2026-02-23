import { categoryService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

export const getCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Categories fetched successfully"));
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(
    req.params.categoryId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = validate(req.body, categorySchema);
  const category = await categoryService.createCategory(
    {
      name: data.category_name,
      description: data.description,
      brand_ids: data.brands,
    },
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = validate(req.body, categorySchema, { allowPartial: true });
  const updateData = {};
  if (data.category_name !== undefined) updateData.name = data.category_name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.brands !== undefined) updateData.brand_ids = data.brands;
  const category = await categoryService.updateCategory(
    req.params.categoryId,
    req.user._id,
    updateData,
  );
  res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.categoryId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});
