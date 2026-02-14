import Item from "../../models/master/item.model.js";
import StockAlert from "../../models/inventory/stockAlert.model.js";
import { ApiError } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class StockService {
  async deductStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      const quantity = item.quantity;

      // Atomic check-and-deduct: only succeeds if stock >= quantity
      const dbItem = await Item.findOneAndUpdate(
        { ...filter, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true },
      );

      if (!dbItem) {
        // Distinguish between item not found vs insufficient stock
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

      await this.checkAndCreateStockAlert(dbItem, ownerId);
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

      await this.resolveStockAlert(dbItem, ownerId);
    }
  }

  async removeStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;

      // Use aggregation pipeline update to clamp stock at 0
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

      await this.checkAndCreateStockAlert(dbItem, ownerId);
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

      await this.resolveStockAlert(dbItem, ownerId);
    }
  }

  async checkAndCreateStockAlert(item, ownerId) {
    if (item.stock < item.threshold) {
      const existingAlert = await StockAlert.findOne({
        item_id: item._id,
        user_id: ownerId,
        is_resolved: false,
      });

      if (!existingAlert) {
        const nextId = await getNextId("StockAlert", ownerId);
        await StockAlert.create({
          id: nextId,
          item_id: item._id,
          stock_count: item.stock,
          threshold: item.threshold,
          user_id: ownerId,
        });
      }
    }
  }

  async resolveStockAlert(item, ownerId) {
    if (item.stock >= item.threshold) {
      await StockAlert.updateMany(
        { item_id: item._id, user_id: ownerId, is_resolved: false },
        { is_resolved: true },
      );
    }
  }
}

export default new StockService();
