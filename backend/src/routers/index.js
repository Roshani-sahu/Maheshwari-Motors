import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import firmRoutes from "./firm.routes.js";
import itemRoutes from "./item.routes.js";
import categoryRoutes from "./category.routes.js";
import supplierRoutes from "./supplier.routes.js";
import discountRoutes from "./discount.routes.js";
import stockAlertRoutes from "./stockAlert.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/firms", firmRoutes);
router.use("/items", itemRoutes);
router.use("/categories", categoryRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/discounts", discountRoutes);
router.use("/stock-alerts", stockAlertRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
