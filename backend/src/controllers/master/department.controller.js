import departmentService from "../../services/master/department.service.js";
import { ApiResponse, asyncHandler } from "../../utils/index.js";

class DepartmentController {
  getDepartmants = asyncHandler(async (req, res) => {
    try {
      const result = await departmentService.getDepartments(req.user._id);
      res
        .status(200)
        .json(new ApiResponse(200, result, "Departments fetched successfully"));
    } catch (error) {
      res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to fetch departments"));
    }
  });

  createDepartment = asyncHandler(async (req, res) => {
    try {
      const result = await departmentService.createDepartment(
        req.body,
        req.user._id,
      );
      res
        .status(201)
        .json(new ApiResponse(201, result, "Department created successfully"));
    } catch (error) {
      res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to create department"));
    }
  });
}

export default new DepartmentController();
