import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import itemRoutes from "./item.routes.js";
import categoryRoutes from "./category.routes.js";
import supplierRoutes from "./supplier.routes.js";
import partyRoutes from "./party.routes.js";
import challanRoutes from "./challan.routes.js";
import billRoutes from "./bill.routes.js";
import transactionRoutes from "./transaction.routes.js";
import purchaseRoutes from "./purchase.routes.js";
import discountRoutes from "./discount.routes.js";
import stockAlertRoutes from "./stockAlert.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/parties", partyRoutes);
router.use("/discounts", discountRoutes);
router.use("/stock-alerts", stockAlertRoutes);

router.use("/challans", challanRoutes);
router.use("/bills", billRoutes);
router.use("/transactions", transactionRoutes);
router.use("/purchases", purchaseRoutes);

router.use("/dashboard", dashboardRoutes);

export default router;
