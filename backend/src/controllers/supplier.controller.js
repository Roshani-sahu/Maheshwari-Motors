import { supplierService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.getSuppliers(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Suppliers fetched successfully"));
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(
    req.params.supplierId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, supplier, "Supplier fetched successfully"));
});

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.body, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, supplier, "Supplier created successfully"));
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(
    req.params.supplierId,
    req.user._id,
    req.body,
  );
  res
    .status(200)
    .json(new ApiResponse(200, supplier, "Supplier updated successfully"));
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.params.supplierId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Supplier deleted successfully"));
});
