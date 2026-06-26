import express from "express";
import {
  createCollection,
  getCollections,
  getCollectionBySlug,
  updateCollection,
  updateCollectionCover,
  deleteCollection,
  addProductToCollection,
  removeProductFromCollection,
} from "../controllers/collectionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get("/", getCollections);
router.get("/:slug", getCollectionBySlug);

router.post("/", protect, admin, upload.single("coverImage"), createCollection);
router.put("/:id", protect, admin, updateCollection);
router.patch("/:id/cover", protect, admin, upload.single("coverImage"), updateCollectionCover);
router.delete("/:id", protect, admin, deleteCollection);
router.post("/:id/products", protect, admin, addProductToCollection);
router.delete("/:id/products/:productId", protect, admin, removeProductFromCollection);

export default router;