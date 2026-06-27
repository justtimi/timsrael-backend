import { Document, Types } from "mongoose";

export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded";

export interface IReturnItem {
  product: Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
}

export interface IReturnRequest {
  order: Types.ObjectId;
  user: Types.ObjectId;
  items: IReturnItem[];
  reason: string;
  status: ReturnStatus;
  adminNote?: string;
  refundAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReturnRequestDocument extends IReturnRequest, Document {}