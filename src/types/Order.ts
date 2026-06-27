import { Document, Types } from "mongoose";

export type TrackingStatus =
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "failed_delivery";

export interface ITrackingEvent {
  status: TrackingStatus;
  note?: string;
  timestamp: Date;
}

export interface IMeasurements {
  bust: number;
  waist: number;
  hips: number;
  backLength: number;
  halfLength: number;
  sleeveLength: number;
  roundSleeve: number;
  wrist: number;
  waistToHip: number;
  waistToKnee: number;
  skirtOrGownLength: number;
}

export interface IOrderItem {
  product: Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
  measurements?: IMeasurements;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
}

interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  shippingAddress: IShippingAddress;
  trackingHistory: ITrackingEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderDocument extends IOrder, Document {}
