import { Router } from "express";
import { authMiddleware } from "../../middlewares/index.js";
import departmentController from "../../controllers/master/department.controller.js";

const router = Router();
router.use(authMiddleware);

router
  .route("/")
  .get(departmentController.getDepartmants)
  .post(departmentController.createDepartment);

export default router;
