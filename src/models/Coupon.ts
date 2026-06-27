import { Schema, model } from "mongoose";
import type { ICouponDocument } from "../types/Coupon.js";

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["percentage", "fixed", "free_shipping"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minOrderValue: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    usageLimit: {
      type: Number,
      required: true,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    usedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

const Coupon = model<ICouponDocument>("Coupon", couponSchema);

export default Coupon;
