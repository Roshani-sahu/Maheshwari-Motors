import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import authMiddleware, {
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/users", adminController.getSecondaryUsers);
router.post("/users", adminController.createSecondaryUser);
router.get("/users/:userId", adminController.getSecondaryUserById);
router.put("/users/:userId", adminController.updateSecondaryUser);
router.delete("/users/:userId", adminController.deleteSecondaryUser);
router.post(
  "/users/:userId/deactivate",
  adminController.deactivateSecondaryUser,
);
router.post(
  "/users/:userId/reactivate",
  adminController.reactivateSecondaryUser,
);

export default router;
