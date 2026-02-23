import Item from "../../models/master/item.model.js";
import { ApiError } from "../../utils/index.js";

class StockService {
  async deductStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      const quantity = item.quantity;

      const dbItem = await Item.findOneAndUpdate(
        { ...filter, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );

      if (!dbItem) {
        const existingItem = await Item.findOne(filter)
          .select("item_name stock")
          .lean();
        if (!existingItem) {
          throw ApiError.notFound(`Item ${item.item_id} not found`);
        }
        throw ApiError.badRequest(
          `Insufficient stock for item "${existingItem.item_name}". Available: ${existingItem.stock}, Required: ${quantity}`,
        );
      }
    }
  }

  async addStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      const dbItem = await Item.findOneAndUpdate(
        filter,
        { $inc: { stock: item.quantity } },
        { new: true },
      );

      if (!dbItem) {
        throw ApiError.notFound(`Item ${item.item_id} not found`);
      }
    }
  }

  async removeStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      const dbItem = await Item.findOneAndUpdate(
        filter,
        [
          {
            $set: {
              stock: {
                $max: [0, { $subtract: ["$stock", item.quantity] }],
              },
            },
          },
        ],
        { new: true },
      );

      if (!dbItem) continue;
    }
  }

  async restoreStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      const dbItem = await Item.findOneAndUpdate(
        filter,
        { $inc: { stock: item.quantity } },
        { new: true },
      );

      if (!dbItem) continue;
    }
  }
}

export default new StockService();
