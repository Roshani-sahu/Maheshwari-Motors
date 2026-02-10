import Firm from "../models/firm.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";

const firmMiddleware = asyncHandler(async (req, res, next) => {
  const { firmId } = req.params;

  if (!firmId) {
    throw ApiError.badRequest("Firm ID is required");
  }

  const firm = await Firm.findById(firmId);

  if (!firm) {
    throw ApiError.notFound("Firm not found");
  }

  // Main user who owns the firm — full access
  const isOwner = firm.user_id.toString() === req.user._id.toString();

  // Secondary user who has this firm assigned
  const isAssigned = req.user.firm_ids?.some((id) => id.toString() === firmId);

  if (!isOwner && !isAssigned) {
    throw ApiError.forbidden("You do not have access to this firm");
  }

  req.firm = firm;
  // Store the actual owner's userId for data queries (firm-scoped data uses owner's userId)
  req.firmOwnerId = firm.user_id;
  next();
});

export default firmMiddleware;
