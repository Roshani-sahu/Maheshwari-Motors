import { transactionService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const saleTransactionSchema = {
  bill_id: { required: true, type: "objectId", label: "Bill ID" },
  amount: { required: true, type: "number", min: 0.01, label: "Amount" },
  payment_mode: {
    required: true,
    type: "string",
    enum: ["cash", "bank", "credit"],
    label: "Payment mode",
  },
  utr: { required: false, type: "string", max: 100, label: "UTR" },
  transaction_ref: {
    required: false,
    type: "string",
    max: 100,
    label: "Transaction reference",
  },
  remarks: { required: false, type: "string", max: 500, label: "Remarks" },
};

const purchaseTransactionSchema = {
  purchase_id: { required: true, type: "objectId", label: "Purchase ID" },
  amount: { required: true, type: "number", min: 0.01, label: "Amount" },
  payment_mode: {
    required: true,
    type: "string",
    enum: ["cash", "bank", "credit"],
    label: "Payment mode",
  },
  utr: { required: false, type: "string", max: 100, label: "UTR" },
  transaction_ref: {
    required: false,
    type: "string",
    max: 100,
    label: "Transaction reference",
  },
  remarks: { required: false, type: "string", max: 500, label: "Remarks" },
};

export const getTransactions = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.user._id,
    req.isGst,
    req.query,
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});

export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await transactionService.getTransactionById(
    req.params.transactionId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, transaction, "Transaction fetched successfully"),
    );
});

export const createSaleTransaction = asyncHandler(async (req, res) => {
  const data = validate(req.body, saleTransactionSchema);
  const transaction = await transactionService.createSaleTransaction(
    data,
    req.user._id,
    req.isGst,
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
  const data = validate(req.body, purchaseTransactionSchema);
  const transaction = await transactionService.createPurchaseTransaction(
    data,
    req.user._id,
    req.isGst,
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
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, summary, "Transaction summary fetched successfully"),
    );
});

export const getTransactionsByType = asyncHandler(async (req, res) => {
  const result = await transactionService.getTransactions(
    req.user._id,
    req.isGst,
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
    req.user._id,
    req.isGst,
    {
      ...req.query,
      payment_mode: req.params.mode,
    },
  );
  res
    .status(200)
    .json(new ApiResponse(200, result, "Transactions fetched successfully"));
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  await transactionService.deleteTransaction(
    req.params.transactionId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Transaction deleted successfully"));
});

export const getTransactionsByBill = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getTransactionsByBill(
    req.params.billId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, transactions, "Transactions fetched successfully"),
    );
});

export const getTransactionsByPurchase = asyncHandler(async (req, res) => {
  const transactions = await transactionService.getTransactionsByPurchase(
    req.params.purchaseId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(
      new ApiResponse(200, transactions, "Transactions fetched successfully"),
    );
});
