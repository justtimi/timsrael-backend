import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
});

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  discountPrice: z.number().min(0).optional(),
  category: objectId,
  featured: z.boolean().optional(),
  status: z.enum(["active", "draft"]).optional(),
});

export const updateProductSchema = createProductSchema.partial();
