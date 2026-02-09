import Discount from "../models/discount.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class DiscountService {
  async getDiscounts(userId, query) {
    const filter = { user_id: userId };
    if (query.type) filter.type = query.type;

    return Pagination.paginate(Discount, filter, {
      ...query,
      populate: [
        { path: "item_id", select: "item_name" },
        { path: "party_id", select: "name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  async getDiscountById(discountId, userId) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    })
      .populate("item_id")
      .populate("party_id");
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }
    return discount;
  }

  async createDiscount(discountData, userId) {
    const { type, item_id, party_id } = discountData;

    if (type === "item" && !item_id) {
      throw ApiError.badRequest("item_id is required for item discount");
    }

    if (type === "party" && !party_id) {
      throw ApiError.badRequest("party_id is required for party discount");
    }

    const existingFilter = { user_id: userId, type };
    if (type === "item") existingFilter.item_id = item_id;
    else existingFilter.party_id = party_id;

    const existingDiscount = await Discount.findOne(existingFilter);
    if (existingDiscount) {
      throw ApiError.conflict(
        `Discount already exists for this ${type}. Please update the existing one.`,
      );
    }

    const discount = await Discount.create({
      ...discountData,
      user_id: userId,
    });

    return discount.populate([
      { path: "item_id", select: "item_name" },
      { path: "party_id", select: "name" },
    ]);
  }

  async updateDiscount(discountId, userId, updateData) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    });
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }

    delete updateData.type;
    delete updateData.item_id;
    delete updateData.party_id;

    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      updateData,
      { new: true },
    ).populate([
      { path: "item_id", select: "item_name" },
      { path: "party_id", select: "name" },
    ]);

    return updatedDiscount;
  }

  async deleteDiscount(discountId, userId) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    });
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }
    await Discount.findByIdAndDelete(discountId);
  }

  async getItemDiscount(itemId, userId) {
    return Discount.findOne({ item_id: itemId, user_id: userId, type: "item" });
  }

  async getPartyDiscount(partyId, userId) {
    return Discount.findOne({
      party_id: partyId,
      user_id: userId,
      type: "party",
    });
  }

  /**
   * Batch-resolve all applicable discount rules for a set of items + a party.
   * Returns { itemDiscounts: Map<itemId, {discount_type, value}>, partyDiscount: {discount_type, value}|null }
   * Uses 2 queries total (not N+1).
   */
  async resolveDiscounts(itemIds, partyId, userId) {
    const [itemRules, partyRule] = await Promise.all([
      Discount.find({
        user_id: userId,
        type: "item",
        item_id: { $in: itemIds },
      }).lean(),
      partyId ?
        Discount.findOne({
          user_id: userId,
          type: "party",
          party_id: partyId,
        }).lean()
      : null,
    ]);

    const itemDiscounts = new Map();
    for (const rule of itemRules) {
      itemDiscounts.set(rule.item_id.toString(), {
        discount_type: rule.discount_type,
        value: rule.value,
      });
    }

    return {
      itemDiscounts,
      partyDiscount:
        partyRule ?
          { discount_type: partyRule.discount_type, value: partyRule.value }
        : null,
    };
  }
}

export default new DiscountService();
