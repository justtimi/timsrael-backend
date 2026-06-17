import Cart from "../models/Cart.js";
import type { GuestCartItem } from "../types/Cart.js";
import { Types } from "mongoose";
import Product from "../models/Product.js";

export const mergeGuestCartWithUserCart = async (
  userId: string,
  guestItems: GuestCartItem[],
) => {
  // 1. Get user cart
  let userCart = await Cart.findOne({ user: userId });

  if (!userCart) {
    userCart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  // 2. Merge items
  for (const guestItem of guestItems) {
    const product = await Product.findById(guestItem.product);

    if (!product) continue;

    const existingIndex = userCart.items.findIndex(
      (item) =>
        item.product.toString() === guestItem.product &&
        item.variantId === guestItem.variantId,
    );

    if (existingIndex > -1) {
      const existingItem = userCart.items[existingIndex];

      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
      }
    } else {
      const effectivePrice = product.discountPrice ?? product.price;
      userCart.items.push({
        product: new Types.ObjectId(guestItem.product),
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
        price: effectivePrice,
      });
    }
  }
  await userCart.save();

  return userCart;
};
