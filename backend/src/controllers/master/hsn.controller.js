import { hsnService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

export const getHsns = asyncHandler(async (req, res) => {
  const result = await hsnService.getHsns(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "HSN codes fetched successfully"));
});

export const getHsnById = asyncHandler(async (req, res) => {
  const hsn = await hsnService.getHsnById(req.params.hsnId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, hsn, "HSN code fetched successfully"));
});

export const createHsn = asyncHandler(async (req, res) => {
  const data = validate(req.body, hsnSchema);
  const hsn = await hsnService.createHsn(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, hsn, "HSN code created successfully"));
});

export const updateHsn = asyncHandler(async (req, res) => {
  const data = validate(req.body, hsnSchema, { allowPartial: true });
  const hsn = await hsnService.updateHsn(req.params.hsnId, req.user._id, data);
  res
    .status(200)
    .json(new ApiResponse(200, hsn, "HSN code updated successfully"));
});

export const deleteHsn = asyncHandler(async (req, res) => {
  await hsnService.deleteHsn(req.params.hsnId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "HSN code deleted successfully"));
});
