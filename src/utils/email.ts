import { Resend } from "resend";
import { passwordResetTemplate } from "../emails/passwordResetTemplate.js";
import { orderConfirmationTemplate } from "../emails/orderConfirmationTemplate.js";

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