import { challanService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getChallans = asyncHandler(async (req, res) => {
  const result = await challanService.getChallans(
    req.params.firmId,
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Challans fetched successfully"));
});

export const getChallanById = asyncHandler(async (req, res) => {
  const challan = await challanService.getChallanById(
    req.params.challanId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan fetched successfully"));
});

export const createChallan = asyncHandler(async (req, res) => {
  const challan = await challanService.createChallan(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, challan, "Challan created successfully"));
});

export const updateChallan = asyncHandler(async (req, res) => {
  const challan = await challanService.updateChallan(
    req.params.challanId,
    req.params.firmId,
    req.user._id,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan updated successfully"));
});

export const deleteChallan = asyncHandler(async (req, res) => {
  await challanService.deleteChallan(
    req.params.challanId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Challan deleted successfully"));
});

export const getUnconvertedChallansForParty = asyncHandler(async (req, res) => {
  const challans = await challanService.getUnconvertedChallansForParty(
    req.params.partyId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challans, "Challans fetched successfully"));
});
