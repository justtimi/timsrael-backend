import { Schema, model } from "mongoose";
import type { IOrderDocument } from "../types/Order.js";

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
