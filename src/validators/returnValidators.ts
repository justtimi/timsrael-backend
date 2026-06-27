import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const returnItemSchema = z.object({
  product: objectId,
  variantId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const createReturnRequestSchema = z.object({
  orderId: objectId,
  items: z.array(returnItemSchema).min(1, "At least one item is required"),
  reason: z.string().min(10, "Please provide a detailed reason").max(1000),
});

export const reviewReturnRequestSchema = z.object({
  status: z.enum(["approved", "rejected", "refunded"]),
  adminNote: z.string().min(1).max(500).optional(),
});
