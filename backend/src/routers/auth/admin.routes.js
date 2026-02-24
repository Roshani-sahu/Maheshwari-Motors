import { Router } from "express";
import * as adminController from "../../controllers/auth/admin.controller.js";
import authMiddleware, {
  requireAdmin,
} from "../../middlewares/auth.middleware.js";

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

router.get("/subscriptions", adminController.getSubscriptions);
router.get("/subscriptions/expiring-today", adminController.getExpiringToday);
router.post("/subscriptions/expire-check", adminController.runExpiryCheck);
router.get("/subscriptions/:userId", adminController.getSubscriptionByUserId);
router.put("/subscriptions/:userId", adminController.setSubscription);

export default router;
