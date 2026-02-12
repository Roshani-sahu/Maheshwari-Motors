import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";

/**
 * Firm Middleware (Updated)
 *
 * Supports two login flows:
 * 1. Firm login (req.role === "firm"):
 *    - The firmId in URL must match the logged-in firm OR its paired firm
 *    - req.firm is already set by auth middleware
 *
 * 2. Legacy user login (req.role === "user"):
 *    - Original behavior: checks firm.user_id matches req.user._id
 */
const firmMiddleware = asyncHandler(async (req, res, next) => {
  const { firmId } = req.params;

  if (!firmId) {
    throw ApiError.badRequest("Firm ID is required");
  }

  const firm = await Firm.findById(firmId);

  if (!firm) {
    throw ApiError.notFound("Firm not found");
  }

  if (req.role === "firm") {
    // Firm-based login: the logged-in firm is the context
    const loggedInFirmId = req.firm._id.toString();

    if (loggedInFirmId === firmId) {
      // Accessing own firm — allowed
      req.firmData = firm;
      req.firmOwnerId = firm.admin_id || firm.user_id;
      return next();
    }

    // Check if firmId is the paired firm (cross-firm billing)
    const pair = await FirmPair.findOne({
      $or: [
        { gst_firm_id: loggedInFirmId, nongst_firm_id: firmId },
        { nongst_firm_id: loggedInFirmId, gst_firm_id: firmId },
      ],
    });

    if (pair) {
      req.firmData = firm;
      req.firmOwnerId = firm.admin_id || firm.user_id;
      return next();
    }

    throw ApiError.forbidden("You do not have access to this firm");
  }

  if (req.role === "admin") {
    // Admin can access any firm they created
    if (
      firm.admin_id &&
      firm.admin_id.toString() === req.admin._id.toString()
    ) {
      req.firmData = firm;
      req.firmOwnerId = firm.admin_id;
      return next();
    }
    throw ApiError.forbidden("You do not have access to this firm");
  }

  // Legacy user login
  const isOwner =
    firm.user_id && firm.user_id.toString() === req.user._id.toString();
  const isAssigned = req.user.firm_ids?.some((id) => id.toString() === firmId);

  if (!isOwner && !isAssigned) {
    throw ApiError.forbidden("You do not have access to this firm");
  }

  req.firmData = firm;
  req.firmOwnerId = firm.user_id;
  next();
});

export default firmMiddleware;
