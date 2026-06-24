import { Document, Types } from "mongoose";

export type InventoryLogReason =
  | "purchase"
  | "cancellation"
  | "manual_adjustment";

export interface IInventoryLog {
  product: Types.ObjectId;
  variantId: string;
  quantityChange: number;
  reason: InventoryLogReason;
  performedBy: Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryLogDocument extends IInventoryLog, Document {}