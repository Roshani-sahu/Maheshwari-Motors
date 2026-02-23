import { Router } from "express";
import { hsnController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.route("/").get(hsnController.getHsns).post(hsnController.createHsn);

router
  .route("/:hsnId")
  .get(hsnController.getHsnById)
  .put(hsnController.updateHsn)
  .delete(hsnController.deleteHsn);

export default router;
