import express from "express";
import {
  adjustStock,
  getInventoryLogs,
} from "../controllers/inventoryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/logs", protect, admin, getInventoryLogs);
router.patch("/adjust", protect, admin, adjustStock);

export default router;