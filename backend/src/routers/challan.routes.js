import { Router } from "express";
import { challanController } from "../controllers/index.js";
import { authMiddleware, requireFirm } from "../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

router.get("/", challanController.getChallans);
router.post("/", challanController.createChallan);
router.get(
  "/party/:partyId/unconverted",
  challanController.getUnconvertedChallansForParty,
);
router.get("/:challanId", challanController.getChallanById);
router.put("/:challanId", challanController.updateChallan);
router.delete("/:challanId", challanController.deleteChallan);

export default router;
