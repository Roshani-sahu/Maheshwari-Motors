import { billService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getBills = asyncHandler(async (req, res) => {
  const result = await billService.getBills(
    req.params.firmId,
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});

export const getBillById = asyncHandler(async (req, res) => {
  const bill = await billService.getBillById(
    req.params.billId,
    req.params.firmId,
    req.user._id,
  );
  res.status(200).json(new ApiResponse(200, bill, "Bill fetched successfully"));
});

export const createBill = asyncHandler(async (req, res) => {
  const bill = await billService.createBill(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res.status(201).json(new ApiResponse(201, bill, "Bill created successfully"));
});

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const bill = await billService.recordPayment(
    req.params.billId,
    req.params.firmId,
    req.user._id,
    amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, bill, "Payment recorded successfully"));
});

export const handleReturn = asyncHandler(async (req, res) => {
  const { return_amount } = req.body;
  const party = await billService.handleReturn(
    req.params.billId,
    req.params.firmId,
    req.user._id,
    return_amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, party, "Return processed successfully"));
});

export const deleteBill = asyncHandler(async (req, res) => {
  await billService.deleteBill(
    req.params.billId,
    req.params.firmId,
    req.user._id,
  );
  res.status(200).json(new ApiResponse(200, null, "Bill deleted successfully"));
});

export const getBillsByStatus = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.params.firmId, req.user._id, {
    ...req.query,
    payment_status: req.params.status,
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});

export const getBillsForParty = asyncHandler(async (req, res) => {
  const result = await billService.getBills(req.params.firmId, req.user._id, {
    ...req.query,
    party_id: req.params.partyId,
  });
  res
    .status(200)
    .json(new ApiResponse(200, result, "Bills fetched successfully"));
});
