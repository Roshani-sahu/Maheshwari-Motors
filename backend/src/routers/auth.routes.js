import { Router } from "express";
import { authController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

router.use(authMiddleware);
router.post("/logout", authController.logout);
router.get("/me", authController.getProfile);
router.put("/change-password", authController.changePassword);

// Session management (multi-device)
router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", authController.revokeSession);
router.delete("/sessions", authController.revokeAllOtherSessions);

export default router;
