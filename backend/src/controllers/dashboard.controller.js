import { dashboardService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, data, "Dashboard data fetched successfully"));
});

export const getFirmDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getFirmDashboard(
    req.params.firmId,
    req.firmOwnerId,
    req.query.period,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, data, "Firm dashboard data fetched successfully"),
    );
});
