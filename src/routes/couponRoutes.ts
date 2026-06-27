import express from "express";
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/validate", protect, validateCoupon);

router.get("/", protect, admin, getCoupons);
router.post("/", protect, admin, createCoupon);
router.get("/:id", protect, admin, getCouponById);
router.put("/:id", protect, admin, updateCoupon);
router.delete("/:id", protect, admin, deleteCoupon);

export default router;
