import { discountService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const discountSchema = {
  type: {
    required: true,
    type: "string",
    enum: ["item", "party"],
    label: "Discount type",
  },
  discount_type: {
    required: false,
    type: "string",
    enum: ["percentage", "fixed"],
    label: "Discount calculation type",
  },
  value: { required: true, type: "number", min: 0, label: "Discount value" },
  item_id: { required: false, type: "objectId", label: "Item ID" },
  party_id: { required: false, type: "objectId", label: "Party ID" },
};

export const getDiscounts = asyncHandler(async (req, res) => {
  const result = await discountService.getDiscounts(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Discounts fetched successfully"));
});

export const getDiscountById = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountById(
    req.params.discountId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount fetched successfully"));
});

export const createDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema);
  const discount = await discountService.createDiscount(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, discount, "Discount created successfully"));
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema, { allowPartial: true });
  const discount = await discountService.updateDiscount(
    req.params.discountId,
    req.user._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount updated successfully"));
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.params.discountId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Discount deleted successfully"));
});

export const getItemDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getItemDiscount(
    req.params.itemId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Item discount fetched successfully"));
});

export const getPartyDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getPartyDiscount(
    req.params.partyId,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, discount, "Party discount fetched successfully"),
    );
});
