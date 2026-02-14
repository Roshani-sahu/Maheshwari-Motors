import { Router } from "express";
import { brandController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", brandController.getBrands);
router.post("/", brandController.createBrand);
router.get("/:brandId", brandController.getBrandById);
router.put("/:brandId", brandController.updateBrand);
router.delete("/:brandId", brandController.deleteBrand);

export default router;
