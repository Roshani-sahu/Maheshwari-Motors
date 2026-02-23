import { brandService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const brandSchema = {
  brand_name: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "Brand name",
  },
  hsn_id: { required: false, type: "objectId", label: "HSN Code" },
  discount1: { required: false, type: "object", label: "Discount 1 (GST)" },
  discount2: {
    required: false,
    type: "object",
    label: "Discount 2 (Non-GST)",
  },
  item_ids: { required: false, type: "array", label: "Item IDs" },
};

const discountSchema = {
  discount1: { required: false, type: "object", label: "Discount 1 (GST)" },
  discount2: {
    required: false,
    type: "object",
    label: "Discount 2 (Non-GST)",
  },
};

export const getBrands = asyncHandler(async (req, res) => {
  const result = await brandService.getBrands(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Brands fetched successfully"));
});

export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(
    req.params.brandId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand fetched successfully"));
});

export const createBrand = asyncHandler(async (req, res) => {
  const data = validate(req.body, brandSchema);
  const brand = await brandService.createBrand(
    {
      name: data.brand_name,
      discount1: data.discount1,
      discount2: data.discount2,
      hsn_id: data.hsn_id,
      item_ids: data.item_ids,
    },
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, brand, "Brand created successfully"));
});

export const updateBrand = asyncHandler(async (req, res) => {
  const data = validate(req.body, brandSchema, { allowPartial: true });
  const updateData = {};
  if (data.brand_name) updateData.name = data.brand_name;
  if (data.discount1) updateData.discount1 = data.discount1;
  if (data.discount2) updateData.discount2 = data.discount2;
  if (data.hsn_id !== undefined) updateData.hsn_id = data.hsn_id;
  if (data.item_ids !== undefined) updateData.item_ids = data.item_ids;
  const brand = await brandService.updateBrand(
    req.params.brandId,
    req.user._id,
    updateData,
  );
  res
    .status(200)
    .json(new ApiResponse(200, brand, "Brand updated successfully"));
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.brandId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Brand deleted successfully"));
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema);
  const brand = await brandService.updateDiscount(
    req.params.brandId,
    req.user._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, brand, "Discount updated successfully"));
});

export const getDiscountsByCategory = asyncHandler(async (req, res) => {
  const result = await brandService.getDiscountsByCategory(
    req.params.categoryId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Discounts fetched successfully"));
});
