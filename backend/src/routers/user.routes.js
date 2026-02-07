import { Router } from "express";
import { userController } from "../controllers/index.js";
import { authMiddleware, mainUserMiddleware } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware, mainUserMiddleware);

router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.get("/:userId", userController.getUserById);
router.put("/:userId", userController.updateUser);
router.delete("/:userId", userController.deleteUser);
router.put("/:userId/firms", userController.updateUserFirms);

export default router;
