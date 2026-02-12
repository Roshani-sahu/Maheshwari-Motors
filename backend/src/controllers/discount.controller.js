import { discountService } from "../services/index.js";
import {
  asyncHandler,
  ApiResponse,
  validate,
  ApiError,
} from "../utils/index.js";

const discountSchema = {
  type: {
    required: true,
    type: "string",
    enum: ["item", "party_item", "party_all", "item_group", "profit_margin"],
    label: "Discount type",
  },
  percent1: { required: false, type: "number", min: 0, label: "Percent 1" },
  percent2: { required: false, type: "number", min: 0, label: "Percent 2" },
  fixed_amount: {
    required: false,
    type: "number",
    min: 0,
    label: "Fixed amount",
  },
  profit_percent: {
    required: false,
    type: "number",
    min: 0,
    label: "Profit percent",
  },
  item_id: { required: false, type: "objectId", label: "Item ID" },
  party_id: { required: false, type: "objectId", label: "Party ID" },
  item_ids: {
    required: false,
    type: "array",
    arrayType: "objectId",
    label: "Item IDs",
  },
  item_group_name: {
    required: false,
    type: "string",
    max: 100,
    label: "Item group name",
  },
  firm_id: { required: false, type: "objectId", label: "Firm ID" },
};

/**
 * Helper: derive firmId from request context
 * For firm login → req.firm._id (or query.firm_id)
 * For admin login → requires firm_id in query/body
 * For legacy user → req.user._id (backward compat, treating as firmId)
 */
function getFirmId(req) {
  if (req.role === "firm") {
    return req.query?.firm_id || req.body?.firm_id || req.firm._id;
  }
  if (req.role === "admin") {
    const fid = req.query?.firm_id || req.body?.firm_id;
    if (!fid) throw ApiError.badRequest("firm_id is required for admin");
    return fid;
  }
  // Legacy user — pass ownerId; discount service uses firm_id field
  return req.query?.firm_id || req.ownerId;
}

export const getDiscounts = asyncHandler(async (req, res) => {
  const result = await discountService.getDiscounts(getFirmId(req), req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Discounts fetched successfully"));
});

export const getDiscountById = asyncHandler(async (req, res) => {
  const discount = await discountService.getDiscountById(
    req.params.discountId,
    getFirmId(req),
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount fetched successfully"));
});

export const createDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema);
  const discount = await discountService.createDiscount(data, getFirmId(req));
  res
    .status(201)
    .json(new ApiResponse(201, discount, "Discount created successfully"));
});

export const updateDiscount = asyncHandler(async (req, res) => {
  const data = validate(req.body, discountSchema, { allowPartial: true });
  const discount = await discountService.updateDiscount(
    req.params.discountId,
    getFirmId(req),
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Discount updated successfully"));
});

export const deleteDiscount = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.params.discountId, getFirmId(req));
  res
    .status(200)
    .json(new ApiResponse(200, null, "Discount deleted successfully"));
});

export const getItemDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getItemDiscount(
    req.params.itemId,
    req.ownerId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, discount, "Item discount fetched successfully"));
});

export const getPartyDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.getPartyDiscount(
    req.params.partyId,
    req.ownerId,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, discount, "Party discount fetched successfully"),
    );
});
