import { adminService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const createUserSchema = {
  name: { required: true, type: "string", min: 2, max: 100, label: "Name" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  phone: { required: false, type: "string", label: "Phone" },
  gst_firm: { required: true, type: "object", label: "GST Firm" },
  nongst_firm: { required: true, type: "object", label: "Non-GST Firm" },
};

export const createSecondaryUser = asyncHandler(async (req, res) => {
  const data = validate(req.body, createUserSchema);
  const result = await adminService.createSecondaryUser(data);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Secondary user created successfully"));
});

export const getSecondaryUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getSecondaryUsers(req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Users fetched successfully"));
});

export const getSecondaryUserById = asyncHandler(async (req, res) => {
  const result = await adminService.getSecondaryUserById(req.params.userId);
  res
    .status(200)
    .json(new ApiResponse(200, result, "User fetched successfully"));
});

export const updateSecondaryUser = asyncHandler(async (req, res) => {
  const result = await adminService.updateSecondaryUser(
    req.params.userId,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "User updated successfully"));
});

export const deactivateSecondaryUser = asyncHandler(async (req, res) => {
  await adminService.deactivateSecondaryUser(req.params.userId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "User deactivated successfully"));
});

export const reactivateSecondaryUser = asyncHandler(async (req, res) => {
  await adminService.reactivateSecondaryUser(req.params.userId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "User reactivated successfully"));
});

export const deleteSecondaryUser = asyncHandler(async (req, res) => {
  await adminService.deleteSecondaryUser(req.params.userId);
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});
