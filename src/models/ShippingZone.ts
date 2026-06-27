import { Schema, model } from "mongoose";
import type { IShippingZoneDocument } from "../types/ShippingZone.js";

const shippingTierSchema = new Schema(
  {
    minOrderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxOrderValue: {
      type: Number,
    },
    additionalFee: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const shippingZoneSchema = new Schema<IShippingZoneDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    states: {
      type: [String],
      required: true,
    },
    baseFee: {
      type: Number,
      required: true,
      min: 0,
    },
    tiers: {
      type: [shippingTierSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

shippingZoneSchema.index({ states: 1 });
shippingZoneSchema.index({ isActive: 1 });

const ShippingZone = model<IShippingZoneDocument>(
  "ShippingZone",
  shippingZoneSchema,
);

export default ShippingZone;