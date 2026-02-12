import { challanService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const challanItemSchema = {
  item_id: { required: true, type: "objectId", label: "Item ID" },
  quantity: { required: true, type: "number", min: 1, label: "Quantity" },
  rate: { required: true, type: "number", min: 0, label: "Rate" },
  discount: { required: false, type: "number", min: 0, label: "Discount" },
  is_gst: {
    required: false,
    type: "number",
    enum: [0, 1],
    label: "GST flag (1=GST firm, 0=NON_GST firm)",
  },
};

const challanSchema = {
  date: { required: false, type: "date", label: "Date" },
  party_id: { required: true, type: "objectId", label: "Party ID" },
  items: {
    required: true,
    type: "array",
    min: 1,
    items: challanItemSchema,
    label: "Items",
  },
  discount: { required: false, type: "number", min: 0, label: "Discount" },
};

export const getChallans = asyncHandler(async (req, res) => {
  const result = await challanService.getChallans(
    req.user._id,
    req.isGst,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Challans fetched successfully"));
});

export const getChallanById = asyncHandler(async (req, res) => {
  const challan = await challanService.getChallanById(
    req.params.challanId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan fetched successfully"));
});

export const createChallan = asyncHandler(async (req, res) => {
  const data = validate(req.body, challanSchema);
  const challan = await challanService.createChallan(
    data,
    req.user._id,
    req.isGst,
  );
  res
    .status(201)
    .json(new ApiResponse(201, challan, "Challan created successfully"));
});

export const updateChallan = asyncHandler(async (req, res) => {
  const data = validate(req.body, challanSchema, { allowPartial: true });
  const challan = await challanService.updateChallan(
    req.params.challanId,
    req.user._id,
    req.isGst,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan updated successfully"));
});

export const deleteChallan = asyncHandler(async (req, res) => {
  await challanService.deleteChallan(
    req.params.challanId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Challan deleted successfully"));
});

export const getUnconvertedChallansForParty = asyncHandler(async (req, res) => {
  const challans = await challanService.getUnconvertedChallansForParty(
    req.params.partyId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challans, "Challans fetched successfully"));
});
