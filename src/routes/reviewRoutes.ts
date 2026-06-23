import express from "express";
import {
  createReview,
  getProductReviews,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", getProductReviews);
router.post("/", protect, createReview);
router.delete("/:reviewId", protect, admin, deleteReview);

export default router;
