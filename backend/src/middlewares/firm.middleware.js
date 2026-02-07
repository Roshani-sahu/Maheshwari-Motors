import Firm from "../models/firm.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";

const firmMiddleware = asyncHandler(async (req, res, next) => {
  const { firmId } = req.params;

  if (!firmId) {
    throw ApiError.badRequest("Firm ID is required");
  }

  const firm = await Firm.findOne({
    _id: firmId,
    user_id: req.user._id,
  });

  if (!firm) {
    throw ApiError.notFound("Firm not found or access denied");
  }

  req.firm = firm;
  next();
});

export default firmMiddleware;
