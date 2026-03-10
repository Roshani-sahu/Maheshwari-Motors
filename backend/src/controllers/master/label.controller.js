import { labelService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

class LabelController {
  getLabels = asyncHandler(async (req, res) => {
    const result = await labelService.getLabels(req.user._id, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Labels fetched successfully"));
  });

  getLabelsDetailed = asyncHandler(async (req, res) => {
    const result = await labelService.getLabelsDetailed(
      req.user._id,
      req.query,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Labels with discounts fetched successfully",
        ),
      );
  });

  getLabelById = asyncHandler(async (req, res) => {
    const label = await labelService.getLabelById(
      req.params.labelId,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, label, "Label fetched successfully"));
  });

  createLabel = asyncHandler(async (req, res) => {
    const label = await labelService.createLabel(req.body, req.user._id);
    res
      .status(201)
      .json(new ApiResponse(201, label, "Label created successfully"));
  });

  updateLabel = asyncHandler(async (req, res) => {
    const label = await labelService.updateLabel(
      req.params.labelId,
      req.user._id,
      req.body,
    );
    res
      .status(200)
      .json(new ApiResponse(200, label, "Label updated successfully"));
  });

  deleteLabel = asyncHandler(async (req, res) => {
    await labelService.deleteLabel(req.params.labelId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Label deleted successfully"));
  });
}

const labelController = new LabelController();

export const getLabels = labelController.getLabels;
export const getLabelsDetailed = labelController.getLabelsDetailed;
export const getLabelById = labelController.getLabelById;
export const createLabel = labelController.createLabel;
export const updateLabel = labelController.updateLabel;
export const deleteLabel = labelController.deleteLabel;

export default labelController;
