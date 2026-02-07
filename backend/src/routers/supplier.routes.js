import { Router } from "express";
import { supplierController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", supplierController.getSuppliers);
router.post("/", supplierController.createSupplier);
router.get("/:supplierId", supplierController.getSupplierById);
router.put("/:supplierId", supplierController.updateSupplier);
router.delete("/:supplierId", supplierController.deleteSupplier);

export default router;
