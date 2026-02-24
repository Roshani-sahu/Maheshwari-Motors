import { transportService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const transportSchema = {
  name: { required: true, type: "string", min: 1, label: "Transport name" },
  address: { required: false, type: "string", label: "Address" },
  city: { required: false, type: "string", label: "City" },
  pincode: { required: false, type: "string", label: "Pincode" },
  phone: { required: false, type: "string", label: "Phone" },
  whatsapp: { required: false, type: "string", label: "WhatsApp" },
  gstin: { required: false, type: "string", label: "GSTIN" },
};

class TransportController {
  getTransports = asyncHandler(async (req, res) => {
    const result = await transportService.getTransports(req.user._id, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Transports fetched successfully"));
  });

  getTransportById = asyncHandler(async (req, res) => {
    const transport = await transportService.getTransportById(
      req.params.transportId,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, transport, "Transport fetched successfully"));
  });

  createTransport = asyncHandler(async (req, res) => {
    const data = validate(req.body, transportSchema);
    const transport = await transportService.createTransport(data, req.user._id);
    res
      .status(201)
      .json(new ApiResponse(201, transport, "Transport created successfully"));
  });

  updateTransport = asyncHandler(async (req, res) => {
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

  deleteTransport = asyncHandler(async (req, res) => {
    await transportService.deleteTransport(req.params.transportId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Transport deleted successfully"));
  });
}

const transportController = new TransportController();

export const getTransports = transportController.getTransports;
export const getTransportById = transportController.getTransportById;
export const createTransport = transportController.createTransport;
export const updateTransport = transportController.updateTransport;
export const deleteTransport = transportController.deleteTransport;

export default transportController;
