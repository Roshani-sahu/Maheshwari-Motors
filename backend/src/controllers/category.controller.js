import { categoryService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const categorySchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "Category name",
  },
  description: {
    required: false,
    type: "string",
    max: 500,
    label: "Description",
  },
};

export const getCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.getCategories(req.ownerId, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Categories fetched successfully"));
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(
    req.params.categoryId,
    req.ownerId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

export const createCategory = asyncHandler(async (req, res) => {
  const data = validate(req.body, categorySchema);
  const category = await categoryService.createCategory(data, req.ownerId);
  res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const data = validate(req.body, categorySchema, { allowPartial: true });
  const category = await categoryService.updateCategory(
    req.params.categoryId,
    req.ownerId,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, category, "Category updated successfully"));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.categoryId, req.ownerId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});
