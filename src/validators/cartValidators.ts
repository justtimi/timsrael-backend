import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const addToCartSchema = z.object({
  productId: objectId,
  variantId: objectId,
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  productId: objectId,
  variantId: objectId,
  quantity: z.number().int().min(0),
});

export const removeCartItemSchema = z.object({
  productId: objectId,
  variantId: objectId,
});