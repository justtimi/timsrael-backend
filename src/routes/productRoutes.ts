import express from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  incrementProductView,
  addProductImage,
  removeProductImage,
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, upload.array("images"), createProduct);
router.put("/:id", protect, admin, upload.array("images"), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.post(
  "/:id/images",
  protect,
  admin,
  upload.single("image"),
  addProductImage,
);
router.delete("/:id/images/:imageId", protect, admin, removeProductImage);

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.post("/:id/view", incrementProductView);
router.get("/:slug", getProductBySlug);

export default router;
