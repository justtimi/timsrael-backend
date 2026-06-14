import express from "express";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", protect, (req: any, res) => {
  res.json({
    message: "Welcome to protected route 🔐",
    user: req.user,
  });
});

export default router;