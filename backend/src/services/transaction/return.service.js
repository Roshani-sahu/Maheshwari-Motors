import mongoose from "mongoose";
import Return from "../../models/transaction/return.model.js";
import Bill from "../../models/transaction/bill.model.js";
import Challan from "../../models/transaction/challan.model.js";
import Contact from "../../models/master/contact.model.js";
import Item from "../../models/master/item.model.js";
import stockService from "../inventory/stock.service.js";
import { ApiError, Pagination, toNumber } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

const RETURN_POPULATE = [
  { path: "contact_id", select: "name phone type balance" },
  { path: "bill_id", select: "bill_no amount paid_amount payment_status" },
  { path: "challan_id", select: "challan_no amount challan_type" },
  {
    path: "items.item_id",
    select:
      "item_name alias description hsn_id barcode sale_rate physical_stock logical_stock",
  },
];

class ReturnService {
  _round(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  _getDamageCounts(items = []) {
    let damaged_count = 0;
    let not_damaged_count = 0;
    let damaged_quantity = 0;
    let not_damaged_quantity = 0;

    for (const item of items) {
      const qty = Number(item.quantity) || 0;
      if (item.is_damaged) {
        damaged_count++;
        damaged_quantity += qty;
      } else {
        not_damaged_count++;
        not_damaged_quantity += qty;
      }
    }

    return {
      damaged_count,
      not_damaged_count,
      damaged_quantity,
      not_damaged_quantity,
    };
  }

  _attachDamageCounts(doc) {
    const obj = doc.toJSON ? doc.toJSON() : { ...doc };
    return { ...obj, ...this._getDamageCounts(obj.items) };
  }

  _processReturnItems(items) {
    return items.map((item, idx) => {
      const qty = toNumber(item.quantity ?? 1, `items[${idx}].quantity`, {
        min: 1,
      });
      const rate = toNumber(item.rate, `items[${idx}].rate`, { min: 0 });
      const grossAmount = qty * rate;
      const disc = toNumber(item.discount ?? 0, `items[${idx}].discount`, {
        min: 0,
        max: 100,
      });
      const spDisc = toNumber(
        item.special_discount ?? 0,
        `items[${idx}].special_discount`,
        { min: 0, max: 100 },
      );
      const gstPct = toNumber(
        item.gst_percent ?? 0,
        `items[${idx}].gst_percent`,
        { min: 0, max: 100 },
      );

      const afterDisc = grossAmount * (1 - disc / 100);
      const afterSpDisc = afterDisc * (1 - spDisc / 100);
      const taxableAmount = this._round(afterSpDisc);
      const gstAmount = this._round(taxableAmount * (gstPct / 100));
      const finalAmount = this._round(taxableAmount + gstAmount);

      return {
        item_id: item.item_id,
        quantity: qty,
        rate,
        discount: disc,
        special_discount: spDisc,
        gst_percent: gstPct,
        gst_amount: gstAmount,
        taxable_amount: taxableAmount,
        amount: finalAmount,
        is_damaged: item.is_damaged === true,
        is_gst: item.is_gst ?? 1,
      };
    });
  }

  async getReturns(userId, isGst, query) {
    const filter = { user_id: userId, is_gst: isGst };

    if (query.return_type) filter.return_type = query.return_type;
    if (query.contact_id) filter.contact_id = query.contact_id;
    if (query.bill_id) filter.bill_id = query.bill_id;
    if (query.challan_id) filter.challan_id = query.challan_id;

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    const result = await Pagination.paginate(Return, filter, {
      ...query,
      populate: RETURN_POPULATE,
      sort: { createdAt: -1 },
    });

    if (result.docs) {
      result.docs = result.docs.map((d) => this._attachDamageCounts(d));
    } else if (Array.isArray(result.data)) {
      result.data = result.data.map((d) => this._attachDamageCounts(d));
    }

    return result;
  }

  async getReturnById(returnId, userId, isGst) {
    const doc = await Return.findOne({
      _id: returnId,
      user_id: userId,
      is_gst: isGst,
    }).populate(RETURN_POPULATE);

    if (!doc) throw ApiError.notFound("Return not found");
    return this._attachDamageCounts(doc);
  }

  async createSaleReturn(data, userId, isGst) {
    const { bill_id, items, note, date } = data;

    if (!bill_id) {
      throw ApiError.badRequest("bill_id is required for sale return");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    const bill = await Bill.findOne({
      _id: bill_id,
      user_id: userId,
      is_gst: isGst,
    }).populate({
      path: "challan_ids",
      select: "items",
    });

    if (!bill) throw ApiError.notFound("Bill not found");

    // Build a map of item_id → total billed quantity from all challans
    const billedItemMap = new Map();
    for (const challan of bill.challan_ids || []) {
      for (const line of challan.items || []) {
        const key = String(line.item_id?._id || line.item_id);
        const existing = billedItemMap.get(key) || 0;
        billedItemMap.set(key, existing + (line.quantity || 0));
      }
    }

    // Check already-returned quantities against this bill
    const existingReturns = await Return.find({
      bill_id,
      user_id: userId,
      return_type: "sale_return",
    })
      .select("items")
      .lean();

    const returnedItemMap = new Map();
    for (const ret of existingReturns) {
      for (const line of ret.items || []) {
        const key = String(line.item_id);
        const existing = returnedItemMap.get(key) || 0;
        returnedItemMap.set(key, existing + (line.quantity || 0));
      }
    }

    // Validate item IDs exist in user's inventory
    const itemIds = [...new Set(items.map((i) => String(i.item_id)))];
    const dbItems = await Item.find({
      _id: { $in: itemIds },
      user_id: userId,
    })
      .select("_id item_name")
      .lean();

    if (dbItems.length !== itemIds.length) {
      throw ApiError.badRequest(
        "One or more items are invalid or do not belong to your account",
      );
    }

    // Validate returned quantities do not exceed billed - already returned
    for (const item of items) {
      const key = String(item.item_id);
      const billedQty = billedItemMap.get(key) || 0;
      const alreadyReturned = returnedItemMap.get(key) || 0;
      const returnableQty = billedQty - alreadyReturned;
      const requestedQty = Number(item.quantity) || 0;

      if (billedQty === 0) {
        throw ApiError.badRequest(
          `Item '${key}' was not part of this bill's challans`,
        );
      }

      if (requestedQty > returnableQty) {
        throw ApiError.badRequest(
          `Return quantity for item '${key}' exceeds returnable quantity. Billed: ${billedQty}, Already returned: ${alreadyReturned}, Requested: ${requestedQty}`,
        );
      }
    }

    const processedItems = this._processReturnItems(items);
    const totalAmount = this._round(
      processedItems.reduce((sum, i) => sum + i.amount, 0),
    );

    // Stock operations: restore stock for non-damaged items
    const nonDamagedItems = processedItems.filter((i) => !i.is_damaged);
    if (nonDamagedItems.length > 0) {
      // Sale return → items come back to us → restore (add) stock
      await stockService.restoreStock(nonDamagedItems, userId, isGst);
    }

    // Reduce bill amount and adjust payment status
    const newBillAmount = this._round(bill.amount - totalAmount);
    const paidAmount = bill.paid_amount || 0;
    let paymentStatus;
    if (Math.abs(paidAmount - newBillAmount) < 0.01) {
      paymentStatus = "paid";
    } else if (paidAmount < newBillAmount) {
      paymentStatus = "due";
    } else {
      paymentStatus = "overpaid";
    }

    await Bill.findByIdAndUpdate(bill_id, {
      amount: Math.max(0, newBillAmount),
      payment_status: paymentStatus,
      $inc: { return_amount: totalAmount },
    });

    // Credit return amount to contact balance
    await Contact.findByIdAndUpdate(bill.contact_id, {
      $inc: { balance: totalAmount },
    });

    // Generate return number
    const seqKey = `ReturnNo_${isGst === 1 ? "GST" : "NONGST"}`;
    const returnNoSeq = await getNextId(seqKey, userId);
    const return_no = `SR-${String(returnNoSeq).padStart(6, "0")}`;
    const nextId = await getNextId("Return", userId);

    const returnDoc = await Return.create({
      id: nextId,
      return_no,
      return_type: "sale_return",
      date: date || new Date(),
      contact_id: bill.contact_id,
      bill_id,
      items: processedItems,
      total_amount: totalAmount,
      note: note || "",
      is_gst: isGst,
      user_id: userId,
    });

    await returnDoc.populate(RETURN_POPULATE);
    return this._attachDamageCounts(returnDoc);
  }

  async createPurchaseReturn(data, userId, isGst) {
    const { challan_id, items, note, date } = data;

    if (!challan_id) {
      throw ApiError.badRequest("challan_id is required for purchase return");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    const challan = await Challan.findOne({
      _id: challan_id,
      user_id: userId,
      is_gst: isGst,
      challan_type: "purchase",
    });

    if (!challan) throw ApiError.notFound("Purchase challan not found");

    // Build a map of item_id → purchased quantity from challan
    const purchasedItemMap = new Map();
    for (const line of challan.items || []) {
      const key = String(line.item_id?._id || line.item_id);
      const existing = purchasedItemMap.get(key) || 0;
      purchasedItemMap.set(key, existing + (line.quantity || 0));
    }

    // Check already-returned quantities against this challan
    const existingReturns = await Return.find({
      challan_id,
      user_id: userId,
      return_type: "purchase_return",
    })
      .select("items")
      .lean();

    const returnedItemMap = new Map();
    for (const ret of existingReturns) {
      for (const line of ret.items || []) {
        const key = String(line.item_id);
        const existing = returnedItemMap.get(key) || 0;
        returnedItemMap.set(key, existing + (line.quantity || 0));
      }
    }

    // Validate item IDs exist
    const itemIds = [...new Set(items.map((i) => String(i.item_id)))];
    const dbItems = await Item.find({
      _id: { $in: itemIds },
      user_id: userId,
    })
      .select("_id item_name")
      .lean();

    if (dbItems.length !== itemIds.length) {
      throw ApiError.badRequest(
        "One or more items are invalid or do not belong to your account",
      );
    }

    // Validate quantities
    for (const item of items) {
      const key = String(item.item_id);
      const purchasedQty = purchasedItemMap.get(key) || 0;
      const alreadyReturned = returnedItemMap.get(key) || 0;
      const returnableQty = purchasedQty - alreadyReturned;
      const requestedQty = Number(item.quantity) || 0;

      if (purchasedQty === 0) {
        throw ApiError.badRequest(
          `Item '${key}' was not part of this purchase challan`,
        );
      }

      if (requestedQty > returnableQty) {
        throw ApiError.badRequest(
          `Return quantity for item '${key}' exceeds returnable quantity. Purchased: ${purchasedQty}, Already returned: ${alreadyReturned}, Requested: ${requestedQty}`,
        );
      }
    }

    const processedItems = this._processReturnItems(items);
    const totalAmount = this._round(
      processedItems.reduce((sum, i) => sum + i.amount, 0),
    );

    // Stock operations: remove stock (we're returning items to supplier)
    await stockService.removeStock(processedItems, userId, isGst);

    // Adjust challan paid tracking
    const newChallanAmount = this._round(challan.amount - totalAmount);
    const paidAmount = challan.paid_amount || 0;
    let paymentStatus;
    if (Math.abs(paidAmount - newChallanAmount) < 0.01) {
      paymentStatus = "paid";
    } else if (paidAmount < newChallanAmount) {
      paymentStatus = "due";
    } else {
      paymentStatus = "overpaid";
    }

    await Challan.findByIdAndUpdate(challan_id, {
      amount: Math.max(0, newChallanAmount),
      payment_status: paymentStatus,
    });

    // Generate return number
    const seqKey = `PurchaseReturnNo_${isGst === 1 ? "GST" : "NONGST"}`;
    const returnNoSeq = await getNextId(seqKey, userId);
    const return_no = `PR-${String(returnNoSeq).padStart(6, "0")}`;
    const nextId = await getNextId("Return", userId);

    const returnDoc = await Return.create({
      id: nextId,
      return_no,
      return_type: "purchase_return",
      date: date || new Date(),
      contact_id: challan.contact_id,
      challan_id,
      items: processedItems,
      total_amount: totalAmount,
      note: note || "",
      is_gst: isGst,
      user_id: userId,
    });

    await returnDoc.populate(RETURN_POPULATE);
    return this._attachDamageCounts(returnDoc);
  }

  async getReturnsForBill(billId, userId, isGst) {
    const returns = await Return.find({
      bill_id: billId,
      user_id: userId,
      is_gst: isGst,
      return_type: "sale_return",
    })
      .populate(RETURN_POPULATE)
      .sort({ createdAt: -1 });

    return returns.map((d) => this._attachDamageCounts(d));
  }

  async getReturnsForChallan(challanId, userId, isGst) {
    const returns = await Return.find({
      challan_id: challanId,
      user_id: userId,
      is_gst: isGst,
      return_type: "purchase_return",
    })
      .populate(RETURN_POPULATE)
      .sort({ createdAt: -1 });

    return returns.map((d) => this._attachDamageCounts(d));
  }

  async getReturnSummary(userId, isGst, query) {
    const match = {
      user_id: new mongoose.Types.ObjectId(userId),
      is_gst: isGst,
    };

    if (query.return_type) match.return_type = query.return_type;
    if (query.contact_id)
      match.contact_id = new mongoose.Types.ObjectId(query.contact_id);
    if (query.bill_id)
      match.bill_id = new mongoose.Types.ObjectId(query.bill_id);
    if (query.challan_id)
      match.challan_id = new mongoose.Types.ObjectId(query.challan_id);

    const [result] = await Return.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          total_returns: { $addToSet: "$_id" },
          total_items: { $sum: 1 },
          total_quantity: { $sum: "$items.quantity" },
          total_amount: { $sum: "$items.amount" },
          damaged_items: {
            $sum: { $cond: ["$items.is_damaged", 1, 0] },
          },
          damaged_quantity: {
            $sum: {
              $cond: ["$items.is_damaged", "$items.quantity", 0],
            },
          },
          damaged_amount: {
            $sum: {
              $cond: ["$items.is_damaged", "$items.amount", 0],
            },
          },
          not_damaged_items: {
            $sum: { $cond: ["$items.is_damaged", 0, 1] },
          },
          not_damaged_quantity: {
            $sum: {
              $cond: ["$items.is_damaged", 0, "$items.quantity"],
            },
          },
          not_damaged_amount: {
            $sum: {
              $cond: ["$items.is_damaged", 0, "$items.amount"],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total_returns: { $size: "$total_returns" },
          total_items: 1,
          total_quantity: 1,
          total_amount: { $round: ["$total_amount", 2] },
          damaged_items: 1,
          damaged_quantity: 1,
          damaged_amount: { $round: ["$damaged_amount", 2] },
          not_damaged_items: 1,
          not_damaged_quantity: 1,
          not_damaged_amount: { $round: ["$not_damaged_amount", 2] },
        },
      },
    ]);

    return (
      result || {
        total_returns: 0,
        total_items: 0,
        total_quantity: 0,
        total_amount: 0,
        damaged_items: 0,
        damaged_quantity: 0,
        damaged_amount: 0,
        not_damaged_items: 0,
        not_damaged_quantity: 0,
        not_damaged_amount: 0,
      }
    );
  }

  async deleteReturn(returnId, userId, isGst) {
    const doc = await Return.findOne({
      _id: returnId,
      user_id: userId,
      is_gst: isGst,
    });

    if (!doc) throw ApiError.notFound("Return not found");

    if (doc.return_type === "sale_return") {
      // Reverse stock restoration for non-damaged items
      const nonDamagedItems = doc.items.filter((i) => !i.is_damaged);
      if (nonDamagedItems.length > 0) {
        await stockService.deductStock(nonDamagedItems, userId, isGst);
      }

      // Reverse bill amount adjustment
      if (doc.bill_id) {
        const bill = await Bill.findById(doc.bill_id);
        if (bill) {
          const restoredAmount = this._round(bill.amount + doc.total_amount);
          const paidAmount = bill.paid_amount || 0;
          let paymentStatus;
          if (Math.abs(paidAmount - restoredAmount) < 0.01) {
            paymentStatus = "paid";
          } else if (paidAmount < restoredAmount) {
            paymentStatus = "due";
          } else {
            paymentStatus = "overpaid";
          }

          await Bill.findByIdAndUpdate(doc.bill_id, {
            amount: restoredAmount,
            payment_status: paymentStatus,
            $inc: { return_amount: -doc.total_amount },
          });
        }

        // Reverse contact balance credit
        await Contact.findByIdAndUpdate(doc.contact_id, {
          $inc: { balance: -doc.total_amount },
        });
      }
    } else if (doc.return_type === "purchase_return") {
      // Reverse stock removal: add items back
      await stockService.addStock(doc.items, userId, isGst);

      // Reverse challan amount adjustment
      if (doc.challan_id) {
        const challan = await Challan.findById(doc.challan_id);
        if (challan) {
          const restoredAmount = this._round(challan.amount + doc.total_amount);
          const paidAmount = challan.paid_amount || 0;
          let paymentStatus;
          if (Math.abs(paidAmount - restoredAmount) < 0.01) {
            paymentStatus = "paid";
          } else if (paidAmount < restoredAmount) {
            paymentStatus = "due";
          } else {
            paymentStatus = "overpaid";
          }

          await Challan.findByIdAndUpdate(doc.challan_id, {
            amount: restoredAmount,
            payment_status: paymentStatus,
          });
        }
      }
    }

    await Return.findByIdAndDelete(returnId);
  }
}

export default new ReturnService();
