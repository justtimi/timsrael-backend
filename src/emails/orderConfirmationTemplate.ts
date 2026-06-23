interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export const orderConfirmationTemplate = (
  orderId: string,
  totalAmount: number,
  items: OrderItem[],
): string => {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">₦${item.price.toLocaleString()}</td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f9f9f9;padding:32px;">
    <div style="background:#fff;padding:32px;max-width:520px;margin:0 auto;">
      <h1 style="color:#000;margin:0 0 16px;">Timsrael Clothing</h1>
      <hr style="border-color:#eee;margin:16px 0;" />
      <h2 style="color:#000;">Order Confirmed!</h2>
      <p style="color:#444;line-height:1.6;">Thank you for your order. Here's a summary:</p>
      <p style="color:#444;">Order ID: <strong>${orderId}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;text-align:left;border-bottom:2px solid #000;">Item</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #000;">Qty</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #000;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p style="font-size:16px;font-weight:bold;color:#000;">
        Total: ₦${totalAmount.toLocaleString()}
      </p>
      <p style="color:#444;line-height:1.6;">We'll notify you when your order ships.</p>
    </div>
  </body>
</html>
  `;
};