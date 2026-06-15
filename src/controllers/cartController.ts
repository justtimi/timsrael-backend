import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const addToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // from protect middleware

    const { productId, variantId, quantity } = req.body;

    // 1. Validate product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // 2. Find variant
    const variant = product.variants.find(
      (v: any) =>
        `${v.size}-${v.color}` === variantId
    );

    if (!variant) {
      return res.status(404).json({
        message: "Variant not found",
      });
    }

    // 3. Check stock
    if (variant.stock < quantity) {
      return res.status(400).json({
        message: "Insufficient stock",
      });
    }

    // 4. Get or create cart
    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [],
        totalPrice: 0,
      });
    }

    // 5. Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variantId === variantId
    );

    if (existingItemIndex > -1) {
      // update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // add new item
      cart.items.push({
        product: productId,
        variantId,
        quantity,
      });
    }

    // 6. Recalculate total price
    let total = 0;

    for (const item of cart.items) {
      const prod = await Product.findById(item.product);

      if (!prod) continue;

      total += prod.price * item.quantity;
    }

    cart.totalPrice = total;

    // 7. Save cart
    await cart.save();

    return res.status(200).json({
      message: "Added to cart successfully",
      cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId }).populate(
      "items.product"
    );

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
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.variantId === variantId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    // if quantity is 0 → remove item
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    // recalculate total
    let total = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      total += product.price * item.quantity;
    }

    cart.totalPrice = total;

    await cart.save();

    return res.status(200).json({
      message: "Cart updated successfully",
      cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const removeCartItem = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId, variantId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.variantId === variantId
        )
    );

    // recalc total
    let total = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) continue;

      total += product.price * item.quantity;
    }

    cart.totalPrice = total;

    await cart.save();

    return res.status(200).json({
      message: "Item removed successfully",
      cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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
    cart.totalPrice = 0;

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};