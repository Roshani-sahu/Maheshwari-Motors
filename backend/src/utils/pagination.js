import env from "../config/env.js";

class Pagination {
  static getParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(
      env.MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.limit) || env.DEFAULT_PAGE_SIZE),
    );
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static createMeta(total, page, limit) {
    const totalPages = Math.ceil(total / limit);

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  static async paginate(model, query = {}, options = {}) {
    const { page, limit, skip } = this.getParams(options);
    const sort = options.sort || { createdAt: -1 };
    const populate = options.populate || "";
    const select = options.select || "";

    const [data, total] = await Promise.all([
      model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate(populate)
        .select(select)
        .lean(),
      model.countDocuments(query),
    ]);

    return {
      data,
      meta: this.createMeta(total, page, limit),
    };
  }
}

export default Pagination;
