import { hsnService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const hsnSchema = {
  hsn_code: { required: true, type: "string", min: 1, label: "HSN code" },
  description: { required: false, type: "string", label: "Description" },
  gst_rate: { required: true, type: "number", min: 0, label: "GST rate" },
  is_active: { required: false, type: "boolean", label: "Is active" },
};

class HsnController {
  getHsns = asyncHandler(async (req, res) => {
    const result = await hsnService.getHsns(req.user._id, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "HSN codes fetched successfully"));
  });

  getHsnById = asyncHandler(async (req, res) => {
    const hsn = await hsnService.getHsnById(req.params.hsnId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, hsn, "HSN code fetched successfully"));
  });

  createHsn = asyncHandler(async (req, res) => {
    const data = validate(req.body, hsnSchema);
    const hsn = await hsnService.createHsn(data, req.user._id);
    res
      .status(201)
      .json(new ApiResponse(201, hsn, "HSN code created successfully"));
  });

  updateHsn = asyncHandler(async (req, res) => {
    const data = validate(req.body, hsnSchema, { allowPartial: true });
    const hsn = await hsnService.updateHsn(req.params.hsnId, req.user._id, data);
    res
      .status(200)
      .json(new ApiResponse(200, hsn, "HSN code updated successfully"));
  });

  deleteHsn = asyncHandler(async (req, res) => {
    await hsnService.deleteHsn(req.params.hsnId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "HSN code deleted successfully"));
  });
}

const hsnController = new HsnController();

export const getHsns = hsnController.getHsns;
export const getHsnById = hsnController.getHsnById;
export const createHsn = hsnController.createHsn;
export const updateHsn = hsnController.updateHsn;
export const deleteHsn = hsnController.deleteHsn;

export default hsnController;
