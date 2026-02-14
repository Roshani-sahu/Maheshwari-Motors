import { Router } from "express";
import { partyController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", partyController.getParties);
router.post("/", partyController.createParty);
router.get("/due", partyController.getPartiesWithDue);
router.get("/overpaid", partyController.getPartiesWithOverpaid);
router.get("/:partyId", partyController.getPartyById);
router.put("/:partyId", partyController.updateParty);
router.delete("/:partyId", partyController.deleteParty);
router.get("/:partyId/balance", partyController.getPartyBalance);
router.patch("/:partyId/balance", partyController.updatePartyBalance);

export default router;
