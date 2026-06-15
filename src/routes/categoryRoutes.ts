import express from "express";
import {
  createCategory,
  getCategories,
  getCategory,
} from "../controllers/categoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createCategory);

router.get("/", getCategories);

router.get("/:slug", getCategory);

export default router;