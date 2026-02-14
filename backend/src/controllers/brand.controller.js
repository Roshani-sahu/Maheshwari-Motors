import { brandService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const brandSchema = {
  brand_name: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "Brand name",
  },
  items: {
    required: false,
    type: "array",
    arrayType: "objectId",
    label: "Items",
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
    { name: data.brand_name, item_ids: data.items },
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
  if (data.items) updateData.item_ids = data.items;
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
