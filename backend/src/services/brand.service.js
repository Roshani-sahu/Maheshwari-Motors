import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";
import Item from "../models/item.model.js";
import Discount from "../models/discount.model.js";
import { ApiError, Pagination } from "../utils/index.js";

class BrandService {
  async getBrands(userId, query) {
    const filter = { user_id: userId };
    if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.name = { $regex: escaped, $options: "i" };
    }

    return Pagination.paginate(Brand, filter, {
      ...query,
      sort: { createdAt: -1 },
    });
  }

  async getBrandById(brandId, userId) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId })
      .populate("item_ids", "item_name amount");
    if (!brand) throw ApiError.notFound("Brand not found");
    return brand;
  }

  async createBrand(data, userId) {
    const escapedName = data.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Brand.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (existing) {
      throw ApiError.badRequest("Brand with this name already exists");
    }

    const brand = await Brand.create({
      name: data.name,
      item_ids: data.item_ids || [],
      user_id: userId,
    });

    if (data.item_ids?.length) {
      await Item.updateMany(
        { _id: { $in: data.item_ids }, user_id: userId },
        { brand_id: brand._id },
      );
    }

    return brand;
  }

  async updateBrand(brandId, userId, updateData) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    if (updateData.item_ids) {
      await Item.updateMany(
        { brand_id: brandId, user_id: userId },
        { $unset: { brand_id: 1 } },
      );
      await Item.updateMany(
        { _id: { $in: updateData.item_ids }, user_id: userId },
        { brand_id: brandId },
      );
    }

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updateData, {
      new: true,
    });
    return updatedBrand;
  }

  async deleteBrand(brandId, userId) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    await Promise.all([
      Item.updateMany(
        { brand_id: brandId, user_id: userId },
        { $unset: { brand_id: 1 } },
      ),
      Category.updateMany(
        { brand_ids: brandId, user_id: userId },
        { $pull: { brand_ids: brandId } },
      ),
      Discount.deleteMany({ brand_id: brandId, user_id: userId }),
    ]);

    await Brand.findByIdAndDelete(brandId);
  }
}

export default new BrandService();
