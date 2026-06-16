import type { ICartItem } from "../types/Cart.js";
import Product from "../models/Product.js";

export const calculateCartTotal = async (
  items: ICartItem[],
): Promise<number> => {
  if (items.length === 0) return 0;

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const priceMap = new Map(products.map((p) => [p._id.toString(), p.price]));

  return items.reduce((total, item) => {
    const price = priceMap.get(item.product.toString()) ?? 0;
    return total + price * item.quantity;
  }, 0);
};
