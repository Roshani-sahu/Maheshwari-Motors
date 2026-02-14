import Item from "../../models/master/item.model.js";
import Brand from "../../models/master/brand.model.js";
import StockAlert from "../../models/inventory/stockAlert.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";
import s3Service from "../common/s3.service.js";

class ItemService {
  async getItems(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.item_name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Item, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getItemById(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }
    return item;
  }

  async createItem(itemData, userId, file = null) {
    let imageUrl = null;

    if (file) {
      imageUrl = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "items",
      );
    }

    const nextId = await getNextId("Item", userId);

    const item = await Item.create({
      ...itemData,
      id: nextId,
      image: imageUrl,
      user_id: userId,
    });

    if (itemData.brand_id) {
      await Brand.findByIdAndUpdate(itemData.brand_id, {
        $addToSet: { item_ids: item._id },
      });
    }

    return item;
  }

  async updateItem(itemId, userId, updateData, file = null) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (file) {
      if (item.image) {
        await s3Service.deleteFile(item.image);
      }
      updateData.image = await s3Service.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        "items",
      );
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, updateData, {
      new: true,
    });
    return updatedItem;
  }

  async deleteItem(itemId, userId) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (item.image) {
      await s3Service.deleteFile(item.image);
    }

    await Promise.all([
      StockAlert.deleteMany({ item_id: itemId, user_id: userId }),
      Brand.updateMany(
        { item_ids: itemId, user_id: userId },
        { $pull: { item_ids: itemId } },
      ),
    ]);

    await Item.findByIdAndDelete(itemId);
  }

  async updateStock(itemId, userId, stockData) {
    const item = await Item.findOne({ _id: itemId, user_id: userId });
    if (!item) {
      throw ApiError.notFound("Item not found");
    }

    if (stockData.stock !== undefined) item.stock = stockData.stock;

    await item.save();
    return item;
  }

  async getLowStockItems(userId) {
    return Item.find({
      user_id: userId,
      $expr: { $lt: ["$stock", "$threshold"] },
    }).lean();
  }
}

export default new ItemService();
