import Challan from "../models/challan.model.js";
import Firm from "../models/firm.model.js";
import { ApiError, Pagination } from "../utils/index.js";
import stockService from "./stock.service.js";

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
    const { items, discount = 0, party_id, date } = challanData;

    const firm = await Firm.findById(firmId);
    if (!firm) {
      throw ApiError.notFound("Firm not found");
    }

    const challanCount = await Challan.countDocuments({ firm_id: firmId });
    const challan_no = `CH-${String(challanCount + 1).padStart(6, "0")}`;

    let grossTotal = 0;
    let subTotal = 0;

    const processedItems = items.map((item) => {
      const grossAmount = item.quantity * item.rate;
      const itemDiscount = item.discount || 0;
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

    const challanDiscountAmount = subTotal * (discount / 100);
    const totalAmount = subTotal - challanDiscountAmount;

    await stockService.deductStock(items, firm.type, userId);

    const challan = await Challan.create({
      challan_no,
      party_id,
      date: date || new Date(),
      items: processedItems,
      gross_total: grossTotal,
      sub_total: subTotal,
      discount,
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

      let grossTotal = 0;
      let subTotal = 0;

      const processedItems = updateData.items.map((item) => {
        const grossAmount = item.quantity * item.rate;
        const itemDiscount = item.discount || 0;
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

      const discount = updateData.discount ?? challan.discount;
      const challanDiscountAmount = subTotal * (discount / 100);
      const totalAmount = subTotal - challanDiscountAmount;

      await stockService.deductStock(updateData.items, firm.type, userId);

      updateData.items = processedItems;
      updateData.gross_total = grossTotal;
      updateData.sub_total = subTotal;
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
