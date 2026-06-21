import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  hexCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color code"),
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
  tags: z.array(z.string().min(1)).optional(),
  variants: z.array(variantSchema).min(1, "At least one variant is required"),
});

export const updateProductSchema = createProductSchema.partial();
