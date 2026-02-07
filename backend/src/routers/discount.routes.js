import { Router } from "express";
import { discountController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", discountController.getDiscounts);
router.post("/", discountController.createDiscount);
router.get("/:discountId", discountController.getDiscountById);
router.put("/:discountId", discountController.updateDiscount);
router.delete("/:discountId", discountController.deleteDiscount);

export default router;
