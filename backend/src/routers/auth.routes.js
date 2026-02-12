import { Router } from "express";
import { authController } from "../controllers/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/admin/register", authController.registerMainUser);
router.post("/admin/login", authController.loginAdmin);
router.post("/firm/login", authController.loginFirm);

router.use(authMiddleware);

router.post("/logout", authController.logout);
router.get("/me", authController.getProfile);
router.put("/change-password", authController.changePassword);

router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", authController.revokeSession);
router.delete("/sessions", authController.revokeAllOtherSessions);

export default router;
