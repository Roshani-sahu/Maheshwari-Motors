import { discountService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const discountFieldSchema = {
  normal: {
    required: false,
    type: "number",
    min: 0,
    max: 100,
    label: "Normal %",
  },
  special: {
    required: false,
    type: "number",
    min: 0,
    max: 100,
    label: "Special %",
  },
};

const discountSchema = {
  brand_id: {
    required: true,
    type: "objectId",
    label: "Brand ID",
  },
  discount1: {
    required: false,
    type: "object",
    fields: discountFieldSchema,
    label: "Discount 1",
  },
  discount2: {
    required: false,
    type: "object",
    fields: discountFieldSchema,
    label: "Discount 2",
  },
};

export const getDiscounts = asyncHandler(async (req, res) => {
  const result = await discountService.getDiscounts(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Discounts fetched successfully"));
});

export const getDiscountByBrand = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountByBrand(
    req.params.brandId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount fetched successfully"));
});

export const upsertDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema);
  const discount = await discountService.upsertDiscount(data, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount saved successfully"));
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.params.discountId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Discount deleted successfully"));
});
