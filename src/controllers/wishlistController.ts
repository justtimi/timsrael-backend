import type { Request, Response } from "express";
import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { Types } from "mongoose";

export const getWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId }).populate(
      "products",
      "name images price discountPrice status",
    );

    if (!wishlist) {
      return res.status(200).json({
        message: "Wishlist is empty",
        wishlist: { products: [] },
      });
    }

    return res.status(200).json({
      message: "Wishlist fetched successfully",
      wishlist,
    });
  } catch (error) {
    console.error("[WishlistController] getWishlist:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const addToWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await Product.findOne({
      _id: productId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: userId,
        products: [new Types.ObjectId(productId)],
      });

      return res.status(201).json({
        message: "Product added to wishlist",
        wishlist,
      });
    }

    const alreadyInWishlist = wishlist.products.some(
      (p) => p.toString() === productId,
    );

    if (alreadyInWishlist) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.products.push(new Types.ObjectId(productId));
    await wishlist.save();

    return res.status(200).json({
      message: "Product added to wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("[WishlistController] addToWishlist:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    if (
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const productIndex = wishlist.products.findIndex(
      (p) => p.toString() === productId,
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    return res.status(200).json({
      message: "Product removed from wishlist",
      wishlist,
    });
  } catch (error) {
    console.error("[WishlistController] removeFromWishlist:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const moveToCart = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { variantId } = req.body;

    if (
      !productId ||
      typeof productId !== "string" ||
      !Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    if (!variantId || typeof variantId !== "string") {
      return res.status(400).json({ message: "Variant ID is required" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const productInWishlist = wishlist.products.some(
      (p) => p.toString() === productId,
    );

    if (!productInWishlist) {
      return res.status(404).json({ message: "Product not in wishlist" });
    }

    const product = await Product.findOne({
      _id: productId,
      isDeleted: { $ne: true },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const variant = product.variants.find(
      (v) => v._id?.toString() === variantId,
    );

    if (!variant) {
      return res.status(404).json({ message: "Variant not found" });
    }

    if (variant.stock < 1) {
      return res.status(400).json({ message: "Product is out of stock" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId && item.variantId === variantId,
    );

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;
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
        quantity: 1,
        price: effectivePrice,
      });
    }

    await cart.save();

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId,
    );
    await wishlist.save();

    return res.status(200).json({
      message: "Product moved to cart",
      cart,
      wishlist,
    });
  } catch (error) {
    console.error("[WishlistController] moveToCart:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
