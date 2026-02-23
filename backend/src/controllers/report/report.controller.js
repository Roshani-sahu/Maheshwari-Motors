import { reportService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

export const getPurchaseReport = asyncHandler(async (req, res) => {
  const result = await reportService.getPurchaseReport(
    req.user._id,
    req.isGst,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Purchase report fetched successfully"));
});

export const getSalesReport = asyncHandler(async (req, res) => {
  const result = await reportService.getSalesReport(
    req.user._id,
    req.isGst,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Sales report fetched successfully"));
});
