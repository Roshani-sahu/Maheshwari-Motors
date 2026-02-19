import { Router } from "express";
import { transportController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", transportController.getTransports);
router.post("/", transportController.createTransport);
router.get("/:transportId", transportController.getTransportById);
router.put("/:transportId", transportController.updateTransport);
router.delete("/:transportId", transportController.deleteTransport);

export default router;
