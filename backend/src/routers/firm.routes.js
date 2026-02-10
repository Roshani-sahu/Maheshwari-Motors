import { Router } from "express";
import {
  firmController,
  dashboardController,
  partyController,
  challanController,
  billController,
  discountController,
  purchaseController,
  transactionController,
} from "../controllers/index.js";
import { authMiddleware, firmMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", firmController.getFirms);
router.post("/", firmController.createFirm);
router.get("/:firmId", firmController.getFirmById);
router.put("/:firmId", firmController.updateFirm);
router.delete("/:firmId", firmController.deleteFirm);

router.use("/:firmId", firmMiddleware);

router.get("/:firmId/dashboard", dashboardController.getFirmDashboard);

router.get("/:firmId/parties", partyController.getParties);
router.post("/:firmId/parties", partyController.createParty);
router.get("/:firmId/parties/due", partyController.getPartiesWithDue);
router.get("/:firmId/parties/overpaid", partyController.getPartiesWithOverpaid);
router.get("/:firmId/parties/:partyId", partyController.getPartyById);
router.put("/:firmId/parties/:partyId", partyController.updateParty);
router.delete("/:firmId/parties/:partyId", partyController.deleteParty);
router.get(
  "/:firmId/parties/:partyId/balance",
  partyController.getPartyBalance,
);
router.patch(
  "/:firmId/parties/:partyId/balance",
  partyController.updatePartyBalance,
);
router.get(
  "/:firmId/parties/:partyId/discount",
  discountController.getPartyDiscount,
);
router.get(
  "/:firmId/parties/:partyId/challans",
  challanController.getUnconvertedChallansForParty,
);
router.get("/:firmId/parties/:partyId/bills", billController.getBillsForParty);

router.get("/:firmId/challans", challanController.getChallans);
router.post("/:firmId/challans", challanController.createChallan);
router.get("/:firmId/challans/:challanId", challanController.getChallanById);
router.put("/:firmId/challans/:challanId", challanController.updateChallan);
router.delete("/:firmId/challans/:challanId", challanController.deleteChallan);

router.get("/:firmId/bills", billController.getBills);
router.post("/:firmId/bills", billController.createBill);
router.get("/:firmId/bills/status/:status", billController.getBillsByStatus);
router.get("/:firmId/bills/:billId", billController.getBillById);
router.delete("/:firmId/bills/:billId", billController.deleteBill);
router.post("/:firmId/bills/:billId/payment", billController.recordPayment);
router.post("/:firmId/bills/:billId/return", billController.handleReturn);

router.get("/:firmId/purchases", purchaseController.getPurchases);
router.post("/:firmId/purchases", purchaseController.createPurchase);
router.get(
  "/:firmId/purchases/type/:type",
  purchaseController.getPurchasesByType,
);
router.get(
  "/:firmId/purchases/:purchaseId",
  purchaseController.getPurchaseById,
);
router.post(
  "/:firmId/purchases/:purchaseId/payment",
  purchaseController.recordPayment,
);
router.delete(
  "/:firmId/purchases/:purchaseId",
  purchaseController.deletePurchase,
);

router.get("/:firmId/transactions", transactionController.getTransactions);
router.get(
  "/:firmId/transactions/summary",
  transactionController.getTransactionSummary,
);
router.post(
  "/:firmId/transactions/sale",
  transactionController.createSaleTransaction,
);
router.post(
  "/:firmId/transactions/purchase",
  transactionController.createPurchaseTransaction,
);
router.get(
  "/:firmId/transactions/type/:type",
  transactionController.getTransactionsByType,
);
router.get(
  "/:firmId/transactions/payment-mode/:mode",
  transactionController.getTransactionsByPaymentMode,
);
router.get(
  "/:firmId/transactions/:transactionId",
  transactionController.getTransactionById,
);
router.delete(
  "/:firmId/transactions/:transactionId",
  transactionController.deleteTransaction,
);

// Transactions by linked document
router.get(
  "/:firmId/bills/:billId/transactions",
  transactionController.getTransactionsByBill,
);
router.get(
  "/:firmId/purchases/:purchaseId/transactions",
  transactionController.getTransactionsByPurchase,
);

export default router;
