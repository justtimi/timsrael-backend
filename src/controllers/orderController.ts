import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const { shippingAddress } = req.body;

    // 1. Get cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    // 2. Validate stock again + build order items
    const orderItems = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).json({
          message: "Product not found in cart",
        });
      }

      const variant = product.variants.find(
        (v: any) =>
          `${v.size}-${v.color}` === item.variantId
      );

      if (!variant) {
        return res.status(404).json({
          message: "Variant not found",
        });
      }

      // stock check
      if (variant.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`,
        });
      }

      // push order item
      orderItems.push({
        product: product._id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: product.price,
      });

      // 3. Reduce stock
      variant.stock -= item.quantity;

      await product.save();
    }

    // 4. Create order
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount: cart.totalPrice,
      shippingAddress,
    });

    // 5. Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

