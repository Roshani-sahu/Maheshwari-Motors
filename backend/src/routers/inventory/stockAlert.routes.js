import { Router } from "express";
import { stockAlertController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", stockAlertController.getAlerts);
router.get("/count", stockAlertController.getUnresolvedCount);
router.get("/items", stockAlertController.getLowStockItems);
router.patch("/:alertId/resolve", stockAlertController.resolveAlert);

export default router;
