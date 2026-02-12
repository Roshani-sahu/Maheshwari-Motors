import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import authMiddleware, {
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * ADMIN ROUTES
 *
 * All routes require admin authentication
 *
 * Firm Pair Management:
 * - POST /admin/firm-pairs - Create new firm pair (GST + NON_GST)
 * - GET /admin/firm-pairs - List all firm pairs
 * - GET /admin/firm-pairs/:pairId - Get single firm pair
 * - DELETE /admin/firm-pairs/:pairId - Deactivate firm pair
 * - POST /admin/firm-pairs/:pairId/reactivate - Reactivate firm pair
 *
 * Individual Firm Management:
 * - PUT /admin/firms/:firmId - Update firm details/credentials
 */

router.use(authMiddleware);
router.use(requireAdmin);

// Firm Pair routes
router.post("/firm-pairs", adminController.createFirmPair);
router.get("/firm-pairs", adminController.getFirmPairs);
router.get("/firm-pairs/:pairId", adminController.getFirmPairById);
router.delete("/firm-pairs/:pairId", adminController.deactivateFirmPair);
router.post(
  "/firm-pairs/:pairId/reactivate",
  adminController.reactivateFirmPair,
);

// Individual Firm routes
router.put("/firms/:firmId", adminController.updateFirm);

export default router;
