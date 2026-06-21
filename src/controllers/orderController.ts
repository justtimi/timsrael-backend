import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { Types } from "mongoose";
import { createOrderSchema } from "../validators/orderValidators.js";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const result = createOrderSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { shippingAddress } = result.data;

    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Fetch all products in one query
    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    const orderItems = [];

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        return res.status(404).json({ message: "Product not found in cart" });
      }

      const variant = product.variants.find(
        (v) => v._id.toString() === item.variantId,
      );

      if (!variant) {
        return res.status(404).json({ message: "Variant not found" });
      }

      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Only ${variant.stock} units left for ${product.name}`,
        });
      }

      // Atomic stock deduction — prevents race conditions
      const updated = await Product.updateOne(
        {
          _id: product._id,
          "variants._id": new Types.ObjectId(item.variantId),
          "variants.$.stock": { $gte: item.quantity },
        },
        {
          $inc: { "variants.$.stock": -item.quantity },
        },
      );

      if (updated.modifiedCount === 0) {
        return res.status(400).json({
          message: `Stock changed during checkout for ${product.name}. Please review your cart.`,
        });
      }

      orderItems.push({
        product: product._id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price, // use price stored at time of adding to cart
      });
    }

    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: cart.totalPrice,
      shippingAddress,
    });

    cart.items = [];
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("[OrderController] createOrder:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
