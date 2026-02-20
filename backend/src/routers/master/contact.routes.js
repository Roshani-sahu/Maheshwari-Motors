import { Router } from "express";
import { contactController } from "../../controllers/index.js";
import { authMiddleware } from "../../middlewares/index.js";

const router = Router();

router.use(authMiddleware);

router.get("/", contactController.getContacts);
router.get("/parties", contactController.getParties);
router.get("/suppliers", contactController.getSuppliers);
router.post("/", contactController.createContact);
router.get("/due", contactController.getContactsWithDue);
router.get("/overpaid", contactController.getContactsWithOverpaid);
router.get("/:contactId", contactController.getContactById);
router.put("/:contactId", contactController.updateContact);
router.delete("/:contactId", contactController.deleteContact);
router.get("/:contactId/balance", contactController.getContactBalance);
router.patch("/:contactId/balance", contactController.updateContactBalance);

export default router;
