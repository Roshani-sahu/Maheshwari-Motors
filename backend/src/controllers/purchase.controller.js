import { purchaseService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getPurchases = asyncHandler(async (req, res) => {
  const result = await purchaseService.getPurchases(
    req.params.firmId,
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Purchases fetched successfully"));
});

export const getPurchaseById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(
    req.params.purchaseId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, purchase, "Purchase fetched successfully"));
});

export const createPurchase = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.createPurchase(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(201)
    .json(new ApiResponse(201, purchase, "Purchase created successfully"));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.recordPayment(
    req.params.purchaseId,
    req.params.firmId,
    req.user._id,
    req.body.amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, purchase, "Payment recorded successfully"));
});

export const deletePurchase = asyncHandler(async (req, res) => {
  await purchaseService.deletePurchase(
    req.params.purchaseId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Purchase deleted successfully"));
});

export const getPurchasesByType = asyncHandler(async (req, res) => {
  const result = await purchaseService.getPurchases(
    req.params.firmId,
    req.user._id,
    {
      ...req.query,
      purchase_type: req.params.type,
    },
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Purchases fetched successfully"));
});
