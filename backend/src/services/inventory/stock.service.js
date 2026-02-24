import Item from "../../models/master/item.model.js";
import { ApiError } from "../../utils/index.js";

class StockService {
  _buildFilter(itemId, ownerId) {
    const filter = { _id: itemId };
    if (ownerId) filter.user_id = ownerId;
    return filter;
  }

  async deductStock(items, ownerId, challanIsGst = 1) {
    for (const item of items) {
      const filter = this._buildFilter(item.item_id, ownerId);
      const quantity = Number(item.quantity) || 0;

      if (quantity <= 0) continue;

      if (challanIsGst === 1) {
        const dbItem = await Item.findOneAndUpdate(
          { ...filter, physical_stock: { $gte: quantity } },
          { $inc: { physical_stock: -quantity, stock: -quantity } },
          { new: true },
        );

        if (!dbItem) {
          const existingItem = await Item.findOne(filter)
            .select("item_name physical_stock")
            .lean();
          if (!existingItem) {
            throw ApiError.notFound(`Item ${item.item_id} not found`);
          }
          throw ApiError.badRequest(
            `Insufficient stock for item "${existingItem.item_name}". Available: ${existingItem.physical_stock || 0}, Required: ${quantity}`,
          );
        }
      } else {
        const dbItem = await Item.findOneAndUpdate(
          filter,
          { $inc: { logical_stock: -quantity } },
          { new: true },
        );

        if (!dbItem) {
          throw ApiError.notFound(`Item ${item.item_id} not found`);
        }
      }
    }
  }

  async addStock(items, ownerId, challanIsGst = 1) {
    for (const item of items) {
      const filter = this._buildFilter(item.item_id, ownerId);
      const quantity = Number(item.quantity) || 0;

      if (quantity <= 0) continue;

      const update =
        challanIsGst === 1 ?
          { $inc: { physical_stock: quantity, stock: quantity } }
        : { $inc: { logical_stock: quantity } };

      const dbItem = await Item.findOneAndUpdate(filter, update, { new: true });

      if (!dbItem) {
        throw ApiError.notFound(`Item ${item.item_id} not found`);
      }
    }
  }

  async removeStock(items, ownerId, challanIsGst = 1) {
    for (const item of items) {
      const filter = this._buildFilter(item.item_id, ownerId);
      const quantity = Number(item.quantity) || 0;

      if (quantity <= 0) continue;

      if (challanIsGst === 1) {
        await Item.findOneAndUpdate(
          filter,
          [
            {
              $set: {
                physical_stock: {
                  $max: [0, { $subtract: ["$physical_stock", quantity] }],
                },
                stock: {
                  $max: [0, { $subtract: ["$stock", quantity] }],
                },
              },
            },
          ],
          { new: true },
        );
      } else {
        await Item.findOneAndUpdate(
          filter,
          { $inc: { logical_stock: -quantity } },
          { new: true },
        );
      }
    }
  }

  async restoreStock(items, ownerId, challanIsGst = 1) {
    for (const item of items) {
      const filter = this._buildFilter(item.item_id, ownerId);
      const quantity = Number(item.quantity) || 0;

      if (quantity <= 0) continue;

      const update =
        challanIsGst === 1 ?
          { $inc: { physical_stock: quantity, stock: quantity } }
        : { $inc: { logical_stock: quantity } };

      await Item.findOneAndUpdate(filter, update, { new: true });
    }
  }
}

export default new StockService();
