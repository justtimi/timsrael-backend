import { Schema, model } from "mongoose";
import type { IOrderDocument } from "../types/Order.js";

const measurementsSchema = new Schema(
  {
    bust: { type: Number, required: true },
    waist: { type: Number, required: true },
    hips: { type: Number, required: true },
    backLength: { type: Number, required: true },
    halfLength: { type: Number, required: true },
    sleeveLength: { type: Number, required: true },
    roundSleeve: { type: Number, required: true },
    wrist: { type: Number, required: true },
    waistToHip: { type: Number, required: true },
    waistToKnee: { type: Number, required: true },
    skirtOrGownLength: { type: Number, required: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  variantId: {
    type: String,
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },
  measurements: {
    type: measurementsSchema,
    required: false,
  },
});

const shippingSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const trackingEventSchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
      ],
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    shippingAddress: { type: shippingSchema, required: true },

    trackingHistory: {
      type: [trackingEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const Order = model<IOrderDocument>("Order", orderSchema);

export default Order;
