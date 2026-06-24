interface LowStockItem {
  productName: string;
  variantId: string;
  color: string;
  size: string;
  currentStock: number;
  threshold: number;
}

export const lowStockAlertTemplate = (items: LowStockItem[]): string => {
  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.productName}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${item.color} / ${item.size}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#cc0000;">
          ${item.currentStock}
        </td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">
          ${item.threshold}
        </td>
      </tr>
    `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
  <body style="font-family:sans-serif;background:#f9f9f9;padding:32px;">
    <div style="background:#fff;padding:32px;max-width:600px;margin:0 auto;">
      <h1 style="color:#000;margin:0 0 16px;">Timsrael Clothing</h1>
      <hr style="border-color:#eee;margin:16px 0;" />
      <h2 style="color:#cc0000;">Low Stock Alert</h2>
      <p style="color:#444;line-height:1.6;">
        The following product variants have dropped to or below their low stock threshold:
      </p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px;text-align:left;border-bottom:2px solid #000;">Product</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #000;">Variant</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #000;">Current Stock</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #000;">Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <p style="color:#444;line-height:1.6;">Please restock these items as soon as possible.</p>
    </div>
  </body>
</html>
  `;
};