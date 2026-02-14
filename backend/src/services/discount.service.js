import Discount from "../models/discount.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class DiscountService {
  async getDiscounts(userId, query) {
    if (query.category_id) {
      return this._getDiscountsByCategory(query.category_id, userId);
    }

    const filter = { user_id: userId };
    if (query.brand_id) filter.brand_id = query.brand_id;

    return Pagination.paginate(Discount, filter, {
      ...query,
      populate: [{ path: "brand_id", select: "name" }],
      sort: { createdAt: -1 },
    });
  }

  async _getDiscountsByCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    }).populate("brand_ids", "name");
    if (!category) throw ApiError.notFound("Category not found");

    const brandIds = category.brand_ids.map((b) => b._id);
    const existingDiscounts = await Discount.find({
      brand_id: { $in: brandIds },
      user_id: userId,
    }).populate("brand_id", "name");

    const discountMap = new Map();
    for (const d of existingDiscounts) {
      discountMap.set(d.brand_id._id.toString(), d);
    }

    const data = category.brand_ids.map((brand) => {
      const existing = discountMap.get(brand._id.toString());
      if (existing) return existing.toObject();
      return {
        _id: null,
        brand_id: { _id: brand._id, name: brand.name },
        discount1: { normal: 0, special: 0 },
        discount2: { normal: 0, special: 0 },
      };
    });

    return { data, total: data.length, page: 1, limit: data.length };
  }

  async getDiscountByBrand(brandId, userId) {
    const discount = await Discount.findOne({
      brand_id: brandId,
      user_id: userId,
    }).populate("brand_id", "name");
    return discount;
  }

  async upsertDiscount(data, userId) {
    const brand = await Brand.findOne({ _id: data.brand_id, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    const discount = await Discount.findOneAndUpdate(
      { brand_id: data.brand_id, user_id: userId },
      {
        brand_id: data.brand_id,
        discount1: data.discount1 || { normal: 0, special: 0 },
        discount2: data.discount2 || { normal: 0, special: 0 },
        user_id: userId,
      },
      { new: true, upsert: true },
    ).populate("brand_id", "name");

    return discount;
  }

  async deleteDiscount(discountId, userId) {
    const discount = await Discount.findOne({
      _id: discountId,
      user_id: userId,
    });
    if (!discount) throw ApiError.notFound("Discount not found");
    await Discount.findByIdAndDelete(discountId);
  }
}

export default new DiscountService();
