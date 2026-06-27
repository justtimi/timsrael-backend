import express from "express";
import {
  createReturnRequest,
  getMyReturnRequests,
  getAllReturnRequests,
  reviewReturnRequest,
} from "../controllers/returnController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createReturnRequest);
router.get("/my", protect, getMyReturnRequests);

// Admin routes
router.get("/", protect, admin, getAllReturnRequests);
router.patch("/:id/review", protect, admin, reviewReturnRequest);

export default router;