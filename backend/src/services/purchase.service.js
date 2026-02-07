import Purchase from "../models/purchase.model.js";
import Firm from "../models/firm.model.js";
import { ApiError, Pagination } from "../utils/index.js";
import stockService from "./stock.service.js";

class PurchaseService {
  async getPurchases(firmId, userId, query) {
    const filter = { firm_id: firmId, user_id: userId };

    if (query.supplier_id) filter.supplier_id = query.supplier_id;
    if (query.purchase_type) filter.purchase_type = query.purchase_type;
    if (query.payment_status) filter.payment_status = query.payment_status;

    return Pagination.paginate(Purchase, filter, {
      ...query,
      populate: [
        { path: "supplier_id", select: "name phone" },
        { path: "items.item_id", select: "item_name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getPurchaseById(purchaseId, firmId, userId) {
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      firm_id: firmId,
      user_id: userId,
    })
      .populate("supplier_id")
      .populate("items.item_id");

    if (!purchase) {
      throw ApiError.notFound("Purchase not found");
    }
    return purchase;
  }

  async createPurchase(purchaseData, firmId, userId) {
    const { items, supplier_id, purchase_type, date } = purchaseData;

    const firm = await Firm.findById(firmId);
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    const purchaseCount = await Purchase.countDocuments({ firm_id: firmId });
    const purchase_no = `PO-${String(purchaseCount + 1).padStart(6, "0")}`;

    let totalAmount = 0;
    const processedItems = items.map((item) => {
      const amount = item.quantity * item.rate;
      totalAmount += amount;
      return {
        item_id: item.item_id,
        quantity: item.quantity,
        rate: item.rate,
        amount,
      };
    });

    await stockService.addStock(items, purchase_type, userId);

    const purchase = await Purchase.create({
      purchase_no,
      supplier_id,
      date: date || new Date(),
      items: processedItems,
      purchase_type,
      amount: totalAmount,
      firm_id: firmId,
      user_id: userId,
    });

    return purchase.populate([
      { path: "supplier_id", select: "name" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }

  async recordPayment(purchaseId, firmId, userId, amount) {
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      firm_id: firmId,
      user_id: userId,
    });

    if (!purchase) {
      throw ApiError.notFound("Purchase not found");
    }

    const newPaidAmount = purchase.paid_amount + amount;
    let paymentStatus;

    if (newPaidAmount < purchase.amount) {
      paymentStatus = "due";
    } else if (newPaidAmount === purchase.amount) {
      paymentStatus = "paid";
    } else {
      paymentStatus = "overpaid";
    }

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      { paid_amount: newPaidAmount, payment_status: paymentStatus },
      { new: true },
    ).populate("supplier_id", "name");

    return updatedPurchase;
  }

  async deletePurchase(purchaseId, firmId, userId) {
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      firm_id: firmId,
      user_id: userId,
    });

    if (!purchase) {
      throw ApiError.notFound("Purchase not found");
    }

    await stockService.removeStock(
      purchase.items,
      purchase.purchase_type,
      userId,
    );
    await Purchase.findByIdAndDelete(purchaseId);
  }
}

export default new PurchaseService();
