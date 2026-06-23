import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import type { ICartItem } from "../types/Cart.js";
import { Types } from "mongoose";
import {
  addToCartSchema,
  removeCartItemSchema,
  updateCartItemSchema,
} from "../validators/cartValidators.js";

const findCartItemIndex = (
  items: ICartItem[],
  productId: string,
  variantId: string,
): number =>
  items.findIndex(
    (item) =>
      item.product.toString() === productId && item.variantId === variantId,
  );

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = addToCartSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { productId, variantId, quantity } = result.data;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    const variant = product.variants.find(
      (v) => v._id?.toString() === variantId,
    );

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found",
      });
    }

    if (variant.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
      });
    }

    const existingItemIndex = findCartItemIndex(
      cart.items,
      productId,
      variantId,
    );

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;

        if (variant.stock < newQuantity) {
          return res.status(400).json({ message: "Insufficient stock" });
        }

        existingItem.quantity = newQuantity;
      }
    } else {
      const effectivePrice = product.discountPrice ?? product.price;

      cart.items.push({
        product: new Types.ObjectId(productId),
        variantId,
        quantity,
        price: effectivePrice,
      });
    }

    await cart.save();

    return res.status(200).json({
      message: "Added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("[CartController]", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    if (!cart) {
      return res.status(200).json({
        message: "Cart is empty",
        cart: { items: [], totalPrice: 0 },
      });
    }

    return res.status(200).json({
      message: "Cart fetched successfully",
      cart,
    });
  } catch (error) {
    console.error("[CartController]", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const result = updateCartItemSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { productId, variantId, quantity } = result.data;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = findCartItemIndex(cart.items, productId, variantId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const variant = product.variants.find(
        (v) => v._id?.toString() === variantId,
      );

      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      if (variant.stock < quantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }

      const item = cart.items[itemIndex];
      if (item) {
        item.quantity = quantity;
      }
    }

    await cart.save();

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error) {
    console.error("[CartController]", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const result = removeCartItemSchema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { productId, variantId } = result.data;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = findCartItemIndex(cart.items, productId, variantId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return res.status(200).json({
      message: "Item removed successfully",
      cart,
    });
  } catch (error) {
    console.error("[CartController]", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const clearCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    console.error("[CartController]", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
