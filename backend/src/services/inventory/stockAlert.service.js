import StockAlert from "../../models/inventory/stockAlert.model.js";
import Item from "../../models/master/item.model.js";
import { Pagination } from "../../utils/index.js";

class StockAlertService {
  async getAlerts(userId, query) {
    const filter = { user_id: userId };
    if (query.is_resolved !== undefined)
      filter.is_resolved = query.is_resolved === "true";

    return Pagination.paginate(StockAlert, filter, {
      ...query,
      populate: {
        path: "item_id",
        select: "item_name stock threshold",
      },
      sort: { createdAt: -1 },
    });
  }

  async getUnresolvedCount(userId) {
    return Item.countDocuments({
      user_id: userId,
      $expr: { $lt: ["$stock", "$threshold"] },
    });
  }

  async getLowStockItems(userId) {
    const items = await Item.find({
      user_id: userId,
      $expr: { $lt: ["$stock", "$threshold"] },
    })
      .select("item_name stock threshold image")
      .sort({ stock: 1 })
      .lean();

    return items.map((item) => ({
      _id: item._id,
      item_name: item.item_name,
      stock: item.stock,
      threshold: item.threshold,
      image: item.image,
    }));
  }

  async resolveAlert(alertId, userId) {
    const alert = await StockAlert.findOneAndUpdate(
      { _id: alertId, user_id: userId },
      { is_resolved: true },
      { new: true },
    );
    return alert;
  }
}

export default new StockAlertService();
