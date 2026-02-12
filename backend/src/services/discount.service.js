import Discount from "../models/discount.model.js";
import Item from "../models/item.model.js";
import { ApiError, Pagination } from "../utils/index.js";

/**
 * Discount Service (Redesigned)
 *
 * NEW Discount Types:
 * - item: Apply specific discount to an item (for all parties)
 * - party_item: Apply discount to specific item for specific party
 * - party_all: Apply discount to ALL items for a specific party
 * - item_group: Apply discount to a group of items
 * - profit_margin: Calculate sell price from purchase_rate + profit%
 *
 * 3 Discount Columns:
 * - percent1: First percentage discount
 * - percent2: Second percentage discount (applied after first)
 * - fixed_amount: Fixed amount discount (applied after percentages)
 *
 * Calculation: finalPrice = ((originalPrice * (1 - percent1/100)) * (1 - percent2/100)) - fixed_amount
 */
class DiscountService {
  /**
   * Get all discounts for a firm
   */
  async getDiscounts(firmId, query) {
    const filter = { firm_id: firmId, is_active: true };
    if (query.type) filter.type = query.type;

    return Pagination.paginate(Discount, filter, {
      ...query,
      populate: [
        { path: "item_id", select: "item_name amount purchase_rate" },
        { path: "party_id", select: "name" },
        { path: "item_ids", select: "item_name" },
      ],
      sort: { createdAt: -1 },
    });
  }

