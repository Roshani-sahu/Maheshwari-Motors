import { itemService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const createItemSchema = {
  item_name: {
    required: true,
    type: "string",
    min: 1,
    max: 200,
    label: "Item name",
  },
  sale_rate: { required: true, type: "number", min: 0, label: "Sale rate" },
  purchase_rate: {
    required: false,
    type: "number",
    min: 0,
    label: "Purchase rate",
  },
  mrp_rate: { required: false, type: "number", min: 0, label: "MRP rate" },
  gst_percent: {
    required: false,
    type: "number",
    min: 0,
    label: "GST percent",
  },
  discount: { required: false, type: "number", min: 0, label: "Discount" },
  stock: { required: false, type: "number", min: 0, label: "Stock" },
  threshold: { required: false, type: "number", min: 0, label: "Threshold" },
  category_id: { required: false, type: "objectId", label: "Category ID" },
  brand_id: { required: false, type: "objectId", label: "Brand ID" },
  contact_id: { required: false, type: "objectId", label: "Contact ID" },
  is_gst: {
    required: false,
    type: "number",
    enum: [0, 1],
    label: "GST flag (1=GST, 0=non-GST)",
  },
};

const updateStockSchema = {
  stock: { required: false, type: "number", min: 0, label: "Stock" },
};

export const getItems = asyncHandler(async (req, res) => {
  const result = await itemService.getItems(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, result, "Items fetched successfully"));
});

export const getItemById = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.params.itemId, req.user._id);
  res.status(200).json(new ApiResponse(200, item, "Item fetched successfully"));
});

export const createItem = asyncHandler(async (req, res) => {
  const data = validate(req.body, createItemSchema);
  const item = await itemService.createItem(data, req.user._id, req.file);
  res.status(201).json(new ApiResponse(201, item, "Item created successfully"));
});

export const updateItem = asyncHandler(async (req, res) => {
  const data = validate(req.body, createItemSchema, { allowPartial: true });
  const item = await itemService.updateItem(
    req.params.itemId,
    req.user._id,
    data,
    req.file,
  );
  res.status(200).json(new ApiResponse(200, item, "Item updated successfully"));
});

export const deleteItem = asyncHandler(async (req, res) => {
  await itemService.deleteItem(req.params.itemId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, "Item deleted successfully"));
});

export const getLowStockItems = asyncHandler(async (req, res) => {
  const items = await itemService.getLowStockItems(req.user._id, req.query);
  res
    .status(200)
    .json(new ApiResponse(200, items, "Low stock items fetched successfully"));
});

export const updateStock = asyncHandler(async (req, res) => {
  const data = validate(req.body, updateStockSchema, { allowPartial: true });
  const item = await itemService.updateStock(
    req.params.itemId,
    req.user._id,
    data,
  );
  res
    .status(200)
    .json(new ApiResponse(200, item, "Stock updated successfully"));
});
