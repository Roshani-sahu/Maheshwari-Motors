import { stockAlertService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

export const getAlerts = asyncHandler(async (req, res) => {
  const result = await stockAlertService.getAlerts(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Stock alerts fetched successfully"));
});

export const getUnresolvedCount = asyncHandler(async (req, res) => {
  const count = await stockAlertService.getUnresolvedCount(req.user._id);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { count },
        "Unresolved alerts count fetched successfully",
      ),
    );
});

export const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await stockAlertService.getLowStockItems(req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, items, "Low stock items fetched successfully"));
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const alert = await stockAlertService.resolveAlert(
    req.params.alertId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, alert, "Alert resolved successfully"));
});
