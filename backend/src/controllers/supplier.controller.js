import { supplierService } from "../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../utils/index.js";

const supplierSchema = {
  name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Supplier name",
  },
  phone: {
    required: false,
    type: "string",
    format: "phone",
    label: "Phone number",
  },
  email: { required: false, type: "string", format: "email", label: "Email" },
  address: { required: false, type: "string", max: 500, label: "Address" },
  city: { required: false, type: "string", max: 100, label: "City" },
  state: { required: false, type: "string", max: 100, label: "State" },
  gstin: { required: false, type: "string", format: "gstin", label: "GSTIN" },
};

export const getSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.getSuppliers(req.ownerId, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Suppliers fetched successfully"));
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(
    req.params.supplierId,
    req.ownerId,
  );
  res
    .status(200)
    .json(new ApiResponse(200, supplier, "Supplier fetched successfully"));
});

export const createSupplier = asyncHandler(async (req, res) => {
  const data = validate(req.body, supplierSchema);
  const supplier = await supplierService.createSupplier(data, req.ownerId);
  res
    .status(201)
    .json(new ApiResponse(201, supplier, "Supplier created successfully"));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const data = validate(req.body, supplierSchema, { allowPartial: true });
  const supplier = await supplierService.updateSupplier(
    req.params.supplierId,
    req.ownerId,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, supplier, "Supplier updated successfully"));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.params.supplierId, req.ownerId);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Supplier deleted successfully"));
});
