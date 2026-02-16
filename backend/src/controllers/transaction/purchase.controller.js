import { purchaseService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const purchaseItemSchema = {
  item_id: { required: true, type: "objectId", label: "Item ID" },
  quantity: { required: true, type: "number", min: 1, label: "Quantity" },
  rate: { required: true, type: "number", min: 0, label: "Rate" },
};

const createPurchaseSchema = {
  date: { required: false, type: "date", label: "Date" },
  supplier_id: { required: true, type: "objectId", label: "Supplier ID" },
  items: {
    required: true,
    type: "array",
    min: 1,
    items: purchaseItemSchema,
    label: "Items",
  },
  purchase_type: {
    required: true,
    type: "string",
    enum: ["GST", "NON_GST"],
    label: "Purchase type",
  },
};

const purchasePaymentSchema = {
  amount: {
    required: true,
    type: "number",
    min: 0.01,
    label: "Payment amount",
  },
};

export const getPurchases = asyncHandler(async (req, res) => {
  const result = await purchaseService.getPurchases(
    req.user._id,
    req.isGst,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Purchases fetched successfully"));
});

export const getPurchaseById = asyncHandler(async (req, res) => {
  const purchase = await purchaseService.getPurchaseById(
    req.params.purchaseId,
    req.user._id,
  );
  res
    .status(200)
    .json(new ApiResponse(200, purchase, "Purchase fetched successfully"));
});

export const createPurchase = asyncHandler(async (req, res) => {
  const data = validate(req.body, createPurchaseSchema);
  const purchase = await purchaseService.createPurchase(data, req.user._id);
  res
    .status(201)
    .json(new ApiResponse(201, purchase, "Purchase created successfully"));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = validate(req.body, purchasePaymentSchema);
  const purchase = await purchaseService.recordPayment(
    req.params.purchaseId,
    req.user._id,
    amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, purchase, "Payment recorded successfully"));
});

export const deletePurchase = asyncHandler(async (req, res) => {
  await purchaseService.deletePurchase(req.params.purchaseId, req.user._id);
  res
    .status(200)
    .json(new ApiResponse(200, null, "Purchase deleted successfully"));
});

export const getPurchasesByType = asyncHandler(async (req, res) => {
  const result = await purchaseService.getPurchases(req.user._id, req.isGst, {
    ...req.query,
    purchase_type: req.params.type,
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Purchases fetched successfully"));
});
