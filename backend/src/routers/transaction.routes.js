import { Router } from "express";
import { transactionController } from "../controllers/index.js";
import { authMiddleware, requireFirm } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", transactionController.getTransactions);
router.post("/sale", transactionController.createSaleTransaction);
router.post("/purchase", transactionController.createPurchaseTransaction);
router.get("/summary", transactionController.getTransactionSummary);
router.get("/type/:type", transactionController.getTransactionsByType);
router.get("/mode/:mode", transactionController.getTransactionsByPaymentMode);
router.get("/bill/:billId", transactionController.getTransactionsByBill);
router.get(
  "/purchase/:purchaseId",
  transactionController.getTransactionsByPurchase,
);
router.get("/:transactionId", transactionController.getTransactionById);
router.delete("/:transactionId", transactionController.deleteTransaction);

export default router;
