import Brand from "../../models/master/brand.model.js";
import Category from "../../models/master/category.model.js";
import Item from "../../models/master/item.model.js";
import Discount from "../../models/master/discount.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

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
    const brand = await Brand.findOne({
      _id: brandId,
      user_id: userId,
    }).populate("item_ids", "item_name sale_rate");
    if (!brand) throw ApiError.notFound("Brand not found");
    return brand;
  }

  async createBrand(data, userId) {
    const { name, item_ids } = data;

    // --- Required field check ---
    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Brand name is required");
    }

    // --- Duplicate name check ---
    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Brand.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (existing) {
      throw ApiError.conflict("Brand with this name already exists");
    }

    // --- Validate item_ids reference ---
    if (item_ids && item_ids.length > 0) {
      const validItemCount = await Item.countDocuments({
        _id: { $in: item_ids },
        user_id: userId,
      });
      if (validItemCount !== item_ids.length) {
        throw ApiError.badRequest(
          "One or more selected items are invalid or do not belong to you",
        );
      }
    }

    const brand = await Brand.create({
      id: await getNextId("Brand", userId),
      name: name.trim(),
      item_ids: item_ids || [],
      user_id: userId,
    });

    if (item_ids?.length) {
      await Item.updateMany(
        { _id: { $in: item_ids }, user_id: userId },
        { brand_id: brand._id },
      );
    }

    return brand;
  }

  async updateBrand(brandId, userId, updateData) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    const { name, item_ids } = updateData;

    // --- Name validation on rename ---
    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw ApiError.badRequest("Brand name cannot be empty");
      }
      const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const duplicate = await Brand.findOne({
        name: { $regex: new RegExp(`^${escapedName}$`, "i") },
        user_id: userId,
        _id: { $ne: brandId },
      });
      if (duplicate) {
        throw ApiError.conflict("Another brand with this name already exists");
      }
    }

    // --- Validate item_ids reference ---
    if (item_ids !== undefined && item_ids.length > 0) {
      const validItemCount = await Item.countDocuments({
        _id: { $in: item_ids },
        user_id: userId,
      });
      if (validItemCount !== item_ids.length) {
        throw ApiError.badRequest(
          "One or more selected items are invalid or do not belong to you",
        );
      }
    }

    if (item_ids) {
      await Item.updateMany(
        { brand_id: brandId, user_id: userId },
        { $unset: { brand_id: 1 } },
      );
      await Item.updateMany(
        { _id: { $in: item_ids }, user_id: userId },
        { brand_id: brandId },
      );
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (item_ids !== undefined) fields.item_ids = item_ids;

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, fields, {
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
