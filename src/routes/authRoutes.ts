import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshToken,
  logoutUser
} from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/refresh", authLimiter, refreshToken);
router.post("/logout", authLimiter, logoutUser);

export default router;
