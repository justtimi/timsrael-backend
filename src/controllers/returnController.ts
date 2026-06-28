import type { Request, Response } from "express";
import ReturnRequest from "../models/Return.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { Types } from "mongoose";
import {
  createReturnRequestSchema,
  reviewReturnRequestSchema,
} from "../validators/returnValidators.js";
import { flattenErrors } from "../utils/zodErrors.js";

const RETURN_WINDOW_DAYS = 7;

export const createReturnRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const result = createReturnRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { orderId, items, reason } = result.data;

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        message: "Only delivered orders can be returned",
      });
    }

    // Check return window
    const deliveredAt = order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
      return res.status(400).json({
        message: `Return window of ${RETURN_WINDOW_DAYS} days has passed`,
      });
    }

    // Check for existing return request on this order
    const existingReturn = await ReturnRequest.findOne({ order: orderId });

    if (existingReturn) {
      return res.status(400).json({
        message: "A return request already exists for this order",
      });
    }

    // Validate return items against order items
    const returnItems = [];
    let refundAmount = 0;

    for (const returnItem of items) {
      const orderItem = order.items.find(
        (oi) =>
          oi.product.toString() === returnItem.product &&
          oi.variantId === returnItem.variantId,
      );

      if (!orderItem) {
        return res.status(400).json({
          message: "Return item does not match any item in the order",
        });
      }

      if (returnItem.quantity > orderItem.quantity) {
        return res.status(400).json({
          message: "Return quantity cannot exceed ordered quantity",
        });
      }

      refundAmount += orderItem.price * returnItem.quantity;

      returnItems.push({
        product: new Types.ObjectId(returnItem.product),
        variantId: returnItem.variantId,
        quantity: returnItem.quantity,
        price: orderItem.price,
      });
    }

    const returnRequest = await ReturnRequest.create({
      order: new Types.ObjectId(orderId),
      user: new Types.ObjectId(userId),
      items: returnItems,
      reason,
      refundAmount,
    });

    return res.status(201).json({
      message: "Return request submitted successfully",
      returnRequest,
    });
  } catch (error) {
    console.error("[ReturnController] createReturnRequest:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getMyReturnRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [returnRequests, total] = await Promise.all([
      ReturnRequest.find({ user: userId })
        .populate("order", "totalAmount createdAt")
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ReturnRequest.countDocuments({ user: userId }),
    ]);

    return res.status(200).json({
      message: "Return requests fetched successfully",
      data: returnRequests,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ReturnController] getMyReturnRequests:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const getAllReturnRequests = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    const ALLOWED_STATUSES = ["requested", "approved", "rejected", "refunded"];

    if (status) {
      if (!ALLOWED_STATUSES.includes(status as string)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      query.status = status;
    }

    const [returnRequests, total] = await Promise.all([
      ReturnRequest.find(query)
        .populate("user", "name email")
        .populate("order", "totalAmount createdAt")
        .populate("items.product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      ReturnRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Return requests fetched successfully",
      data: returnRequests,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ReturnController] getAllReturnRequests:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const reviewReturnRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid return request ID" });
    }

    const result = reviewReturnRequestSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: flattenErrors(result.error),
      });
    }

    const { status, adminNote } = result.data;

    const returnRequest = await ReturnRequest.findById(id);

    if (!returnRequest) {
      return res.status(404).json({ message: "Return request not found" });
    }

    if (returnRequest.status !== "requested" && status !== "refunded") {
      return res.status(400).json({
        message: `Cannot update return request with status "${returnRequest.status}"`,
      });
    }

    if (status === "refunded" && returnRequest.status !== "approved") {
      return res.status(400).json({
        message: "Only approved return requests can be marked as refunded",
      });
    }

    if (status === "approved") {
      // Restore stock
      await Promise.all(
        returnRequest.items.map((item) =>
          Product.updateOne(
            {
              _id: item.product,
              "variants._id": new Types.ObjectId(item.variantId),
            },
            { $inc: { "variants.$.stock": item.quantity } },
          ),
        ),
      );
      const order = await Order.findById(returnRequest.order);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (!order.paystackReference) {
        return res.status(400).json({
          message:
            "Order has no payment reference — refund must be processed manually",
        });
      }

      const paystackResponse = await fetch("https://api.paystack.co/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: order.paystackReference,
          amount: Math.round(returnRequest.refundAmount * 100), // Paystack uses kobo
        }),
      });

      const paystackData = (await paystackResponse.json()) as {
        status: boolean;
        message: string;
      };

      if (!paystackData.status) {
        console.error(
          "[ReturnController] Paystack refund failed:",
          paystackData,
        );
        return res.status(500).json({
          message:
            "Stock restored but refund failed. Please process manually on Paystack dashboard.",
        });
      }

      returnRequest.status = "approved";
      if (adminNote !== undefined) returnRequest.adminNote = adminNote;
      await returnRequest.save();

      return res.status(200).json({
        message: "Return approved and refund initiated successfully",
        returnRequest,
      });
    }

    returnRequest.status = status;
    if (adminNote !== undefined) returnRequest.adminNote = adminNote;
    await returnRequest.save();

    return res.status(200).json({
      message: "Return request updated successfully",
      returnRequest,
    });
  } catch (error) {
    console.error("[ReturnController] reviewReturnRequest:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
