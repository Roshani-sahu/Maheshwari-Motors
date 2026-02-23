import { Router } from "express";
import { agentController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", agentController.getAgents);
router.post("/", agentController.createAgent);
router.get("/:agentId", agentController.getAgentById);
router.put("/:agentId", agentController.updateAgent);
router.delete("/:agentId", agentController.deleteAgent);

export default router;
