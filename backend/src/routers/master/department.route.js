import { Router } from "express";
import { authMiddleware } from "../../middlewares/index.js";
import departmentController from "../../controllers/master/department.controller.js";

const router = Router();
router.use(authMiddleware);

router
  .route("/")
  .get(departmentController.getDepartmants)
  .post(departmentController.createDepartment);

router
  .route("/:departmentId")
  .put(departmentController.updateDepartment)
  .delete(departmentController.deleteDepartment);

export default router;
