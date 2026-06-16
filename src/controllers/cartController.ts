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
      (v: any) => `${v.size}-${v.color}` === variantId,
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
      });
    }

    // 5. Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.variantId === variantId,
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
      // add new item
      const effectivePrice = product.discountPrice ?? product.price;

cart.items.push({
  product: productId,
  variantId,
  quantity,
  price: effectivePrice,
});
    }



    // 7. Save cart
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
    const { productId, variantId, quantity } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.variantId === variantId,
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    // if quantity is 0 → remove item
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      // ✅ Validate stock before updating
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const variant = product.variants.find(
        (v: any) => v._id.toString() === variantId,
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
    const { productId, variantId } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId && item.variantId === variantId
        ),
    );


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
