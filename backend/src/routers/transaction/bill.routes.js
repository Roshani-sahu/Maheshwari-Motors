import { Router } from "express";
import { billController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", billController.getBills);
router.post("/", billController.createBill);
router.post("/settlements", billController.settleBills);
router.post("/last-sold-items", billController.getLastSoldItemsForParty);
router.get("/summary", billController.getBillSummary);
router.get("/status/:status", billController.getBillsByStatus);
router.get("/contact/:contactId", billController.getBillsForContact);
router.get("/:billId", billController.getBillById);
router.post("/:billId/payment", billController.recordPayment);
router.post("/:billId/return", billController.handleReturn);
router.delete("/:billId", billController.deleteBill);

export default router;
