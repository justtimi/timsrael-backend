import { Schema, model } from "mongoose";
import type { IWishlistDocument } from "../types/Wishlist.js";

const wishlistSchema = new Schema<IWishlistDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  { timestamps: true },
);

const Wishlist = model<IWishlistDocument>("Wishlist", wishlistSchema);

export default Wishlist;
