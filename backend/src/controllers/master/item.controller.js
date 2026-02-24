import { itemService } from "../../services/index.js";
import { asyncHandler, ApiResponse, validate } from "../../utils/index.js";

const createItemSchema = {
  item_name: { required: true, type: "string", min: 1, label: "Item name" },
  barcode: { required: false, type: "string", min: 10, max: 10, label: "Barcode" },
  item_id: { required: false, type: "number", min: 1, label: "Item ID" },
  sale_rate: { required: true, type: "number", min: 0, label: "Sale rate" },
  purchase_rate: { required: false, type: "number", min: 0, label: "Purchase rate" },
  mrp_rate: { required: false, type: "number", min: 0, label: "MRP rate" },
  gst_percent: { required: false, type: "number", min: 0, max: 100, label: "GST %" },
  discount: { required: false, type: "number", min: 0, max: 100, label: "Discount %" },
  stock: { required: false, type: "number", label: "Stock" },
  physical_stock: { required: false, type: "number", min: 0, label: "Physical stock" },
  logical_stock: { required: false, type: "number", label: "Logical stock" },
  threshold: { required: false, type: "number", min: 0, label: "Threshold" },
  is_gst: { required: false, type: "number", enum: [0, 1], label: "GST flag" },
  category_id: { required: false, type: "objectId", label: "Category" },
  brand_id: { required: false, type: "objectId", label: "Brand" },
  contact_id: { required: false, type: "objectId", label: "Contact" },
  dept_id: { required: false, type: "objectId", label: "Department" },
};

const updateStockSchema = {
  stock: { required: false, type: "number", label: "Stock" },
  physical_stock: { required: false, type: "number", min: 0, label: "Physical stock" },
  logical_stock: { required: false, type: "number", label: "Logical stock" },
};

class ItemController {
  getItems = asyncHandler(async (req, res) => {
    const result = await itemService.getItems(req.user._id, req.query, req.isGst);
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
    res.status(200).json(new ApiResponse(200, item, "Item fetched successfully"));
  });

  createItem = asyncHandler(async (req, res) => {
    const data = validate(req.body, createItemSchema);
    const item = await itemService.createItem(data, req.user._id, req.file, req.isGst);
    res.status(201).json(new ApiResponse(201, item, "Item created successfully"));
  });

  updateItem = asyncHandler(async (req, res) => {
    const data = validate(req.body, createItemSchema, { allowPartial: true });
    const item = await itemService.updateItem(
      req.params.itemId,
      req.user._id,
      data,
      req.file,
      req.isGst,
    );
    res.status(200).json(new ApiResponse(200, item, "Item updated successfully"));
  });

  deleteItem = asyncHandler(async (req, res) => {
    await itemService.deleteItem(req.params.itemId, req.user._id);
    res.status(200).json(new ApiResponse(200, null, "Item deleted successfully"));
  });

  getLowStockItems = asyncHandler(async (req, res) => {
    const items = await itemService.getLowStockItems(req.user._id, req.query, req.isGst);
    res
      .status(200)
      .json(new ApiResponse(200, items, "Low stock items fetched successfully"));
  });

  updateStock = asyncHandler(async (req, res) => {
    const data = validate(req.body, updateStockSchema, { allowPartial: true });
    const item = await itemService.updateStock(
      req.params.itemId,
      req.user._id,
      data,
      req.isGst,
    );
    res
      .status(200)
      .json(new ApiResponse(200, item, "Stock updated successfully"));
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

export default itemController;
