import { transactionService } from "../services/index.js";
import { asyncHandler, ApiResponse } from "../utils/index.js";

export const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.params.firmId,
    req.user._id,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});

export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.transactionId,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, transaction, "Transaction fetched successfully"),
    );
});

export const createSaleTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createSaleTransaction(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        transaction,
        "Sale transaction created successfully",
      ),
    );
});

export const createPurchaseTransaction = asyncHandler(async (req, res) => {
  const transaction = await transactionService.createPurchaseTransaction(
    req.body,
    req.params.firmId,
    req.user._id,
  );
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        transaction,
        "Purchase transaction created successfully",
      ),
    );
});

export const getTransactionSummary = asyncHandler(async (req, res) => {
  const summary = await transactionService.getTransactionSummary(
    req.params.firmId,
    req.user._id,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, summary, "Transaction summary fetched successfully"),
    );
});

export const getTransactionsByType = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.params.firmId,
    req.user._id,
    {
      ...req.query,
      type: req.params.type,
    },
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});

export const getTransactionsByPaymentMode = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.params.firmId,
    req.user._id,
    {
      ...req.query,
      payment_mode: req.params.mode,
    },
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});
