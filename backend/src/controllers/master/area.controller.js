import { areaService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

export const getAreas = asyncHandler(async (req, res) => {
  const result = await areaService.getAreas(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Areas fetched successfully"));
});

export const getAreaById = asyncHandler(async (req, res) => {
  const area = await areaService.getAreaById(req.params.areaId, req.user._id);
  res.status(200).json(new ApiResponse(200, area, "Area fetched successfully"));
});

export const createArea = asyncHandler(async (req, res) => {
  const data = validate(req.body, areaSchema);
  const area = await areaService.createArea(data, req.user._id);
  res.status(201).json(new ApiResponse(201, area, "Area created successfully"));
});

export const updateArea = asyncHandler(async (req, res) => {
  const data = validate(req.body, areaSchema, { allowPartial: true });
  const area = await areaService.updateArea(
    req.params.areaId,
    req.user._id,
    data,
  );
  res.status(200).json(new ApiResponse(200, area, "Area updated successfully"));
});

export const deleteArea = asyncHandler(async (req, res) => {
  await areaService.deleteArea(req.params.areaId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Area deleted successfully"));
});
