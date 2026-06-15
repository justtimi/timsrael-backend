import express from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, upload.array("images"), createProduct);
router.put("/:id", protect, admin, upload.array("images"), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

export default router;
