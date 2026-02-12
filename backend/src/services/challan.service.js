import Challan from "../models/challan.model.js";
import Firm from "../models/firm.model.js";
import FirmPair from "../models/firmPair.model.js";
import Item from "../models/item.model.js";
import { ApiError, Pagination } from "../utils/index.js";
import stockService from "./stock.service.js";
import discountService from "./discount.service.js";

class ChallanService {
  async getChallans(firmId, userId, query) {
    const filter = {
      firm_id: firmId,
      converted_to_bill: false,
    };
    if (userId) filter.user_id = userId;

    if (query.party_id) {
      filter.party_id = query.party_id;
    }

    if (query.from_date || query.to_date) {
      filter.date = {};
      if (query.from_date) filter.date.$gte = new Date(query.from_date);
      if (query.to_date) filter.date.$lte = new Date(query.to_date);
    }

    return Pagination.paginate(Challan, filter, {
      ...query,
      populate: [
        { path: "party_id", select: "name phone" },
        { path: "items.item_id", select: "item_name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getChallanById(challanId, firmId, userId) {
    const filter = { _id: challanId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const challan = await Challan.findOne(filter)
      .populate("party_id")
      .populate("items.item_id");

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }
    return challan;
  }

  /**
   * Create challan(s) — auto-split by item is_gst flag.
   *
   * Frontend sends ONE challan with mixed items. Each item has is_gst (0 or 1)
   * set by the user (constrained: is_gst=0 items can ONLY be 0; is_gst=1 items
   * can be 0 or 1).
   *
   * Backend splits into up to 2 challans:
   *  - is_gst=1 items → challan under GST firm   (stock deducted)
   *  - is_gst=0 items → challan under NON_GST firm (NO stock change)
   *
   * Returns the challan belonging to the CURRENT firm (the one user is logged into).
   */
  async createChallan(challanData, firmId, userId) {
    const {
      items,
      discount: manualChallanDiscount,
      party_id,
      date,
    } = challanData;

    const firm = await Firm.findById(firmId);
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    // ── Look up firm pair ──
    const pair = await FirmPair.findOne({
      $or: [{ gst_firm_id: firmId }, { nongst_firm_id: firmId }],
    });

    const gstFirmId = pair ? pair.gst_firm_id.toString() : firmId;
    const nonGstFirmId = pair ? pair.nongst_firm_id.toString() : firmId;

    // ── Fetch item master data (is_gst flags) ──
    const itemIds = items.map((i) => i.item_id);
    const dbItems = await Item.find({ _id: { $in: itemIds } })
      .select("_id is_gst")
      .lean();
    const itemMasterMap = new Map(
      dbItems.map((i) => [i._id.toString(), i.is_gst ?? 1]),
    );

    // ── Validate is_gst constraints & split items into two groups ──
    const gstItems = [];
    const nonGstItems = [];

    for (const item of items) {
      const masterIsGst = itemMasterMap.get(
        item.item_id.toString?.() ?? item.item_id,
      );
      // Each challan line has is_gst from frontend (which firm to sell under)
      const saleIsGst = item.is_gst ?? masterIsGst ?? 1;

      if (masterIsGst === 0 && saleIsGst === 1) {
        throw ApiError.badRequest(
          `Item ${item.item_id} is a NON_GST item and cannot be sold as GST`,
        );
      }

      if (saleIsGst === 1) {
        gstItems.push({ ...item, is_gst: 1 });
      } else {
        nonGstItems.push({ ...item, is_gst: 0 });
      }
    }

    if (gstItems.length === 0 && nonGstItems.length === 0) {
      throw ApiError.badRequest("At least one item is required");
    }

    // ── Resolve discount rules (shared across both challans) ──
    const { itemDiscounts, partyAllDiscount } =
      await discountService.resolveDiscounts(itemIds, party_id, firmId);

    // ── Helper: apply 3-column discount (percent1, percent2, fixed_amount) ──
    const applyDiscount = (originalPrice, rule) => {
      let price = originalPrice;
      if (rule.percent1) price *= 1 - rule.percent1 / 100;
      if (rule.percent2) price *= 1 - rule.percent2 / 100;
      if (rule.fixed_amount) price -= rule.fixed_amount;
      return Math.max(0, price);
    };

    // ── Helper: convert 3-column discount to single effective % ──
    const effectivePercent = (originalPrice, rule) => {
      const discounted = applyDiscount(originalPrice, rule);
      if (originalPrice <= 0) return 0;
      return ((originalPrice - discounted) / originalPrice) * 100;
    };

    // ── Helper: process a group of items into a challan document ──
    const buildChallanDoc = async (groupItems, targetFirmId, isGst) => {
      const challanCount = await Challan.countDocuments({
        firm_id: targetFirmId,
      });
      const challan_no = `CH-${String(challanCount + 1).padStart(6, "0")}`;

      let grossTotal = 0;
      let subTotal = 0;

      const processedItems = groupItems.map((item) => {
        const grossAmount = item.quantity * item.rate;

        let itemDiscount = 0;
        if (item.discount !== undefined && item.discount !== null) {
          itemDiscount = item.discount;
        } else {
          const rule = itemDiscounts.get(
            item.item_id.toString?.() ?? item.item_id,
          );
          if (rule && rule.type !== "profit_margin") {
            itemDiscount = effectivePercent(grossAmount, rule);
          }
        }

        const discountedAmount = grossAmount * (1 - itemDiscount / 100);
        grossTotal += grossAmount;
        subTotal += discountedAmount;

        return {
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount: itemDiscount,
          gross_amount: grossAmount,
          amount: discountedAmount,
          is_gst: item.is_gst,
        };
      });

      // Challan-level discount
      let challanDiscount = 0;
      if (
        manualChallanDiscount !== undefined &&
        manualChallanDiscount !== null
      ) {
        challanDiscount = manualChallanDiscount;
      } else if (partyAllDiscount) {
        challanDiscount = effectivePercent(subTotal, partyAllDiscount);
      }

      const challanDiscountAmount = subTotal * (challanDiscount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      const doc = {
        challan_no,
        party_id,
        date: date || new Date(),
        items: processedItems,
        gross_total: grossTotal,
        sub_total: subTotal,
        discount: challanDiscount,
        amount: totalAmount,
        is_gst: isGst,
        firm_id: targetFirmId,
      };
      if (userId) doc.user_id = userId;

      return { doc, processedItems };
    };

    // ── Create challans ──
    let gstChallan = null;
    let nonGstChallan = null;

    if (gstItems.length > 0) {
      const { doc, processedItems } = await buildChallanDoc(
        gstItems,
        gstFirmId,
        1,
      );
      // GST sale → deduct physical stock
      await stockService.deductStock(processedItems, userId);
      gstChallan = await Challan.create(doc);
    }

    if (nonGstItems.length > 0) {
      const { doc } = await buildChallanDoc(nonGstItems, nonGstFirmId, 0);
      // NON_GST sale → NO stock deduction at all
      nonGstChallan = await Challan.create(doc);
    }

    // ── Link the twin challans ──
    if (gstChallan && nonGstChallan) {
      await Challan.findByIdAndUpdate(gstChallan._id, {
        linked_challan_id: nonGstChallan._id,
      });
      await Challan.findByIdAndUpdate(nonGstChallan._id, {
        linked_challan_id: gstChallan._id,
      });
      gstChallan.linked_challan_id = nonGstChallan._id;
      nonGstChallan.linked_challan_id = gstChallan._id;
    }

    // ── Return the challan for the current firm ──
    const currentFirmChallan =
      firmId === gstFirmId ? gstChallan : nonGstChallan;
    // If only one group existed, it might be the other firm's challan
    const returnChallan = currentFirmChallan || gstChallan || nonGstChallan;

    return returnChallan.populate([
      { path: "party_id", select: "name" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }

  /**
   * Update a challan.
   * Stock is only restored/re-deducted for GST challans (is_gst=1).
   * NON_GST challans never touch stock.
   */
  async updateChallan(challanId, firmId, userId, updateData) {
    const filter = { _id: challanId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const challan = await Challan.findOne(filter);

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot update challan that is already billed");
    }

    if (updateData.items) {
      // Only GST challans affect stock
      if (challan.is_gst === 1) {
        await stockService.restoreStock(challan.items, userId);
      }

      // ── Auto-resolve discount rules ──
      const itemIds = updateData.items.map((i) => i.item_id);

      const { itemDiscounts, partyAllDiscount } =
        await discountService.resolveDiscounts(
          itemIds,
          challan.party_id.toString(),
          firmId,
        );

      // Helpers for 3-column discount
      const applyDiscount = (originalPrice, rule) => {
        let price = originalPrice;
        if (rule.percent1) price *= 1 - rule.percent1 / 100;
        if (rule.percent2) price *= 1 - rule.percent2 / 100;
        if (rule.fixed_amount) price -= rule.fixed_amount;
        return Math.max(0, price);
      };
      const effectivePercent = (originalPrice, rule) => {
        const discounted = applyDiscount(originalPrice, rule);
        if (originalPrice <= 0) return 0;
        return ((originalPrice - discounted) / originalPrice) * 100;
      };

      let grossTotal = 0;
      let subTotal = 0;

      const processedItems = updateData.items.map((item) => {
        const grossAmount = item.quantity * item.rate;

        let itemDiscount = 0;
        if (item.discount !== undefined && item.discount !== null) {
          itemDiscount = item.discount;
        } else {
          const rule = itemDiscounts.get(
            item.item_id.toString?.() ?? item.item_id,
          );
          if (rule && rule.type !== "profit_margin") {
            itemDiscount = effectivePercent(grossAmount, rule);
          }
        }

        const discountedAmount = grossAmount * (1 - itemDiscount / 100);
        grossTotal += grossAmount;
        subTotal += discountedAmount;

        return {
          item_id: item.item_id,
          quantity: item.quantity,
          rate: item.rate,
          discount: itemDiscount,
          gross_amount: grossAmount,
          amount: discountedAmount,
          is_gst: challan.is_gst,
        };
      });

      let discount = updateData.discount ?? challan.discount;
      if (
        updateData.discount === undefined &&
        challan.discount === 0 &&
        partyAllDiscount
      ) {
        discount = effectivePercent(subTotal, partyAllDiscount);
      }

      const challanDiscountAmount = subTotal * (discount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      // Only GST challans deduct stock
      if (challan.is_gst === 1) {
        await stockService.deductStock(processedItems, userId);
      }

      updateData.items = processedItems;
      updateData.gross_total = grossTotal;
      updateData.sub_total = subTotal;
      updateData.discount = discount;
      updateData.amount = totalAmount;
    } else if (updateData.discount !== undefined) {
      const challanDiscountAmount =
        challan.sub_total * (updateData.discount / 100);
      updateData.amount = challan.sub_total - challanDiscountAmount;
    }

    const updatedChallan = await Challan.findByIdAndUpdate(
      challanId,
      updateData,
      { new: true },
    ).populate([
      { path: "party_id", select: "name" },
      { path: "items.item_id", select: "item_name" },
    ]);

    return updatedChallan;
  }

  /**
   * Delete a challan.
   * Stock is only restored for GST challans (is_gst=1).
   */
  async deleteChallan(challanId, firmId, userId) {
    const filter = { _id: challanId, firm_id: firmId };
    if (userId) filter.user_id = userId;
    const challan = await Challan.findOne(filter);

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot delete challan that is already billed");
    }

    // Only GST challans affected stock — restore it
    if (challan.is_gst === 1) {
      await stockService.restoreStock(challan.items, userId);
    }

    // Unlink the twin challan if exists (don't delete it — each firm manages its own)
    if (challan.linked_challan_id) {
      await Challan.findByIdAndUpdate(challan.linked_challan_id, {
        linked_challan_id: null,
      });
    }

    await Challan.findByIdAndDelete(challanId);
  }

  async getUnconvertedChallansForParty(partyId, firmId, userId) {
    const filter = {
      party_id: partyId,
      firm_id: firmId,
      converted_to_bill: false,
    };
    if (userId) filter.user_id = userId;
    const challans = await Challan.find(filter)
      .populate("items.item_id", "item_name")
      .sort({ createdAt: -1 });

    return challans;
  }
}

export default new ChallanService();
