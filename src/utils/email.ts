import { Resend } from "resend";
import { passwordResetTemplate } from "../emails/passwordResetTemplate.js";
import { orderConfirmationTemplate } from "../emails/orderConfirmationTemplate.js";
import { lowStockAlertTemplate } from "../emails/lowStockAlertTemplate.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: "Timsrael Clothing <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password",
    html: passwordResetTemplate(resetUrl),
  });
};

export const sendOrderConfirmationEmail = async (
  email: string,
  orderData: {
    orderId: string;
    totalAmount: number;
    items: { name: string; quantity: number; price: number }[];
  },
) => {
  await resend.emails.send({
    from: "Timsrael Clothing <onboarding@resend.dev>",
    to: email,
    subject: "Order Confirmed — Timsrael Clothing",
    html: orderConfirmationTemplate(
      orderData.orderId,
      orderData.totalAmount,
      orderData.items,
    ),
  });
};

export const sendLowStockAlertEmail = async (
  items: {
    productName: string;
    variantId: string;
    color: string;
    size: string;
    currentStock: number;
    threshold: number;
  }[],
) => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.error("[Email] ADMIN_EMAIL is not set — skipping low stock alert");
    return;
  }

  await resend.emails.send({
    from: "Timsrael Clothing <onboarding@resend.dev>",
    to: adminEmail,
    subject: "Low Stock Alert — Timsrael Clothing",
    html: lowStockAlertTemplate(items),
  });
};
