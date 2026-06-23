import type { Request, Response } from "express";
import crypto from "crypto";
import Order from "../models/Order.js";

export const initializePayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.id;

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order has already been paid" });
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: req.user.email,
          amount: Math.round(order.totalAmount * 100), // Paystack uses kobo
          reference: `order_${order._id}_${Date.now()}`,
          callback_url: `${process.env.CLIENT_URL}/payment/verify`,
          metadata: {
            orderId: order._id.toString(),
          },
        }),
      },
    );

    const data = (await response.json()) as {
      status: boolean;
      data: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    if (!data.status) {
      console.error("[PaymentController] Paystack init error:", data);
      return res.status(500).json({ message: "Payment initialization failed" });
    }

    return res.status(200).json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    console.error("[PaymentController] initializePayment:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-paystack-signature"] as string;

    if (!signature) {
      return res.status(400).json({ message: "Missing signature" });
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY as string)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const orderId = event.data?.metadata?.orderId;

      if (!orderId) {
        return res.status(400).json({ message: "Missing order ID in webhook" });
      }

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (order.status === "pending") {
        order.status = "paid";
        await order.save();
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[PaymentController] handleWebhook:", error);
    return res.status(500).json({ message: "An unexpected error occurred" });
  }
};
