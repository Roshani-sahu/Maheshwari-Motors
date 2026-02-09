import Challan from "../models/challan.model.js";
import Firm from "../models/firm.model.js";
import { ApiError, Pagination } from "../utils/index.js";
import stockService from "./stock.service.js";
import discountService from "./discount.service.js";

class ChallanService {
  async getChallans(firmId, userId, query) {
    const filter = {
      firm_id: firmId,
      user_id: userId,
      converted_to_bill: false,
    };

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
    const challan = await Challan.findOne({
      _id: challanId,
      firm_id: firmId,
      user_id: userId,
    })
      .populate("party_id")
      .populate("items.item_id");

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }
    return challan;
  }

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

    // ── Auto-resolve discount rules (2 queries total) ──
    const itemIds = items.map((i) => i.item_id);
    const { itemDiscounts, partyDiscount } =
      await discountService.resolveDiscounts(itemIds, party_id, userId);

    const challanCount = await Challan.countDocuments({ firm_id: firmId });
    const challan_no = `CH-${String(challanCount + 1).padStart(6, "0")}`;

    let grossTotal = 0;
    let subTotal = 0;

    const processedItems = items.map((item) => {
      const grossAmount = item.quantity * item.rate;

      // Priority: client-sent override > auto-rule > 0
      let itemDiscount = 0;
      if (item.discount !== undefined && item.discount !== null) {
        // Client explicitly sent a discount — use it
        itemDiscount = item.discount;
      } else {
        // Auto-apply from Discount model
        const rule = itemDiscounts.get(
          item.item_id.toString?.() ?? item.item_id,
        );
        if (rule) {
          itemDiscount =
            rule.discount_type === "fixed" ?
              (rule.value / item.rate) * 100 // convert fixed to % for storage
            : rule.value;
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
      };
    });

    // Challan-level discount: client override > party rule > 0
    let challanDiscount = 0;
    if (manualChallanDiscount !== undefined && manualChallanDiscount !== null) {
      challanDiscount = manualChallanDiscount;
    } else if (partyDiscount) {
      challanDiscount =
        partyDiscount.discount_type === "fixed" ?
          (partyDiscount.value / subTotal) * 100
        : partyDiscount.value;
    }

    const challanDiscountAmount = subTotal * (challanDiscount / 100);
    const totalAmount = subTotal - challanDiscountAmount;

    await stockService.deductStock(items, firm.type, userId);

    const challan = await Challan.create({
      challan_no,
      party_id,
      date: date || new Date(),
      items: processedItems,
      gross_total: grossTotal,
      sub_total: subTotal,
      discount: challanDiscount,
      amount: totalAmount,
      firm_id: firmId,
      user_id: userId,
    });

    return challan.populate([
      { path: "party_id", select: "name" },
      { path: "items.item_id", select: "item_name" },
    ]);
  }

  async updateChallan(challanId, firmId, userId, updateData) {
    const challan = await Challan.findOne({
      _id: challanId,
      firm_id: firmId,
      user_id: userId,
    });

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot update challan that is already billed");
    }

    const firm = await Firm.findById(firmId);

    if (updateData.items) {
      await stockService.restoreStock(challan.items, firm.type, userId);

      // ── Auto-resolve discount rules ──
      const itemIds = updateData.items.map((i) => i.item_id);
      const { itemDiscounts, partyDiscount } =
        await discountService.resolveDiscounts(
          itemIds,
          challan.party_id.toString(),
          userId,
        );

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
          if (rule) {
            itemDiscount =
              rule.discount_type === "fixed" ?
                (rule.value / item.rate) * 100
              : rule.value;
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
        };
      });

      let discount = updateData.discount ?? challan.discount;
      if (
        updateData.discount === undefined &&
        challan.discount === 0 &&
        partyDiscount
      ) {
        discount =
          partyDiscount.discount_type === "fixed" ?
            (partyDiscount.value / subTotal) * 100
          : partyDiscount.value;
      }

      const challanDiscountAmount = subTotal * (discount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      await stockService.deductStock(updateData.items, firm.type, userId);

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

  async deleteChallan(challanId, firmId, userId) {
    const challan = await Challan.findOne({
      _id: challanId,
      firm_id: firmId,
      user_id: userId,
    });

    if (!challan) {
      throw ApiError.notFound("Challan not found");
    }

    if (challan.converted_to_bill) {
      throw ApiError.badRequest("Cannot delete challan that is already billed");
    }

    const firm = await Firm.findById(firmId);
    await stockService.restoreStock(challan.items, firm.type, userId);
    await Challan.findByIdAndDelete(challanId);
  }

  async getUnconvertedChallansForParty(partyId, firmId, userId) {
    const challans = await Challan.find({
      party_id: partyId,
      firm_id: firmId,
      user_id: userId,
      converted_to_bill: false,
    })
      .populate("items.item_id", "item_name")
      .sort({ createdAt: -1 });

    return challans;
  }
}

export default new ChallanService();