  /**
   * Get a single discount by ID
   */
  async getDiscountById(discountId, firmId) {
    const discount = await Discount.findOne({
      _id: discountId,
      firm_id: firmId,
    })
      .populate("item_id")
      .populate("party_id")
      .populate("item_ids");
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }
    return discount;
  }

  /**
   * Create a new discount rule
   */
  async createDiscount(discountData, firmId) {
    const { type, item_id, party_id, item_ids, profit_percent } = discountData;

    // Validate required fields based on type
    if (type === "item" && !item_id) {
      throw ApiError.badRequest("item_id is required for item discount");
    }
    if (type === "party_item" && (!item_id || !party_id)) {
      throw ApiError.badRequest(
        "item_id and party_id are required for party_item discount",
      );
    }
    if (type === "party_all" && !party_id) {
      throw ApiError.badRequest("party_id is required for party_all discount");
    }
    if (type === "item_group" && (!item_ids || item_ids.length === 0)) {
      throw ApiError.badRequest(
        "item_ids array is required for item_group discount",
      );
    }
    if (type === "profit_margin" && !item_id) {
      throw ApiError.badRequest(
        "item_id is required for profit_margin discount",
      );
    }

    // Check for existing duplicate discount
    const existingFilter = { firm_id: firmId, type, is_active: true };
    if (type === "item" || type === "profit_margin") {
      existingFilter.item_id = item_id;
    } else if (type === "party_item") {
      existingFilter.item_id = item_id;
      existingFilter.party_id = party_id;
    } else if (type === "party_all") {
      existingFilter.party_id = party_id;
    }
    // item_group doesn't check for duplicates by default

    if (type !== "item_group") {
      const existingDiscount = await Discount.findOne(existingFilter);
      if (existingDiscount) {
        throw ApiError.conflict(
          `Discount already exists for this ${type}. Update the existing one instead.`,
        );
      }
    }

    const discount = await Discount.create({
      ...discountData,
      firm_id: firmId,
    });

    return discount.populate([
      { path: "item_id", select: "item_name amount purchase_rate" },
      { path: "party_id", select: "name" },
      { path: "item_ids", select: "item_name" },
    ]);
  }

  /**
   * Update an existing discount
   */
  async updateDiscount(discountId, firmId, updateData) {
    const discount = await Discount.findOne({
      _id: discountId,
      firm_id: firmId,
    });
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }

    // Don't allow changing type or references
    delete updateData.type;
    delete updateData.item_id;
    delete updateData.party_id;
    delete updateData.firm_id;

    const updatedDiscount = await Discount.findByIdAndUpdate(
      discountId,
      updateData,
      { new: true },
    ).populate([
      { path: "item_id", select: "item_name amount purchase_rate" },
      { path: "party_id", select: "name" },
      { path: "item_ids", select: "item_name" },
    ]);

    return updatedDiscount;
  }

  /**
   * Delete (soft) a discount
   */
  async deleteDiscount(discountId, firmId) {
    const discount = await Discount.findOne({
      _id: discountId,
      firm_id: firmId,
    });
    if (!discount) {
      throw ApiError.notFound("Discount not found");
    }

    // Soft delete
    discount.is_active = false;
    await discount.save();
  }

  /**
   * Calculate final price after applying discount
   *
   * @param originalPrice - The original item price
   * @param discountRule - The discount rule with percent1, percent2, fixed_amount
   * @returns finalPrice
   */
  calculateDiscountedPrice(originalPrice, discountRule) {
    if (!discountRule) return originalPrice;

    let price = originalPrice;

    // Apply percent1
    if (discountRule.percent1 > 0) {
      price = price * (1 - discountRule.percent1 / 100);
    }

    // Apply percent2
    if (discountRule.percent2 > 0) {
      price = price * (1 - discountRule.percent2 / 100);
    }

    // Apply fixed_amount
    if (discountRule.fixed_amount > 0) {
      price = price - discountRule.fixed_amount;
    }

    return Math.max(0, Math.round(price * 100) / 100); // Don't go negative, round to 2 decimals
  }

  /**
   * Calculate price from purchase_rate + profit margin
   *
   * @param purchaseRate - The purchase/cost price
   * @param profitPercent - The profit percentage to add
   * @returns sellPrice
   */
  calculateProfitMarginPrice(purchaseRate, profitPercent) {
    if (!purchaseRate || purchaseRate <= 0) return 0;
    return Math.round(purchaseRate * (1 + profitPercent / 100) * 100) / 100;
  }

  /**
   * Resolve all applicable discounts for items + party combination
   *
   * Priority (highest to lowest):
   * 1. party_item - Specific item discount for specific party
   * 2. profit_margin - If item has profit margin rule
   * 3. item - General item discount
   * 4. item_group - If item is in a discounted group
   * 5. party_all - Party-wide discount (applied to all items for this party)
   *
   * @returns { itemDiscounts: Map<itemId, discountInfo>, partyAllDiscount: discountInfo | null }
   */
  async resolveDiscounts(itemIds, partyId, firmId) {
    // Fetch all relevant discount rules in parallel
    const queries = [
      // Item-specific discounts
      Discount.find({
        firm_id: firmId,
        type: "item",
        item_id: { $in: itemIds },
        is_active: true,
      }).lean(),
      // Profit margin rules
      Discount.find({
        firm_id: firmId,
        type: "profit_margin",
        item_id: { $in: itemIds },
        is_active: true,
      }).lean(),
      // Item groups that contain any of our items
      Discount.find({
        firm_id: firmId,
        type: "item_group",
        item_ids: { $in: itemIds },
        is_active: true,
      }).lean(),
    ];

    // Add party-specific queries if party is provided
    if (partyId) {
      queries.push(
        // Party-item specific discounts
        Discount.find({
          firm_id: firmId,
          type: "party_item",
          party_id: partyId,
          item_id: { $in: itemIds },
          is_active: true,
        }).lean(),
        // Party-all discount
        Discount.findOne({
          firm_id: firmId,
          type: "party_all",
          party_id: partyId,
          is_active: true,
        }).lean(),
      );
    }

    const results = await Promise.all(queries);
    const [itemRules, profitMarginRules, itemGroupRules] = results;
    const partyItemRules = partyId ? results[3] : [];
    const partyAllRule = partyId ? results[4] : null;

    // Build item discount map
    const itemDiscounts = new Map();

    // First, get items with purchase_rate for profit margin calc
    const itemsWithPurchaseRate = await Item.find({
      _id: { $in: itemIds },
    })
      .select("_id purchase_rate amount")
      .lean();
    const itemPurchaseRates = new Map();
    for (const item of itemsWithPurchaseRate) {
      itemPurchaseRates.set(item._id.toString(), {
        purchase_rate: item.purchase_rate || 0,
        amount: item.amount,
      });
    }

    for (const itemId of itemIds) {
      const idStr = itemId.toString();
      let discountInfo = null;

      // Check priority: party_item > profit_margin > item > item_group
      const partyItemRule = partyItemRules.find(
        (r) => r.item_id.toString() === idStr,
      );
      if (partyItemRule) {
        discountInfo = {
          type: "party_item",
          percent1: partyItemRule.percent1,
          percent2: partyItemRule.percent2,
          fixed_amount: partyItemRule.fixed_amount,
        };
      } else {
        const profitRule = profitMarginRules.find(
          (r) => r.item_id.toString() === idStr,
        );
        if (profitRule) {
          const itemInfo = itemPurchaseRates.get(idStr);
          if (itemInfo && itemInfo.purchase_rate > 0) {
            const sellPrice = this.calculateProfitMarginPrice(
              itemInfo.purchase_rate,
              profitRule.profit_percent,
            );
            discountInfo = {
              type: "profit_margin",
              calculated_price: sellPrice,
              profit_percent: profitRule.profit_percent,
              purchase_rate: itemInfo.purchase_rate,
            };
          }
        }

        if (!discountInfo) {
          const itemRule = itemRules.find(
            (r) => r.item_id.toString() === idStr,
          );
          if (itemRule) {
            discountInfo = {
              type: "item",
              percent1: itemRule.percent1,
              percent2: itemRule.percent2,
              fixed_amount: itemRule.fixed_amount,
            };
          } else {
            // Check item groups
            const groupRule = itemGroupRules.find((r) =>
              r.item_ids.some((gid) => gid.toString() === idStr),
            );
            if (groupRule) {
              discountInfo = {
                type: "item_group",
                group_name: groupRule.item_group_name,
                percent1: groupRule.percent1,
                percent2: groupRule.percent2,
                fixed_amount: groupRule.fixed_amount,
              };
            }
          }
        }
      }

      if (discountInfo) {
        itemDiscounts.set(idStr, discountInfo);
      }
    }

    return {
      itemDiscounts,
      partyAllDiscount:
        partyAllRule ?
          {
            percent1: partyAllRule.percent1,
            percent2: partyAllRule.percent2,
            fixed_amount: partyAllRule.fixed_amount,
          }
        : null,
    };
  }

  // ============ DEPRECATED: Old methods for backward compat ============

  async getItemDiscount(itemId, userId) {
    // Try firm_id first, fall back to user_id
    let discount = await Discount.findOne({
      item_id: itemId,
      firm_id: userId,
      type: "item",
      is_active: true,
    });
    if (!discount) {
      discount = await Discount.findOne({
        item_id: itemId,
        user_id: userId,
        type: "item",
      });
    }
    return discount;
  }

  async getPartyDiscount(partyId, userId) {
    let discount = await Discount.findOne({
      party_id: partyId,
      firm_id: userId,
      type: "party_all",
      is_active: true,
    });
    if (!discount) {
      discount = await Discount.findOne({
        party_id: partyId,
        user_id: userId,
        type: "party",
      });
    }
    return discount;
  }
}

export default new DiscountService();
