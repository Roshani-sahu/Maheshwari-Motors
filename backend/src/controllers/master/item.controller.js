import { itemService } from "../../services/index.js";
import challanService from "../../services/transaction/challan.service.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

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

export const getLastSoldItem = asyncHandler(async (req, res) => {
  const data = await challanService.getLastSoldItem(req.params.itemId, req.user._id);
  res.status(200).json(new ApiResponse(200, data, "Last sold item fetched successfully"));
});
