import express from "express";
import { initializePayment, handleWebhook } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initialize", protect, initializePayment);
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;