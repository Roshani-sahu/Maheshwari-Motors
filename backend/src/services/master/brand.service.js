import Brand from "../../models/master/brand.model.js";
import Category from "../../models/master/category.model.js";
import Item from "../../models/master/item.model.js";
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
      populate: {
        path: "hsn_id",
        select: "hsn_code description gst_rate",
      },
      sort: { createdAt: -1 },
    });
  }

  async getBrandById(brandId, userId) {
    const brand = await Brand.findOne({
      _id: brandId,
      user_id: userId,
    }).populate("hsn_id", "hsn_code description gst_rate");
    if (!brand) throw ApiError.notFound("Brand not found");
    return brand;
  }

  async createBrand(data, userId) {
    const { name, discount1, discount2, hsn_id } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Brand name is required");
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await Brand.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });
    if (existing) {
      throw ApiError.conflict("Brand with this name already exists");
    }

    if (hsn_id) {
      const Hsn = (await import("../../models/master/hsn.model.js")).default;
      const hsnExists = await Hsn.exists({ _id: hsn_id, user_id: userId });
      if (!hsnExists) {
        throw ApiError.badRequest("HSN not found. Please select a valid HSN.");
      }
    }

    const brand = await Brand.create({
      id: await getNextId("Brand", userId),
      name: name.trim(),
      discount1: discount1 || { normal: 0, special: 0 },
      discount2: discount2 || { normal: 0, special: 0 },
      hsn_id: hsn_id || undefined,
      user_id: userId,
    });

    return brand;
  }

  async updateBrand(brandId, userId, updateData) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    const { name, discount1, discount2, hsn_id } = updateData;

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

    if (hsn_id !== undefined && hsn_id !== null) {
      const Hsn = (await import("../../models/master/hsn.model.js")).default;
      const hsnExists = await Hsn.exists({ _id: hsn_id, user_id: userId });
      if (!hsnExists) {
        throw ApiError.badRequest("HSN not found. Please select a valid HSN.");
      }
    }

    const fields = {};
    if (name !== undefined) fields.name = name.trim();
    if (discount1 !== undefined) fields.discount1 = discount1;
    if (discount2 !== undefined) fields.discount2 = discount2;
    if (hsn_id !== undefined) fields.hsn_id = hsn_id;

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, fields, {
      new: true,
    });
    return updatedBrand;
  }

  async updateDiscount(brandId, userId, discountData) {
    const brand = await Brand.findOne({ _id: brandId, user_id: userId });
    if (!brand) throw ApiError.notFound("Brand not found");

    const { discount1, discount2 } = discountData;

    const validateDiscountField = (field, label) => {
      if (!field) return;
      if (field.normal !== undefined) {
        if (
          typeof field.normal !== "number" ||
          field.normal < 0 ||
          field.normal > 100
        ) {
          throw ApiError.badRequest(
            `${label} normal % must be between 0 and 100`,
          );
        }
      }
      if (field.special !== undefined) {
        if (
          typeof field.special !== "number" ||
          field.special < 0 ||
          field.special > 100
        ) {
          throw ApiError.badRequest(
            `${label} special % must be between 0 and 100`,
          );
        }
      }
    };
    validateDiscountField(discount1, "Discount 1");
    validateDiscountField(discount2, "Discount 2");

    const fields = {};
    if (discount1 !== undefined) fields.discount1 = discount1;
    if (discount2 !== undefined) fields.discount2 = discount2;

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, fields, {
      new: true,
    });
    return updatedBrand;
  }

  async getDiscountsByCategory(categoryId, userId) {
    const category = await Category.findOne({
      _id: categoryId,
      user_id: userId,
    }).populate("brand_ids", "name discount1 discount2 hsn_id");
    if (!category) throw ApiError.notFound("Category not found");

    // Populate hsn_id on each brand
    await Brand.populate(category.brand_ids, {
      path: "hsn_id",
      select: "hsn_code description gst_rate",
    });

    const data = category.brand_ids.map((brand) => ({
      _id: brand._id,
      name: brand.name,
      discount1: brand.discount1 || { normal: 0, special: 0 },
      discount2: brand.discount2 || { normal: 0, special: 0 },
      hsn: brand.hsn_id || null,
    }));

    return { data, total: data.length, page: 1, limit: data.length };
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
    ]);

    await Brand.findByIdAndDelete(brandId);
  }
}

export default new BrandService();
