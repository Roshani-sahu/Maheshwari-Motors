import { challanService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

class ChallanController {
  getAllChallans = asyncHandler(async (req, res) => {
    const result = await challanService.getChallans(
      req.user._id,
      req.isGst,
      null,
      req.query,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Challans fetched successfully"));
  });

  getChallans = asyncHandler(async (req, res) => {
    const challanType = req.params.challanType;
    const result = await challanService.getChallans(
      req.user._id,
      req.isGst,
      challanType,
      req.query,
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          `${challanType} challans fetched successfully`,
        ),
      );
  });

  getChallanById = asyncHandler(async (req, res) => {
    const challan = await challanService.getChallanById(
      req.params.challanId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, challan, "Challan fetched successfully"));
  });

  createChallan = asyncHandler(async (req, res) => {
    const { challan_type, ...challanData } = req.body;
    const challan = await challanService.createChallan(
      challanData,
      req.user._id,
      req.isGst,
      challan_type,
    );
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          challan,
          `${challan_type} challan created successfully`,
        ),
      );
  });

  updateChallan = asyncHandler(async (req, res) => {
    const challan = await challanService.updateChallan(
      req.params.challanId,
      req.user._id,
      req.isGst,
      req.body,
    );
    res
      .status(200)
      .json(new ApiResponse(200, challan, "Challan updated successfully"));
  });

  deleteChallan = asyncHandler(async (req, res) => {
    await challanService.deleteChallan(
      req.params.challanId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, null, "Challan deleted successfully"));
  });

  getUnconvertedChallansForContact = asyncHandler(async (req, res) => {
    const challans = await challanService.getUnconvertedChallansForContact(
      req.params.contactId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, challans, "Challans fetched successfully"));
  });

  getLastSoldItem = asyncHandler(async (req, res) => {
    const result = await challanService.getLastSoldItem(
      req.params.itemId,
      req.user._id,
    );
    if (!result) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No sale record found for this item"));
    }
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

  recordPayment = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const challan = await challanService.recordPayment(
      req.params.challanId,
      req.user._id,
      amount,
    );
    res
      .status(200)
      .json(new ApiResponse(200, challan, "Payment recorded successfully"));
  });
}

const challanController = new ChallanController();

export const getAllChallans = challanController.getAllChallans;
export const getChallans = challanController.getChallans;
export const getChallanById = challanController.getChallanById;
export const createChallan = challanController.createChallan;
export const updateChallan = challanController.updateChallan;
export const deleteChallan = challanController.deleteChallan;
export const getUnconvertedChallansForContact =
  challanController.getUnconvertedChallansForContact;
export const getLastSoldItem = challanController.getLastSoldItem;
export const recordPayment = challanController.recordPayment;

export default challanController;
