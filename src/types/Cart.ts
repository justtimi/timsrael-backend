import { Document, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  variantId: string;
  quantity: number;
}

interface ICart{
  user: Types.ObjectId;
  items: ICartItem[];
  totalPrice: number;
}

export interface ICartDocument extends ICart, Document {}