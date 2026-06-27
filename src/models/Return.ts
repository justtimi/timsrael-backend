import { Schema, model } from "mongoose";
import type { IReturnRequestDocument } from "../types/Return.js";

const returnItemSchema = new Schema(
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
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const returnRequestSchema = new Schema<IReturnRequestDocument>(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [returnItemSchema],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "refunded"],
      default: "requested",
    },
    adminNote: {
      type: String,
      trim: true,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

returnRequestSchema.index({ order: 1 });
returnRequestSchema.index({ user: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1 });

const ReturnRequest = model<IReturnRequestDocument>(
  "ReturnRequest",
  returnRequestSchema,
);

export default ReturnRequest;
