import { Router } from "express";
import { challanController } from "../../controllers/index.js";
import { authMiddleware, requireFirm } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);
router.use(requireFirm);

const setChallanType = (type) => (req, _res, next) => {
  req.params.challanType = type;
  next();
};


router.post("/", challanController.createChallan);


router.get("/sale", setChallanType("sale"), challanController.getChallans);
router.get(
  "/purchase",
  setChallanType("purchase"),
  challanController.getChallans,
);


router.get(
  "/contact/:contactId/unconverted",
  challanController.getUnconvertedChallansForContact,
);


router.get("/:challanId", challanController.getChallanById);
router.put("/:challanId", challanController.updateChallan);
router.delete("/:challanId", challanController.deleteChallan);


router.post("/:challanId/payment", challanController.recordPayment);

export default router;
