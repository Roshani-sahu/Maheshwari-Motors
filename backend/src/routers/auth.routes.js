import { Router } from "express";
import { authController } from "../controllers/index.js";
import authMiddleware, {
  requireAdmin,
} from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * AUTH ROUTES (Redesigned)
 *
 * NEW FLOW:
 * - Admin login: POST /auth/admin/login
 * - Firm login: POST /auth/firm/login (for daily operations)
 *
 * DEPRECATED (backward compat):
 * - User register: POST /auth/register
 * - User login: POST /auth/login
 */

// ============ ADMIN AUTH ============
router.post("/admin/login", authController.loginAdmin);

// ============ FIRM AUTH ============
router.post("/firm/login", authController.loginFirm);

// ============ DEPRECATED: USER AUTH ============
router.post("/register", authController.register);
router.post("/login", authController.login);

// ============ PROTECTED ROUTES (works for admin, firm, or user) ============
router.use(authMiddleware);

router.post("/logout", authController.logout);
router.get("/me", authController.getProfile);
router.put("/change-password", authController.changePassword);

// Session management (multi-device)
router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", authController.revokeSession);
router.delete("/sessions", authController.revokeAllOtherSessions);

// Admin-only: Register new admin
router.post("/admin/register", requireAdmin, authController.registerAdmin);

export default router;
