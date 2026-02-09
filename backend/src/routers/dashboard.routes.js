import { Router } from "express";
import { dashboardController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", dashboardController.getDashboard);

export default router;
