import { ApiError } from "../utils/index.js";

const mainUserOnly = (req, res, next) => {
  if (req.user.type !== "main") {
    throw ApiError.forbidden("Only main user can perform this action");
  }
  next();
};

export default mainUserOnly;
