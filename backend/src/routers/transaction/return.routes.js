import { Router } from "express";
import { returnController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", returnController.getReturns);
router.get("/summary", returnController.getReturnSummary);
router.post("/sale", returnController.createSaleReturn);
router.post("/purchase", returnController.createPurchaseReturn);
router.get("/bill/:billId", returnController.getReturnsForBill);
router.get("/challan/:challanId", returnController.getReturnsForChallan);
router.get("/:returnId", returnController.getReturnById);
router.delete("/:returnId", returnController.deleteReturn);

export default router;
