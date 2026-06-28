import type { Request, Response } from "express";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { Types } from "mongoose";
import { createOrderSchema } from "../validators/orderValidators.js";
import mongoose from "mongoose";
import Address from "../models/Address.js";
import type {
  ShippingAddressInput,
  MeasurementsInput,
} from "../validators/orderValidators.js";
import { logInventoryChange } from "../utils/inventoryLogger.js";
import type { TrackingStatus } from "../types/Order.js";
import { trackingEventSchema } from "../validators/orderValidators.js";
import {
  sendOrderConfirmationEmail,
  sendLowStockAlertEmail,
} from "../utils/email.js";
import ShippingZone from "../models/ShippingZone.js";
import Coupon from "../models/Coupon.js";
import { flattenErrors } from "../utils/zodErrors.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const result = createOrderSchema.safeParse(req.body);

    if (!result.success) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const {
      shippingAddress: shippingAddressInput,
      addressId,
      measurements,
      couponCode,
    } = result.data;

    let shippingAddress: ShippingAddressInput;

    if (addressId) {
      const savedAddress = await Address.findOne({
        _id: addressId,
        user: userId,
      }).session(session);

      if (!savedAddress) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Address not found" });
      }

      shippingAddress = {
        fullName: savedAddress.fullName,
        phone: savedAddress.phone,
        address: savedAddress.address,
        city: savedAddress.city,
        state: savedAddress.state,
        country: savedAddress.country,
      };
    } else {
      shippingAddress = shippingAddressInput!;
    }

    const cart = await Cart.findOne({ user: userId }).session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Cart is empty" });
    }

    const shippingZone = await ShippingZone.findOne({
      states: shippingAddress.state,
      isActive: true,
    }).session(session);

    if (!shippingZone) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "No shipping available for your location",
      });
    }

    const cartTotal = cart.totalPrice ?? 0;

    const matchingTier = shippingZone.tiers
      .filter((tier) => cartTotal >= tier.minOrderValue)
      .filter(
        (tier) =>
          tier.maxOrderValue === undefined || cartTotal <= tier.maxOrderValue,
      )
      .sort((a, b) => b.minOrderValue - a.minOrderValue)[0];

    const shippingFee =
      shippingZone.baseFee + (matchingTier?.additionalFee ?? 0);

    const productIds = cart.items.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } }).session(
      session,
    );
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Check for price changes and refresh cart if needed
    let cartPriceChanged = false;

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) continue;

      const currentPrice = product.discountPrice ?? product.price;

      if (item.price !== currentPrice) {
        item.price = currentPrice;
        cartPriceChanged = true;
      }
    }

    if (cartPriceChanged) {
      await session.abortTransaction();
      session.endSession();

      // Save price updates outside the transaction so they persist
      await cart.save();

      return res.status(409).json({
        message:
          "Some item prices have changed since you added them to your cart. Your cart has been updated with the latest prices. Please review and confirm your order.",
        code: "CART_PRICE_UPDATED",
      });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode,
        isActive: true,
      }).session(session);

      if (!coupon) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Invalid coupon code" });
      }

      if (coupon.expiresAt < new Date()) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Coupon has expired" });
      }

      if (coupon.usageCount >= coupon.usageLimit) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      const alreadyUsed = coupon.usedBy.some((id) => id.toString() === userId);

      if (alreadyUsed) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: "You have already used this coupon",
        });
      }

      if (cartTotal < coupon.minOrderValue) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Minimum order value of ₦${coupon.minOrderValue.toLocaleString()} required for this coupon`,
        });
      }

      if (coupon.type === "percentage") {
        discountAmount = Math.round((cartTotal * coupon.value) / 100);
      } else if (coupon.type === "fixed") {
        discountAmount = Math.min(coupon.value, cartTotal);
      } else if (coupon.type === "free_shipping") {
        discountAmount = shippingFee;
      }

      appliedCoupon = coupon;
    }

    const orderItems = [];

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Product not found in cart" });
      }

      const variant = product.variants.find(
        (v) => v._id?.toString() === item.variantId,
      );

      if (!variant) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "Variant not found" });
      }

      if (variant.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Only ${variant.stock} units left for ${product.name}`,
        });
      }

      const updated = await Product.updateOne(
        {
          _id: product._id,
          "variants._id": new Types.ObjectId(item.variantId),
          "variants.$.stock": { $gte: item.quantity },
        },
        { $inc: { "variants.$.stock": -item.quantity } },
        { session },
      );

      if (updated.modifiedCount === 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          message: `Stock changed during checkout for ${product.name}. Please review your cart.`,
        });
      }

      await logInventoryChange({
        productId: product._id.toString(),
        variantId: item.variantId,
        quantityChange: -item.quantity,
        reason: "purchase",
        performedBy: userId,
        session,
      });

      let itemMeasurements: MeasurementsInput | undefined;

      if (product.requiresMeasurements) {
        const productMeasurements = measurements?.[item.variantId];

        if (!productMeasurements) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            message: `Measurements are required for ${product.name}`,
          });
        }

        itemMeasurements = productMeasurements;
      } else if (product.allowCustomMeasurements) {
        const productMeasurements = measurements?.[item.variantId];

        if (productMeasurements) {
          itemMeasurements = productMeasurements;
        }
      }

      orderItems.push({
        product: product._id,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
        ...(itemMeasurements !== undefined && {
          measurements: itemMeasurements,
        }),
      });
    }

    const createdOrders = await Order.create(
      [
        {
          user: userId,
          items: orderItems,
          shippingFee,
          totalAmount: cartTotal + shippingFee - discountAmount,
          discountAmount,
          ...(couponCode !== undefined && { couponCode }),
          shippingAddress,
        },
      ],
      { session },
    );

    const order = createdOrders[0];

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({ message: "Failed to create order" });
    }

    cart.items = [];
    if (appliedCoupon) {
      appliedCoupon.usageCount += 1;
      appliedCoupon.usedBy.push(new Types.ObjectId(userId));
      await appliedCoupon.save({ session });
    }
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    try {
      const populatedOrder = await Order.findById(order._id).populate<{
        items: { product: { name: string }; quantity: number; price: number }[];
      }>("items.product", "name");

      if (populatedOrder) {
        await sendOrderConfirmationEmail(req.user.email, {
          orderId: order._id.toString(),
          totalAmount: order.totalAmount,
          items: populatedOrder.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.price,
          })),
        });
      }
    } catch (emailError) {
      console.error(
        "[OrderController] Failed to send order confirmation:",
        emailError,
      );
      // Order is already created — don't fail the request over email
    }

    try {
      const lowStockItems: {
        productName: string;
        variantId: string;
        color: string;
        size: string;
        currentStock: number;
        threshold: number;
      }[] = [];

      for (const item of orderItems) {
        const product = productMap.get(item.product.toString());

        if (!product) continue;

        const variant = product.variants.find(
          (v) => v._id?.toString() === item.variantId,
        );

        if (!variant) continue;

        const currentStock = variant.stock - item.quantity;

        if (currentStock <= product.lowStockThreshold) {
          lowStockItems.push({
            productName: product.name,
            variantId: item.variantId,
            color: variant.color,
            size: variant.size,
            currentStock,
            threshold: product.lowStockThreshold,
          });
        }
      }

      if (lowStockItems.length > 0) {
        await sendLowStockAlertEmail(lowStockItems);
      }
    } catch (alertError) {
      console.error(
        "[OrderController] Failed to send low stock alert:",
        alertError,
      );
    }

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
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

    await Promise.all(
      order.items.map((item) =>
        logInventoryChange({
          productId: item.product.toString(),
          variantId: item.variantId,
          quantityChange: item.quantity,
          reason: "cancellation",
          performedBy: userId,
        }),
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

export const addTrackingEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid order ID" });
    }

    const result = trackingEventSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { status, note } = result.data;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        message: "Cannot add tracking to a cancelled order",
      });
    }

    const trackingEvent = {
      status: status as TrackingStatus,
      timestamp: new Date(),
      ...(note !== undefined && { note }),
    };

    order.trackingHistory.push(trackingEvent);
    await order.save();

    return res.status(201).json({
      message: "Tracking event added successfully",
      order,
    });
  } catch (error) {
    console.error("[OrderController] addTrackingEvent:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
