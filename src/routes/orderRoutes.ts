import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  getAllOrders,
  updateOrderStatus,
  addTrackingEvent,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getAllOrders);
router.patch("/:id/status", protect, admin, updateOrderStatus);
router.post("/:id/tracking", protect, admin, addTrackingEvent);

router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.get("/my/:id", protect, getMyOrderById);
router.delete("/my/:id", protect, cancelMyOrder);

export default router;
