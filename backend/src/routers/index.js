import { Router } from "express";
import authRoutes from "./auth/auth.routes.js";
import adminRoutes from "./auth/admin.routes.js";
import itemRoutes from "./master/item.routes.js";
import categoryRoutes from "./master/category.routes.js";
import brandRoutes from "./master/brand.routes.js";
import discountRoutes from "./master/discount.routes.js";
import supplierRoutes from "./master/supplier.routes.js";
import partyRoutes from "./master/party.routes.js";
import stockAlertRoutes from "./inventory/stockAlert.routes.js";
import challanRoutes from "./transaction/challan.routes.js";
import billRoutes from "./transaction/bill.routes.js";
import transactionRoutes from "./transaction/transaction.routes.js";
import purchaseRoutes from "./transaction/purchase.routes.js";
import dashboardRoutes from "./dashboard/dashboard.routes.js";

const router = Router();

// Auth
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

// Master
router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/discounts", discountRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/parties", partyRoutes);
router.use("/stock-alerts", stockAlertRoutes);

// Transaction
router.use("/challans", challanRoutes);
router.use("/bills", billRoutes);
router.use("/transactions", transactionRoutes);
router.use("/purchases", purchaseRoutes);

// Dashboard
router.use("/dashboard", dashboardRoutes);

export default router;
