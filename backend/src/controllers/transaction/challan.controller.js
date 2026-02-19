import { challanService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const challanItemSchema = {
  item_id: { required: true, type: "objectId", label: "Item ID" },
  quantity: { required: true, type: "number", min: 1, label: "Quantity" },
  rate: { required: true, type: "number", min: 0, label: "Rate" },
  discount: { required: false, type: "number", min: 0, label: "Discount %" },
  special_discount: {
    required: false,
    type: "number",
    min: 0,
    label: "Special Discount %",
  },
  discount_amount: {
    required: false,
    type: "number",
    min: 0,
    label: "Discount Amount",
  },
  gst_percent: {
    required: false,
    type: "number",
    min: 0,
    label: "GST %",
  },
  is_gst: {
    required: false,
    type: "number",
    enum: [0, 1],
    label: "GST flag",
  },
};

const createChallanSchema = {
  challan_type: {
    required: true,
    type: "string",
    enum: ["sale", "purchase"],
    label: "Challan type",
  },
  date: { required: false, type: "date", label: "Date" },
  contact_id: { required: true, type: "objectId", label: "Contact ID" },
  items: {
    required: true,
    type: "array",
    min: 1,
    items: challanItemSchema,
    label: "Items",
  },
  discount: { required: false, type: "number", min: 0, label: "Discount" },
  is_gst: {
    required: false,
    type: "number",
    enum: [0, 1],
    label: "GST flag",
  },
};

const updateChallanSchema = {
  date: { required: false, type: "date", label: "Date" },
  contact_id: { required: false, type: "objectId", label: "Contact ID" },
  items: {
    required: false,
    type: "array",
    min: 1,
    items: challanItemSchema,
    label: "Items",
  },
  discount: { required: false, type: "number", min: 0, label: "Discount" },
};

const paymentSchema = {
  amount: {
    required: true,
    type: "number",
    min: 0.01,
    label: "Payment amount",
  },
};



export const getChallans = asyncHandler(async (req, res) => {
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

export const getChallanById = asyncHandler(async (req, res) => {
  const challan = await challanService.getChallanById(
    req.params.challanId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan fetched successfully"));
});

export const createChallan = asyncHandler(async (req, res) => {
  const data = validate(req.body, createChallanSchema);
  const { challan_type, ...challanData } = data;
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

export const updateChallan = asyncHandler(async (req, res) => {
  const data = validate(req.body, updateChallanSchema, { allowPartial: true });
  const challan = await challanService.updateChallan(
    req.params.challanId,
    req.user._id,
    req.isGst,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Challan updated successfully"));
});

export const deleteChallan = asyncHandler(async (req, res) => {
  await challanService.deleteChallan(
    req.params.challanId,
    req.user._id,
    req.isGst,
  );
  res
    .status(200)
    .json(new ApiResponse(200, null, "Challan deleted successfully"));
});

export const getUnconvertedChallansForContact = asyncHandler(
  async (req, res) => {
    const challans = await challanService.getUnconvertedChallansForContact(
      req.params.contactId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, challans, "Challans fetched successfully"));
  },
);

export const recordPayment = asyncHandler(async (req, res) => {
  const { amount } = validate(req.body, paymentSchema);
  const challan = await challanService.recordPayment(
    req.params.challanId,
    req.user._id,
    amount,
  );
  res
    .status(200)
    .json(new ApiResponse(200, challan, "Payment recorded successfully"));
});
