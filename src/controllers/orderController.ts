import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { Types } from "mongoose";
import { createOrderSchema } from "../validators/orderValidators.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

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

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ user: userId })
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[OrderController] getMyOrders:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getMyOrderById = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: userId }).populate(
      "items.product",
      "name images",
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json({
      message: "Order fetched successfully",
      order,
    });
  } catch (error) {
    console.error("[OrderController] getMyOrderById:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const cancelMyOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["shipped", "delivered", "cancelled"].includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled — current status is ${order.status}`,
      });
    }

    // Restore stock for each item
    await Promise.all(
      order.items.map((item) =>
        Product.updateOne(
          {
            _id: item.product,
            "variants._id": new Types.ObjectId(item.variantId),
          },
          { $inc: { "variants.$.stock": item.quantity } },
        ),
      ),
    );

    order.status = "cancelled";
    await order.save();

    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("[OrderController] cancelMyOrder:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    const ALLOWED_STATUSES = [
      "pending",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (status) {
      if (!ALLOWED_STATUSES.includes(status as string)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      query.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "name email")
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[OrderController] getAllOrders:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const ALLOWED_STATUSES = [
      "pending",
      "paid",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const allowedNext = VALID_TRANSITIONS[order.status] ?? [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        message: `Cannot transition order from "${order.status}" to "${status}"`,
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("[OrderController] updateOrderStatus:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
