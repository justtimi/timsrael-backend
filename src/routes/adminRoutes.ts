import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, admin, (req, res) => {
  res.json({
    message: "Welcome Admin 👑"
  });
});

export default router;