import { Document, Types } from "mongoose";

export interface IOrderItem {
  product: Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shippingAddress: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}
export interface IOrderDocument extends IOrder, Document {}