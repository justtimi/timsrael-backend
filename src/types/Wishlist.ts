import { Document, Types } from "mongoose";

export interface IWishlist {
  user: Types.ObjectId;
  products: Types.ObjectId[];
}

export interface IWishlistDocument extends IWishlist, Document {}
