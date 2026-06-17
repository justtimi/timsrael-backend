import { Document, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  variantId: string;
  quantity: number;
  price: number;
}

export interface GuestCartItem {
  product: string;
  variantId: string;
  quantity: number;
}

interface ICart{
  user: Types.ObjectId;
  items: ICartItem[];
}

export interface ICartDocument extends ICart, Document {
  totalPrice: number;
}