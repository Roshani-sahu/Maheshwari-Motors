import { adminService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const firmSchema = {
  username: {
    required: true,
    type: "string",
    min: 3,
    max: 50,
    label: "Username",
  },
  password: {
    required: true,
    type: "string",
    min: 6,
    max: 100,
    label: "Password",
  },
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Firm name",
  },
  phone: {
    required: true,
    type: "string",
    format: "phone",
    label: "Firm phone",
  },
  email: {
    required: true,
    type: "string",
    format: "email",
    label: "Firm email",
  },
  address: {
    required: true,
    type: "string",
    min: 1,
    max: 500,
    label: "Firm address",
  },
  godown_address: {
    required: false,
    type: "string",
    max: 500,
    label: "Godown address",
  },
  city: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "City",
  },
  state: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "State",
  },
  GSTIN: {
    required: false,
    type: "string",
    format: "gstin",
    label: "GSTIN",
  },
  CIN: {
    required: false,
    type: "string",
    max: 25,
    label: "CIN",
  },
  reg_number: {
    required: false,
    type: "string",
    max: 50,
    label: "Registration number",
  },
  bank_name: {
    required: false,
    type: "string",
    max: 200,
    label: "Bank name",
  },
  bank_branch: {
    required: false,
    type: "string",
    max: 200,
    label: "Bank branch",
  },
  ifsc_code: {
    required: false,
    type: "string",
    format: "ifsc",
    label: "IFSC code",
  },
  account_number: {
    required: false,
    type: "string",
    format: "account_number",
    label: "Account number",
  },
};

const createUserSchema = {
  name: { required: true, type: "string", min: 2, max: 100, label: "Name" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  phone: { required: false, type: "string", label: "Phone" },
  gst_firm: {
    required: true,
    type: "object",
    fields: firmSchema,
    label: "GST Firm",
  },
  nongst_firm: {
    required: true,
    type: "object",
    fields: firmSchema,
    label: "Non-GST Firm",
  },
};

const updateUserSchema = {
  name: { required: false, type: "string", min: 2, max: 100, label: "Name" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  phone: { required: false, type: "string", label: "Phone" },
  is_active: {
    required: false,
    type: "boolean",
    label: "Active status",
  },
  gst_firm: {
    required: false,
    type: "object",
    fields: firmSchema,
    label: "GST Firm",
  },
  nongst_firm: {
    required: false,
    type: "object",
    fields: firmSchema,
    label: "Non-GST Firm",
  },
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
  const data = validate(req.body, updateUserSchema, { allowPartial: true });
  const result = await adminService.updateSecondaryUser(
    req.params.userId,
    data,
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
