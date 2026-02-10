import { firmService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const firmSchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 100,
    label: "Firm name",
  },
  type: {
    required: true,
    type: "string",
    enum: ["GST", "NON_GST"],
    label: "Firm type",
  },
  phone: {
    required: true,
    type: "string",
    format: "phone",
    label: "Phone number",
  },
  email: { required: true, type: "string", format: "email", label: "Email" },
  address: {
    required: true,
    type: "string",
    min: 1,
    max: 500,
    label: "Address",
  },
  godown_address: {
    required: false,
    type: "string",
    max: 500,
    label: "Godown address",
  },
  city: { required: true, type: "string", min: 1, max: 100, label: "City" },
  state: { required: true, type: "string", min: 1, max: 100, label: "State" },
  GSTIN: { required: false, type: "string", format: "gstin", label: "GSTIN" },
  CIN: { required: false, type: "string", format: "cin", label: "CIN" },
  reg_number: {
    required: false,
    type: "string",
    max: 30,
    label: "Registration number",
  },
  bank_name: { required: false, type: "string", max: 100, label: "Bank name" },
  bank_branch: {
    required: false,
    type: "string",
    max: 100,
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

export const getFirms = asyncHandler(async (req, res) => {
  const result = await firmService.getFirms(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Firms fetched successfully"));
});

export const getFirmById = asyncHandler(async (req, res) => {
  const firm = await firmService.getFirmById(req.params.firmId, req.user._id);
  res.status(200).json(new ApiResponse(200, firm, "Firm fetched successfully"));
});

export const createFirm = asyncHandler(async (req, res) => {
  const data = validate(req.body, firmSchema);
  const firm = await firmService.createFirm(data, req.user._id);
  res.status(201).json(new ApiResponse(201, firm, "Firm created successfully"));
});

export const updateFirm = asyncHandler(async (req, res) => {
  const data = validate(req.body, firmSchema, { allowPartial: true });
  const firm = await firmService.updateFirm(
    req.params.firmId,
    req.user._id,
    data,
  );
  res.status(200).json(new ApiResponse(200, firm, "Firm updated successfully"));
});

export const deleteFirm = asyncHandler(async (req, res) => {
  await firmService.deleteFirm(req.params.firmId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Firm deleted successfully"));
});
