import { Router } from "express";
import { purchaseController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", purchaseController.getPurchases);
router.post("/", purchaseController.createPurchase);
router.get("/type/:type", purchaseController.getPurchasesByType);
router.get("/:purchaseId", purchaseController.getPurchaseById);
router.post("/:purchaseId/payment", purchaseController.recordPayment);
router.delete("/:purchaseId", purchaseController.deletePurchase);

export default router;
