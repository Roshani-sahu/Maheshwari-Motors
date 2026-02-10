import { userService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const createUserSchema = {
  username: {
    required: true,
    type: "string",
    min: 3,
    max: 30,
    label: "Username",
  },
  email: { required: true, type: "string", format: "email", label: "Email" },
  password: {
    required: true,
    type: "string",
    min: 6,
    max: 100,
    label: "Password",
  },
  firm_ids: {
    required: false,
    type: "array",
    arrayType: "objectId",
    label: "Firm IDs",
  },
};

const updateUserSchema = {
  username: {
    required: false,
    type: "string",
    min: 3,
    max: 30,
    label: "Username",
  },
  email: { required: false, type: "string", format: "email", label: "Email" },
  password: {
    required: false,
    type: "string",
    min: 6,
    max: 100,
    label: "Password",
  },
  firm_ids: {
    required: false,
    type: "array",
    arrayType: "objectId",
    label: "Firm IDs",
  },
};

const updateUserFirmsSchema = {
  firm_ids: {
    required: true,
    type: "array",
    arrayType: "objectId",
    label: "Firm IDs",
  },
};

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
  const data = validate(req.body, createUserSchema);
  const user = await userService.createSecondaryUser(data, req.user._id);
  res.status(201).json(new ApiResponse(201, user, "User created successfully"));
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = validate(req.body, updateUserSchema, { allowPartial: true });
  const user = await userService.updateSecondaryUser(
    req.params.userId,
    req.user._id,
    data,
  );
  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteSecondaryUser(req.params.userId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});

export const updateUserFirms = asyncHandler(async (req, res) => {
  const { firm_ids } = validate(req.body, updateUserFirmsSchema);
  const user = await userService.updateSecondaryUserFirms(
    req.params.userId,
    req.user._id,
    firm_ids,
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "User firms updated successfully"));
});
