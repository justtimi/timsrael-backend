import { Resend } from "resend";
import { render } from "react-email";
import { PasswordResetEmail } from "../emails/PasswordResetEmail.js";
import { OrderConfirmationEmail } from "../emails/OrderConfirmationEmail.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = await render(PasswordResetEmail({ resetUrl }));

  await resend.emails.send({
    from: "Timsrael Clothing <onboarding@resend.dev>",
    to: email,
    subject: "Reset your password",
    html,
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
  const html = await render(
    OrderConfirmationEmail({
      orderId: orderData.orderId,
      totalAmount: orderData.totalAmount,
      items: orderData.items,
    }),
  );

  await resend.emails.send({
    from: "Timsrael Clothing <onboarding@resend.dev>",
    to: email,
    subject: "Order Confirmed — Timsrael Clothing",
    html,
  });
};