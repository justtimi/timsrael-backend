import type { Request, Response } from "express";
import Coupon from "../models/Coupon.js";
import { Types } from "mongoose";
import {
  createCouponSchema,
  updateCouponSchema,
} from "../validators/couponValidators.js";
import { flattenErrors } from "../utils/zodErrors.js";

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const result = createCouponSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const {
      code,
      type,
      value,
      minOrderValue,
      usageLimit,
      expiresAt,
      isActive,
    } = result.data;

    const existingCoupon = await Coupon.findOne({ code });

    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      type,
      value,
      minOrderValue,
      usageLimit,
      expiresAt: new Date(expiresAt),
      ...(isActive !== undefined && { isActive }),
    });

    return res.status(201).json({
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("[CouponController] createCoupon:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Coupons fetched successfully",
      data: coupons,
    });
  } catch (error) {
    console.error("[CouponController] getCoupons:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getCouponById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    return res.status(200).json({
      message: "Coupon fetched successfully",
      coupon,
    });
  } catch (error) {
    console.error("[CouponController] getCouponById:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    const result = updateCouponSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const {
      code,
      type,
      value,
      minOrderValue,
      usageLimit,
      expiresAt,
      isActive,
    } = result.data;

    if (code !== undefined && code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon) {
        return res.status(400).json({ message: "Coupon code already exists" });
      }
    }

    if (code !== undefined) coupon.code = code;
    if (type !== undefined) coupon.type = type;
    if (value !== undefined) coupon.value = value;
    if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (expiresAt !== undefined) coupon.expiresAt = new Date(expiresAt);
    if (isActive !== undefined) coupon.isActive = isActive;

    await coupon.save();

    return res.status(200).json({
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("[CouponController] updateCoupon:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid coupon ID" });
    }

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    await coupon.deleteOne();

    return res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("[CouponController] deleteCoupon:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const validateCoupon = async (req: Request, res: Response) => {
  try {
    const { couponCode, orderTotal } = req.body;
    const userId = req.user.id;

    if (!couponCode || typeof couponCode !== "string") {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    if (
      orderTotal === undefined ||
      typeof orderTotal !== "number" ||
      orderTotal < 0
    ) {
      return res.status(400).json({ message: "Valid order total is required" });
    }

    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    if (coupon.expiresAt < new Date()) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit reached" });
    }

    const alreadyUsed = coupon.usedBy.some((id) => id.toString() === userId);

    if (alreadyUsed) {
      return res.status(400).json({
        message: "You have already used this coupon",
      });
    }

    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({
        message: `Minimum order value of ₦${coupon.minOrderValue.toLocaleString()} required for this coupon`,
      });
    }

    let discountAmount = 0;

    if (coupon.type === "percentage") {
      discountAmount = Math.round((orderTotal * coupon.value) / 100);
    } else if (coupon.type === "fixed") {
      discountAmount = Math.min(coupon.value, orderTotal);
    } else if (coupon.type === "free_shipping") {
      discountAmount = 0;
    }

    return res.status(200).json({
      message: "Coupon is valid",
      data: {
        code: coupon.code,
        type: coupon.type,
        discountAmount,
        freeShipping: coupon.type === "free_shipping",
      },
    });
  } catch (error) {
    console.error("[CouponController] validateCoupon:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
