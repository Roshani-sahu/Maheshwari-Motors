import { Router } from "express";
import { transactionController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", transactionController.getTransactions);
router.get("/summary", transactionController.getBookSummary);
router.post("/", transactionController.createTransaction);
router.get("/:transactionId", transactionController.getTransactionById);
router.put("/:transactionId", transactionController.updateTransaction);
router.delete("/:transactionId", transactionController.deleteTransaction);

export default router;
