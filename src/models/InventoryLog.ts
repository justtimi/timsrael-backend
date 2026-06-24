import { Schema, model } from "mongoose";
import type { IInventoryLogDocument } from "../types/InventoryLog.js";

const inventoryLogSchema = new Schema<IInventoryLogDocument>(
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
    quantityChange: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      enum: ["purchase", "cancellation", "manual_adjustment"],
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

inventoryLogSchema.index({ product: 1, createdAt: -1 });
inventoryLogSchema.index({ performedBy: 1 });

const InventoryLog = model<IInventoryLogDocument>(
  "InventoryLog",
  inventoryLogSchema,
);

export default InventoryLog;
