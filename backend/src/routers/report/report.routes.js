import { Router } from "express";
import { reportController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/purchase", reportController.getPurchaseReport);
router.get("/sales", reportController.getSalesReport);
router.get("/account-ledger", reportController.getAccountLedger);
router.get("/gst-report", reportController.getGstReport);

export default router;
