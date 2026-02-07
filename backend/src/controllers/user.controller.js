import { userService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getSecondaryUsers(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getSecondaryUserById(
    req.params.userId,
    req.user._id,
  );
  res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});

export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createSecondaryUser(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, user, "User created successfully"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateSecondaryUser(
    req.params.userId,
    req.user._id,
    req.body,
  );
  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteSecondaryUser(req.params.userId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export const updateUserFirms = asyncHandler(async (req, res) => {
  const { firm_ids } = req.body;
  const user = await userService.updateSecondaryUserFirms(
    req.params.userId,
    req.user._id,
    firm_ids,
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "User firms updated successfully"));
});
