import Item from "../models/item.model.js";
import StockAlert from "../models/stockAlert.model.js";
import { ApiError } from "../utils/index.js";

class StockService {
  /**
   * Deduct stock for a GST sale.
   * Only called when selling through GST firm (is_gst=1 challan).
   * Always deducts from gst_stock. NON_GST sales never call this.
   */
  async deductStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;
      const dbItem = await Item.findOne(filter);

      if (!dbItem) {
        throw ApiError.notFound(`Item ${item.item_id} not found`);
      }

      const quantity = item.quantity;

      if (dbItem.gst_stock < quantity) {
        throw ApiError.badRequest(
          `Insufficient GST stock for item "${dbItem.item_name}". Available: ${dbItem.gst_stock}, Required: ${quantity}`,
        );
      }

      dbItem.gst_stock -= quantity;
      await dbItem.save();
      await this.checkAndCreateStockAlert(dbItem, ownerId);
    }
  }

  async addStock(items, purchaseType, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;
      const dbItem = await Item.findOne(filter);

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
      await this.resolveStockAlert(dbItem, ownerId);
    }
  }

  async removeStock(items, purchaseType, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;
      const dbItem = await Item.findOne(filter);

      if (!dbItem) continue;

      const quantity = item.quantity;

      if (purchaseType === "GST") {
        dbItem.gst_stock = Math.max(0, dbItem.gst_stock - quantity);
      } else {
        dbItem.nongst_stock = Math.max(0, dbItem.nongst_stock - quantity);
      }

      await dbItem.save();
      await this.checkAndCreateStockAlert(dbItem, ownerId);
    }
  }

  /**
   * Restore stock after GST challan deletion/update.
   * Only called for GST challans. Always restores to gst_stock.
   */
  async restoreStock(items, ownerId) {
    for (const item of items) {
      const filter = { _id: item.item_id };
      if (ownerId) filter.user_id = ownerId;
      const dbItem = await Item.findOne(filter);

      if (!dbItem) continue;

      dbItem.gst_stock += item.quantity;
      await dbItem.save();
      await this.resolveStockAlert(dbItem, ownerId);
    }
  }

  async checkAndCreateStockAlert(item, ownerId) {
    const physicalStock = item.gst_stock + item.nongst_stock;

    if (physicalStock < item.threshold) {
      const existingAlert = await StockAlert.findOne({
        item_id: item._id,
        user_id: ownerId,
        is_resolved: false,
      });

      if (!existingAlert) {
        await StockAlert.create({
          item_id: item._id,
          stock_count: physicalStock,
          threshold: item.threshold,
          user_id: ownerId,
        });
      }
    }
  }

  async resolveStockAlert(item, ownerId) {
    const physicalStock = item.gst_stock + item.nongst_stock;

    if (physicalStock >= item.threshold) {
      await StockAlert.updateMany(
        { item_id: item._id, user_id: ownerId, is_resolved: false },
        { is_resolved: true },
      );
    }
  }
}

export default new StockService();
