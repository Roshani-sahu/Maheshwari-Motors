import { billService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const createBillSchema = {
  party_id: { required: true, type: "objectId", label: "Party ID" },
  challan_ids: {
    required: true,
    type: "array",
    min: 1,
    arrayType: "objectId",
    label: "Challan IDs",
  },
  apply_balance: {
    required: false,
    type: "boolean",
    label: "Apply party balance",
  },
  delivered_amount: {
    required: false,
    type: "number",
    min: 0,
    label: "Delivered amount (partial delivery)",
  },
};

const paymentSchema = {
  amount: {
    required: true,
    type: "number",
    min: 0.01,
    label: "Payment amount",
  },
};

const returnSchema = {
  return_amount: {
    required: true,
    type: "number",
    min: 0.01,
    label: "Return amount",
  },
};

export const getBills = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.user._id, req.isGst, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});

export const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(
    req.params.billId,
    req.user._id,
    req.isGst,
  );
  res.status(200).json(new ApiResponse(200, bill, "Bill fetched successfully"));
});

export const createBill = asyncHandler(async (req, res) => {
  const data = validate(req.body, createBillSchema);
  const result = await billService.createBill(data, req.user._id, req.isGst);
  res
    .status(201)
    .json(new ApiResponse(201, result, "Bill created successfully"));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = validate(req.body, paymentSchema);
  const bill = await billService.recordPayment(
    req.params.billId,
    req.user._id,
    req.isGst,
    amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, bill, "Payment recorded successfully"));
});

export const handleReturn = asyncHandler(async (req, res) => {
  const { return_amount } = validate(req.body, returnSchema);
  const party = await billService.handleReturn(
    req.params.billId,
    req.user._id,
    req.isGst,
    return_amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Return processed successfully"));
});

export const deleteBill = asyncHandler(async (req, res) => {
  await billService.deleteBill(req.params.billId, req.user._id, req.isGst);
  res.status(200).json(new ApiResponse(200, null, "Bill deleted successfully"));
});

export const getBillsByStatus = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.user._id, req.isGst, {
    ...req.query,
    payment_status: req.params.status,
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});

export const getBillsForParty = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.user._id, req.isGst, {
    ...req.query,
    party_id: req.params.partyId,
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});
