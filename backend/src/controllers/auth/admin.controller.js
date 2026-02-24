import { adminService, subscriptionService } from "../../services/index.js";
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

const subscriptionSchema = {
  plan_type: {
    required: false,
    type: "string",
    enum: ["demo", "paid"],
    label: "Plan type",
  },
  years: { required: false, type: "number", min: 0, label: "Years" },
  months: { required: false, type: "number", min: 0, label: "Months" },
  days: { required: false, type: "number", min: 0, label: "Days" },
  notes: { required: false, type: "string", label: "Notes" },
  extend_from_current: {
    required: false,
    type: "boolean",
    label: "Extend from current",
  },
};

class AdminController {
  createSecondaryUser = asyncHandler(async (req, res) => {
    const data = validate(req.body, createUserSchema);
    const result = await adminService.createSecondaryUser(data);
    res
      .status(201)
      .json(new ApiResponse(201, result, "Secondary user created successfully"));
  });

  getSecondaryUsers = asyncHandler(async (req, res) => {
    const result = await adminService.getSecondaryUsers(req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Users fetched successfully"));
  });

  getSecondaryUserById = asyncHandler(async (req, res) => {
    const result = await adminService.getSecondaryUserById(req.params.userId);
    res
      .status(200)
      .json(new ApiResponse(200, result, "User fetched successfully"));
  });

  updateSecondaryUser = asyncHandler(async (req, res) => {
    const data = validate(req.body, updateUserSchema, { allowPartial: true });
    const result = await adminService.updateSecondaryUser(
      req.params.userId,
      data,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "User updated successfully"));
  });

  deactivateSecondaryUser = asyncHandler(async (req, res) => {
    await adminService.deactivateSecondaryUser(req.params.userId);
    res
      .status(200)
      .json(new ApiResponse(200, null, "User deactivated successfully"));
  });

  reactivateSecondaryUser = asyncHandler(async (req, res) => {
    const result = await adminService.reactivateSecondaryUser(req.params.userId);
    res
      .status(200)
      .json(new ApiResponse(200, result, "User reactivated successfully"));
  });

  deleteSecondaryUser = asyncHandler(async (req, res) => {
    await adminService.deleteSecondaryUser(req.params.userId);
    res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
  });

  getSubscriptions = asyncHandler(async (req, res) => {
    const result = await subscriptionService.getSubscriptions(req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Subscriptions fetched successfully"));
  });

  getSubscriptionByUserId = asyncHandler(async (req, res) => {
    const result = await subscriptionService.getSubscriptionByUserId(
      req.params.userId,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Subscription fetched successfully"));
  });

  setSubscription = asyncHandler(async (req, res) => {
    const data = validate(req.body, subscriptionSchema);
    const result = await subscriptionService.setSubscription(
      req.params.userId,
      data,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Subscription updated successfully"));
  });

  getExpiringToday = asyncHandler(async (_req, res) => {
    const result = await subscriptionService.getExpiringToday(new Date());
    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Expiring subscriptions fetched successfully"),
      );
  });

  runExpiryCheck = asyncHandler(async (_req, res) => {
    const result = await subscriptionService.markExpiredSubscriptions(new Date());
    res
      .status(200)
      .json(new ApiResponse(200, result, "Subscription expiry check completed"));
  });
}

const adminController = new AdminController();

export const createSecondaryUser = adminController.createSecondaryUser;
export const getSecondaryUsers = adminController.getSecondaryUsers;
export const getSecondaryUserById = adminController.getSecondaryUserById;
export const updateSecondaryUser = adminController.updateSecondaryUser;
export const deactivateSecondaryUser = adminController.deactivateSecondaryUser;
export const reactivateSecondaryUser = adminController.reactivateSecondaryUser;
export const deleteSecondaryUser = adminController.deleteSecondaryUser;
export const getSubscriptions = adminController.getSubscriptions;
export const getSubscriptionByUserId = adminController.getSubscriptionByUserId;
export const setSubscription = adminController.setSubscription;
export const getExpiringToday = adminController.getExpiringToday;
export const runExpiryCheck = adminController.runExpiryCheck;

export default adminController;
