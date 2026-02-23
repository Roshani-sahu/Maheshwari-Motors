import departmentModel from "../../models/master/department.model.js";
import { ApiError, Pagination } from "../../utils/index.js";
import { getNextId } from "../../helpers/counter.js";

class DepartmentService {
  async getDepartments(userId) {
    const filter = { user_id: userId };
    return await Pagination.paginate(departmentModel, filter, {
      sort: { createdAt: -1 },
    });
  }

  async createDepartment(data, userId) {
    const { name } = data;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw ApiError.badRequest("Department name is required");
    }

    const escapedName = name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await departmentModel.findOne({
      name: { $regex: new RegExp(`^${escapedName}$`, "i") },
      user_id: userId,
    });

    if (duplicate) {
      throw ApiError.conflict("Department with this name already exists");
    }

    const department = await departmentModel.create({
      id: await getNextId("Department", userId),
      name: name.trim(),
      user_id: userId,
    });

    return department;
  }
}

export default new DepartmentService();
