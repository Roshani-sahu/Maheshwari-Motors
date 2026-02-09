import Item from "../models/item.model.js";
import StockAlert from "../models/stockAlert.model.js";
import { ApiError } from "../utils/index.js";

class StockService {
  async deductStock(items, firmType, userId) {
    for (const item of items) {
      const dbItem = await Item.findOne({ _id: item.item_id, user_id: userId });

      if (!dbItem) {
        throw ApiError.notFound(`Item ${item.item_id} not found`);
      }

      const quantity = item.quantity;

      if (firmType === "GST") {
        if (dbItem.gst_stock < quantity) {
          throw ApiError.badRequest(
            `Insufficient GST stock for item "${dbItem.item_name}". Available: ${dbItem.gst_stock}, Required: ${quantity}`,
          );
        }
        dbItem.gst_stock -= quantity;
      } else {
        const virtualAvailable =
          dbItem.gst_stock + dbItem.nongst_stock - dbItem.nongst_sold;

        if (virtualAvailable < quantity) {
          throw ApiError.badRequest(
            `Insufficient stock for item "${dbItem.item_name}". Available for NON_GST: ${virtualAvailable}, Required: ${quantity}`,
          );
        }
        dbItem.nongst_sold += quantity;
      }

      await dbItem.save();
      await this.checkAndCreateStockAlert(dbItem, userId);
    }
  }

  async addStock(items, purchaseType, userId) {
    for (const item of items) {
      const dbItem = await Item.findOne({ _id: item.item_id, user_id: userId });

      if (!dbItem) {
        throw ApiError.notFound(`Item ${item.item_id} not found`);
      }

      const quantity = item.quantity;

      if (purchaseType === "GST") {
        dbItem.gst_stock += quantity;
      } else {
        dbItem.nongst_stock += quantity;
      }

      await dbItem.save();
      await this.resolveStockAlert(dbItem, userId);
    }
  }

  async removeStock(items, purchaseType, userId) {
    for (const item of items) {
      const dbItem = await Item.findOne({ _id: item.item_id, user_id: userId });

      if (!dbItem) continue;

      const quantity = item.quantity;

      if (purchaseType === "GST") {
        dbItem.gst_stock = Math.max(0, dbItem.gst_stock - quantity);
      } else {
        dbItem.nongst_stock = Math.max(0, dbItem.nongst_stock - quantity);
      }

      await dbItem.save();
      await this.checkAndCreateStockAlert(dbItem, userId);
    }
  }

  async restoreStock(items, firmType, userId) {
    for (const item of items) {
      const dbItem = await Item.findOne({ _id: item.item_id, user_id: userId });

      if (!dbItem) continue;

      const quantity = item.quantity;

      if (firmType === "GST") {
        dbItem.gst_stock += quantity;
      } else {
        dbItem.nongst_sold = Math.max(0, dbItem.nongst_sold - quantity);
      }

      await dbItem.save();
      await this.resolveStockAlert(dbItem, userId);
    }
  }

  async checkAndCreateStockAlert(item, userId) {
    const physicalStock = item.gst_stock + item.nongst_stock;

    if (physicalStock < item.threshold) {
      const existingAlert = await StockAlert.findOne({
        item_id: item._id,
        user_id: userId,
        is_resolved: false,
      });

      if (!existingAlert) {
        await StockAlert.create({
          item_id: item._id,
          stock_count: physicalStock,
          threshold: item.threshold,
          user_id: userId,
        });
      }
    }
  }

  async resolveStockAlert(item, userId) {
    const physicalStock = item.gst_stock + item.nongst_stock;

    if (physicalStock >= item.threshold) {
      await StockAlert.updateMany(
        { item_id: item._id, user_id: userId, is_resolved: false },
        { is_resolved: true },
      );
    }
  }
}

export default new StockService();
