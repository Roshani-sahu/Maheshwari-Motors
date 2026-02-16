import { Router } from "express";
import { billController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", billController.getBills);
router.post("/", billController.createBill);
router.get("/status/:status", billController.getBillsByStatus);
router.get("/party/:partyId", billController.getBillsForParty);
router.get("/:billId", billController.getBillById);
router.post("/:billId/payment", billController.recordPayment);
router.post("/:billId/return", billController.handleReturn);
router.delete("/:billId", billController.deleteBill);

export default router;
