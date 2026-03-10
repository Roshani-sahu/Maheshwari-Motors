import { billService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

class BillController {
  getBills = asyncHandler(async (req, res) => {
    const result = await billService.getBills(
      req.user._id,
      req.isGst,
      req.query,
    );
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
    res
      .status(200)
      .json(new ApiResponse(200, bill, "Bill fetched successfully"));
  });

  createBill = asyncHandler(async (req, res) => {
    const result = await billService.createBill(
      req.body,
      req.user._id,
      req.isGst,
    );
    res
      .status(201)
      .json(new ApiResponse(201, result, "Bill created successfully"));
  });

  batchConvert = asyncHandler(async (req, res) => {
    const { challan_ids } = req.body;
    const result = await billService.batchConvertChallans(
      challan_ids,
      req.user._id,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          `${result.total_bills_created} bill(s) created successfully`,
        ),
      );
  });

  settleBills = asyncHandler(async (req, res) => {
    const result = await billService.settleBills(
      req.body,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, result, "Bill settlement recorded successfully"),
      );
  });

  recordPayment = asyncHandler(async (req, res) => {
    const bill = await billService.recordPayment(
      req.params.billId,
      req.user._id,
      req.isGst,
      req.body,
    );
    res
      .status(200)
      .json(new ApiResponse(200, bill, "Payment recorded successfully"));
  });

  handleReturn = asyncHandler(async (req, res) => {
    const party = await billService.handleReturn(
      req.params.billId,
      req.user._id,
      req.isGst,
      req.body,
    );
    res
      .status(200)
      .json(new ApiResponse(200, party, "Return processed successfully"));
  });

  deleteBill = asyncHandler(async (req, res) => {
    await billService.deleteBill(req.params.billId, req.user._id, req.isGst);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Bill deleted successfully"));
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

  getLastSoldItem = asyncHandler(async (req, res) => {
    const result = await billService.getLastSoldItem(
      req.params.itemId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          "Last sold item details fetched successfully",
        ),
      );
  });

  checkBillNoUnique = asyncHandler(async (req, res) => {
    const result = await billService.checkBillNoUnique(
      req.body.bill_no,
      req.isGst,
      req.user._id,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Bill number check completed"));
  });
}

const billController = new BillController();

export const getBills = billController.getBills;
export const getBillById = billController.getBillById;
export const createBill = billController.createBill;
export const batchConvert = billController.batchConvert;
export const settleBills = billController.settleBills;
export const recordPayment = billController.recordPayment;
export const handleReturn = billController.handleReturn;
export const deleteBill = billController.deleteBill;
export const getBillsByStatus = billController.getBillsByStatus;
export const getBillsForContact = billController.getBillsForContact;
export const getBillSummary = billController.getBillSummary;
export const getLastSoldItem = billController.getLastSoldItem;
export const checkBillNoUnique = billController.checkBillNoUnique;

export default billController;
