import { itemService } from "../../services/index.js";
import { asyncHandler, ApiResponse } from "../../utils/index.js";

class ItemController {
  getItems = asyncHandler(async (req, res) => {
    const result = await itemService.getItems(
      req.user._id,
      req.query,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, result, "Items fetched successfully"));
  });

  getItemById = asyncHandler(async (req, res) => {
    const item = await itemService.getItemById(
      req.params.itemId,
      req.user._id,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, item, "Item fetched successfully"));
  });

  createItem = asyncHandler(async (req, res) => {
    const item = await itemService.createItem(
      req.body,
      req.user._id,
      req.file,
      req.isGst,
    );
    res
      .status(201)
      .json(new ApiResponse(201, item, "Item created successfully"));
  });

  updateItem = asyncHandler(async (req, res) => {
    const item = await itemService.updateItem(
      req.params.itemId,
      req.user._id,
      req.body,
      req.file,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, item, "Item updated successfully"));
  });

  deleteItem = asyncHandler(async (req, res) => {
    await itemService.deleteItem(req.params.itemId, req.user._id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Item deleted successfully"));
  });

  getLowStockItems = asyncHandler(async (req, res) => {
    const items = await itemService.getLowStockItems(
      req.user._id,
      req.query,
      req.isGst,
    );
    res
      .status(200)
      .json(
        new ApiResponse(200, items, "Low stock items fetched successfully"),
      );
  });

  updateStock = asyncHandler(async (req, res) => {
    const item = await itemService.updateStock(
      req.params.itemId,
      req.user._id,
      req.body,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, item, "Stock updated successfully"));
  });

  checkBarcodeUnique = asyncHandler(async (req, res) => {
    const result = await itemService.checkBarcodeUnique(req.body.barcode);
    res
      .status(200)
      .json(new ApiResponse(200, result, "Barcode check completed"));
  });
}

const itemController = new ItemController();

export const getItems = itemController.getItems;
export const getItemById = itemController.getItemById;
export const createItem = itemController.createItem;
export const updateItem = itemController.updateItem;
export const deleteItem = itemController.deleteItem;
export const getLowStockItems = itemController.getLowStockItems;
export const updateStock = itemController.updateStock;
export const checkBarcodeUnique = itemController.checkBarcodeUnique;

export default itemController;
