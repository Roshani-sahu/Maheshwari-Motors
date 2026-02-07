import { firmService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getFirms = asyncHandler(async (req, res) => {
  const result = await firmService.getFirms(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Firms fetched successfully"));
});

export const getFirmById = asyncHandler(async (req, res) => {
  const firm = await firmService.getFirmById(req.params.firmId, req.user._id);
  res.status(200).json(new ApiResponse(200, firm, "Firm fetched successfully"));
});

export const createFirm = asyncHandler(async (req, res) => {
  const firm = await firmService.createFirm(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, firm, "Firm created successfully"));
});

export const updateFirm = asyncHandler(async (req, res) => {
  const firm = await firmService.updateFirm(
    req.params.firmId,
    req.user._id,
    req.body,
  );
  res.status(200).json(new ApiResponse(200, firm, "Firm updated successfully"));
});

export const deleteFirm = asyncHandler(async (req, res) => {
  await firmService.deleteFirm(req.params.firmId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Firm deleted successfully"));
});
