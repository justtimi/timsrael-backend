import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(1).max(1000).optional(),
  status: z.enum(["active", "draft"]).optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const addProductToCollectionSchema = z.object({
  productId: objectId,
});