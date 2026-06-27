import { Document, Types } from "mongoose";

export type CouponType = "percentage" | "fixed" | "free_shipping";

export interface ICoupon {
  code: string;
  type: CouponType;
  value: number;
  minOrderValue: number;
  usageLimit: number;
  usageCount: number;
  usedBy: Types.ObjectId[];
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponDocument extends ICoupon, Document {}
