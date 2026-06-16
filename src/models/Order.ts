import { Schema, model } from "mongoose";
import type { IOrderDocument } from "../types/Order.js";

const orderItemSchema = new Schema(
  {
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
  },
  { _id: false }
);

const shippingSchema = new Schema(
  {
    fullName: String,
    phone: String,
    address: String,
    city: String,
    country: String,
  },
  { _id: false }
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

    shippingAddress: shippingSchema,
  },
  {
    timestamps: true,
  }
);

const Order = model<IOrderDocument>("Order", orderSchema);

export default Order;