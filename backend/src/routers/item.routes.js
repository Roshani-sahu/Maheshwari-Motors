import { Router } from "express";
import multer from "multer";
import { itemController, discountController } from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

router.use(authMiddleware);

router.get("/", itemController.getItems);
router.post("/", upload.single("image"), itemController.createItem);
router.get("/low-stock", itemController.getLowStockItems);
router.get("/:itemId", itemController.getItemById);
router.put("/:itemId", upload.single("image"), itemController.updateItem);
router.delete("/:itemId", itemController.deleteItem);
router.patch("/:itemId/stock", itemController.updateStock);
router.get("/:itemId/discount", discountController.getItemDiscount);

export default router;
