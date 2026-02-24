import { categoryService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate, ApiError } from "../../utils/index.js";

const discountFieldSchema = {
  required: false,
  type: "object",
  fields: {
    normal: { required: false, type: "number", min: 0, max: 100, label: "Normal discount" },
    special: { required: false, type: "number", min: 0, max: 100, label: "Special discount" },
  },
};

const labelBrandSchema = {
  required: false,
  type: "array",
  items: {
    brand_id: { required: true, type: "objectId", label: "Brand" },
    item_ids: {
      required: false,
      type: "array",
      arrayType: "objectId",
      label: "Items",
    },
    disc1: discountFieldSchema,
    disc2: discountFieldSchema,
  },
};

const categorySchema = {
  category_name: { required: false, type: "string", min: 1, label: "Category name" },
  name: { required: false, type: "string", min: 1, label: "Category name" },
  description: { required: false, type: "string", label: "Description" },
  brands: {
    required: false,
    type: "array",
    arrayType: "objectId",
    label: "Brands",
  },
  labels: {
    required: false,
    type: "array",
    label: "Labels",
    items: {
      name: { required: true, type: "string", min: 1, label: "Label name" },
      description: { required: false, type: "string", label: "Label description" },
      is_active: { required: false, type: "boolean", label: "Label active" },
      brand_discounts: labelBrandSchema,
      brands: labelBrandSchema,
    },
  },
};

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
    const data = validate(req.body, categorySchema);
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
    const data = validate(req.body, categorySchema, { allowPartial: true });
    const updateData = {};
    if (data.category_name !== undefined) updateData.name = data.category_name;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
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
