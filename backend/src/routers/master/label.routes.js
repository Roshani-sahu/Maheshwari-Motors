import { Router } from "express";
import { labelController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", labelController.getLabels);
router.post("/", labelController.createLabel);
router.get("/category/:categoryId", labelController.getLabelsByCategory);
router.get("/:labelId", labelController.getLabelById);
router.put("/:labelId", labelController.updateLabel);
router.delete("/:labelId", labelController.deleteLabel);

export default router;
