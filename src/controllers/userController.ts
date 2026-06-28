import type { Request, Response } from "express";
import { User } from "../models/User.js";
import bcrypt from "bcryptjs";
import {
  updateProfileSchema,
  changePasswordSchema,
} from "../validators/userValidators.js";
import { flattenErrors } from "../utils/zodErrors.js";

const BCRYPT_SALT_ROUNDS = 12;

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpires",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("[UserController] getMe:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = updateProfileSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { name, email } = result.data;

    if (!name && !email) {
      return res.status(400).json({
        message: "At least one field must be provided",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error("[UserController] updateMe:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { currentPassword, newPassword } = result.data;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("[UserController] changePassword:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
