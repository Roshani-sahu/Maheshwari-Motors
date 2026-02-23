import { transportService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const transportSchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Transport name",
  },
  address: { required: false, type: "string", max: 500, label: "Address" },
  city: { required: false, type: "string", max: 100, label: "City" },
  pincode: { required: false, type: "string", max: 10, label: "Pincode" },
  phone: {
    required: false,
    type: "string",
    format: "phone",
    label: "Phone number",
  },
  whatsapp: {
    required: false,
    type: "string",
    format: "phone",
    label: "WhatsApp number",
  },
  gstin: { required: false, type: "string", format: "gstin", label: "GSTIN" },
};

export const getTransports = asyncHandler(async (req, res) => {
  const result = await transportService.getTransports(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transports fetched successfully"));
});

export const getTransportById = asyncHandler(async (req, res) => {
  const transport = await transportService.getTransportById(
    req.params.transportId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, transport, "Transport fetched successfully"));
});

export const createTransport = asyncHandler(async (req, res) => {
  const data = validate(req.body, transportSchema);
  const transport = await transportService.createTransport(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, transport, "Transport created successfully"));
});

export const updateTransport = asyncHandler(async (req, res) => {
  const data = validate(req.body, transportSchema, { allowPartial: true });
  const transport = await transportService.updateTransport(
    req.params.transportId,
    req.user._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, transport, "Transport updated successfully"));
});

export const deleteTransport = asyncHandler(async (req, res) => {
  await transportService.deleteTransport(req.params.transportId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Transport deleted successfully"));
});
