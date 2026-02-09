import StockAlert from "../models/stockAlert.model.js";
import { Pagination } from "../utils/index.js";

class StockAlertService {
  async getAlerts(userId, query) {
    const filter = { user_id: userId };
    if (query.is_resolved !== undefined)
      filter.is_resolved = query.is_resolved === "true";

    return Pagination.paginate(StockAlert, filter, {
      ...query,
      populate: {
        path: "item_id",
        select: "item_name gst_stock nongst_stock nongst_sold threshold",
      },
      sort: { createdAt: -1 },
    });
  }

  async getUnresolvedCount(userId) {
    return StockAlert.countDocuments({ user_id: userId, is_resolved: false });
  }

  async getLowStockItems(userId) {
    const alerts = await StockAlert.find({
      user_id: userId,
      is_resolved: false,
    }).populate(
      "item_id",
      "item_name gst_stock nongst_stock nongst_sold threshold image",
    );

    return alerts.map((alert) => ({
      _id: alert.item_id._id,
      item_name: alert.item_id.item_name,
      gst_stock: alert.item_id.gst_stock,
      nongst_stock: alert.item_id.nongst_stock,
      nongst_sold: alert.item_id.nongst_sold,
      physical_stock: alert.item_id.gst_stock + alert.item_id.nongst_stock,
      nongst_available:
        alert.item_id.gst_stock +
        alert.item_id.nongst_stock -
        alert.item_id.nongst_sold,
      threshold: alert.item_id.threshold,
      image: alert.item_id.image,
      alert_created_at: alert.createdAt,
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
