import { Router } from "express";
import bankController from "../../controllers/master/bank.controller.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", bankController.getBanks);
router.get("/default", bankController.getDefaultBank);
router.post("/", bankController.createBank);
router.get("/:bankId", bankController.getBankById);
router.put("/:bankId", bankController.updateBank);
router.delete("/:bankId", bankController.deleteBank);

export default router;
