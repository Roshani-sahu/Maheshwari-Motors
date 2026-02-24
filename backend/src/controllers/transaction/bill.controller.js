import { billService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const createBillSchema = {
  contact_id: { required: true, type: "objectId", label: "Contact ID" },
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
    label: "Delivered amount",
  },
  transport_id: {
    required: false,
    type: "objectId",
    label: "Transport ID",
  },
  customer_name: {
    required: false,
    type: "string",
    label: "Customer name",
  },
  vehicle_number: {
    required: false,
    type: "string",
    label: "Vehicle number",
  },
  transport_charge: {
    required: false,
    type: "number",
    min: 0,
    label: "Transport charge",
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

class BillController {
  getBills = asyncHandler(async (req, res) => {
    const result = await billService.getBills(req.user._id, req.isGst, req.query);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Bills fetched successfully"));
  });

  getBillById = asyncHandler(async (req, res) => {
    const bill = await billService.getBillById(
      req.params.billId,
      req.user._id,
      req.isGst,
    );
    res.status(200).json(new ApiResponse(200, bill, "Bill fetched successfully"));
  });

  createBill = asyncHandler(async (req, res) => {
    const data = validate(req.body, createBillSchema);
    const result = await billService.createBill(data, req.user._id, req.isGst);
    res
      .status(201)
      .json(new ApiResponse(201, result, "Bill created successfully"));
  });

  recordPayment = asyncHandler(async (req, res) => {
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

  handleReturn = asyncHandler(async (req, res) => {
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

  deleteBill = asyncHandler(async (req, res) => {
    await billService.deleteBill(req.params.billId, req.user._id, req.isGst);
    res.status(200).json(new ApiResponse(200, null, "Bill deleted successfully"));
  });

  getBillsByStatus = asyncHandler(async (req, res) => {
    const result = await billService.getBills(req.user._id, req.isGst, {
      ...req.query,
      payment_status: req.params.status,
    });
    res
      .status(200)
      .json(new ApiResponse(200, result, "Bills fetched successfully"));
  });

  getBillsForContact = asyncHandler(async (req, res) => {
    const result = await billService.getBillsForContact(
      req.params.contactId,
      req.user._id,
      req.isGst,
      req.query,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Bills fetched successfully"));
  });

  getBillSummary = asyncHandler(async (req, res) => {
    const result = await billService.getBillSummary(req.user._id, req.isGst);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Bill summary fetched successfully"));
  });
}

const billController = new BillController();

export const getBills = billController.getBills;
export const getBillById = billController.getBillById;
export const createBill = billController.createBill;
export const recordPayment = billController.recordPayment;
export const handleReturn = billController.handleReturn;
export const deleteBill = billController.deleteBill;
export const getBillsByStatus = billController.getBillsByStatus;
export const getBillsForContact = billController.getBillsForContact;
export const getBillSummary = billController.getBillSummary;

export default billController;
