import Discount from "../models/discount.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class DiscountService {
  async getDiscounts(userId, query) {
    const filter = { user_id: userId };
    if (query.type) filter.type = query.type;
    if (query.item_id) filter.item_id = query.item_id;
    if (query.party_id) filter.party_id = query.party_id;

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
      .populate("item_id", "item_name")
      .populate("party_id", "name");
    if (!discount) throw ApiError.notFound("Discount not found");
    return discount;
  }

  async createDiscount(data, userId) {
    return Discount.create({ ...data, user_id: userId });
  }

  async updateDiscount(discountId, userId, updateData) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    });
    if (!discount) throw ApiError.notFound("Discount not found");
    return Discount.findByIdAndUpdate(discountId, updateData, { new: true });
  }

  async deleteDiscount(discountId, userId) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    });
    if (!discount) throw ApiError.notFound("Discount not found");
    await Discount.findByIdAndDelete(discountId);
  }

  async resolveDiscounts(itemIds, partyId, userId) {
    const discounts = await Discount.find({
      user_id: userId,
      $or: [
        { type: "item", item_id: { $in: itemIds } },
        { type: "party_item", party_id: partyId, item_id: { $in: itemIds } },
        { type: "party_all", party_id: partyId },
      ],
    }).lean();

    const discountMap = {};
    for (const itemId of itemIds) {
      const strId = itemId.toString();
      const partyItem = discounts.find(
        (d) =>
          d.type === "party_item" &&
          d.item_id?.toString() === strId &&
          d.party_id?.toString() === partyId?.toString(),
      );
      const itemDiscount = discounts.find(
        (d) => d.type === "item" && d.item_id?.toString() === strId,
      );
      const partyAll = discounts.find(
        (d) =>
          d.type === "party_all" &&
          d.party_id?.toString() === partyId?.toString(),
      );
      discountMap[strId] = partyItem || itemDiscount || partyAll || null;
    }
    return discountMap;
  }

  async getItemDiscount(itemId, userId) {
    return Discount.find({ item_id: itemId, user_id: userId });
  }

  async getPartyDiscount(partyId, userId) {
    return Discount.find({ party_id: partyId, user_id: userId });
  }
}

export default new DiscountService();
