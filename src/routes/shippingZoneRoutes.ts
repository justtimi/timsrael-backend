import express from "express";
import {
  createShippingZone,
  getShippingZones,
  getShippingZoneById,
  updateShippingZone,
  deleteShippingZone,
  calculateShippingFee,
} from "../controllers/shippingZoneController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/calculate", calculateShippingFee);
router.get("/", getShippingZones);

router.post("/", protect, admin, createShippingZone);
router.get("/:id", protect, admin, getShippingZoneById);
router.put("/:id", protect, admin, updateShippingZone);
router.delete("/:id", protect, admin, deleteShippingZone);

export default router;
