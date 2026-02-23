import { Router } from "express";
import { areaController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", areaController.getAreas);
router.post("/", areaController.createArea);
router.get("/:areaId", areaController.getAreaById);
router.put("/:areaId", areaController.updateArea);
router.delete("/:areaId", areaController.deleteArea);

export default router;
