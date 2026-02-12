import { adminService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

/**
 * Admin Controller
 *
 * Endpoints for admin-only operations:
 * - Create firm pair
 * - List firm pairs
 * - Update firm credentials
 * - Deactivate/Reactivate firm pairs
 */

const firmDataSchema = {
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
    min: 2,
    max: 100,
    label: "Firm Name",
  },
  phone: { required: true, type: "string", min: 10, max: 15, label: "Phone" },
  email: { required: true, type: "string", format: "email", label: "Email" },
  address: {
    required: true,
    type: "string",
    min: 5,
    max: 200,
    label: "Address",
  },
  city: { required: true, type: "string", min: 2, max: 50, label: "City" },
  state: { required: true, type: "string", min: 2, max: 50, label: "State" },
  godown_address: {
    required: false,
    type: "string",
    max: 200,
    label: "Godown Address",
  },
  GSTIN: { required: false, type: "string", format: "gstin", label: "GSTIN" },
  CIN: { required: false, type: "string", max: 50, label: "CIN" },
  reg_number: {
    required: false,
    type: "string",
    max: 50,
    label: "Registration Number",
  },
  bank_name: { required: false, type: "string", max: 100, label: "Bank Name" },
  bank_branch: {
    required: false,
    type: "string",
    max: 100,
    label: "Bank Branch",
  },
  ifsc_code: {
    required: false,
    type: "string",
    format: "ifsc",
    label: "IFSC Code",
  },
  account_number: {
    required: false,
    type: "string",
    max: 20,
    label: "Account Number",
  },
};

const createFirmPairSchema = {
  business_name: {
    required: true,
    type: "string",
    min: 2,
    max: 100,
    label: "Business Name",
  },
  gst_firm: { required: true, type: "object", label: "GST Firm" },
  nongst_firm: { required: true, type: "object", label: "Non-GST Firm" },
};

const updateFirmSchema = {
  username: {
    required: false,
    type: "string",
    min: 3,
    max: 50,
    label: "Username",
  },
  password: {
    required: false,
    type: "string",
    min: 6,
    max: 100,
    label: "Password",
  },
  name: {
    required: false,
    type: "string",
    min: 2,
    max: 100,
    label: "Firm Name",
  },
  phone: { required: false, type: "string", min: 10, max: 15, label: "Phone" },
  email: { required: false, type: "string", format: "email", label: "Email" },
  address: {
    required: false,
    type: "string",
    min: 5,
    max: 200,
    label: "Address",
  },
  city: { required: false, type: "string", min: 2, max: 50, label: "City" },
  state: { required: false, type: "string", min: 2, max: 50, label: "State" },
  godown_address: {
    required: false,
    type: "string",
    max: 200,
    label: "Godown Address",
  },
  GSTIN: { required: false, type: "string", format: "gstin", label: "GSTIN" },
  CIN: { required: false, type: "string", max: 50, label: "CIN" },
  reg_number: {
    required: false,
    type: "string",
    max: 50,
    label: "Registration Number",
  },
  bank_name: { required: false, type: "string", max: 100, label: "Bank Name" },
  bank_branch: {
    required: false,
    type: "string",
    max: 100,
    label: "Bank Branch",
  },
  ifsc_code: {
    required: false,
    type: "string",
    format: "ifsc",
    label: "IFSC Code",
  },
  account_number: {
    required: false,
    type: "string",
    max: 20,
    label: "Account Number",
  },
};

/**
 * Create a new firm pair (GST + NON_GST)
 * POST /admin/firm-pairs
 */
export const createFirmPair = asyncHandler(async (req, res) => {
  const data = validate(req.body, createFirmPairSchema);

  // Validate individual firms - GST firm requires GSTIN
  const gstFirmSchema = {
    ...firmDataSchema,
    GSTIN: { required: true, type: "string", format: "gstin", label: "GSTIN" },
  };
  const validatedGst = validate(data.gst_firm, gstFirmSchema);
  const validatedNongst = validate(data.nongst_firm, firmDataSchema);

  const result = await adminService.createFirmPair(req.admin._id, {
    business_name: data.business_name,
    gst_firm: validatedGst,
    nongst_firm: validatedNongst,
  });

  res
    .status(201)
    .json(new ApiResponse(201, result, "Firm pair created successfully"));
});

/**
 * Get all firm pairs for admin
 * GET /admin/firm-pairs
 */
export const getFirmPairs = asyncHandler(async (req, res) => {
  const pairs = await adminService.getFirmPairs(req.admin._id);
  res
    .status(200)
    .json(new ApiResponse(200, pairs, "Firm pairs fetched successfully"));
});

/**
 * Get a single firm pair
 * GET /admin/firm-pairs/:pairId
 */
export const getFirmPairById = asyncHandler(async (req, res) => {
  const pair = await adminService.getFirmPairById(
    req.params.pairId,
    req.admin._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, pair, "Firm pair fetched successfully"));
});

/**
 * Update firm credentials/details
 * PUT /admin/firms/:firmId
 */
export const updateFirm = asyncHandler(async (req, res) => {
  const data = validate(req.body, updateFirmSchema);
  const result = await adminService.updateFirmCredentials(
    req.params.firmId,
    req.admin._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Firm updated successfully"));
});

/**
 * Deactivate a firm pair
 * DELETE /admin/firm-pairs/:pairId
 */
export const deactivateFirmPair = asyncHandler(async (req, res) => {
  await adminService.deactivateFirmPair(req.params.pairId, req.admin._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Firm pair deactivated successfully"));
});

/**
 * Reactivate a firm pair
 * POST /admin/firm-pairs/:pairId/reactivate
 */
export const reactivateFirmPair = asyncHandler(async (req, res) => {
  await adminService.reactivateFirmPair(req.params.pairId, req.admin._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Firm pair reactivated successfully"));
});
