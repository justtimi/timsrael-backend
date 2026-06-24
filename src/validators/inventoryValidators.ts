import { z } from "zod";

export const manualAdjustmentSchema = z.object({
  variantId: z.string().min(1),
  quantityChange: z.number().int().refine((val) => val !== 0, {
    message: "Quantity change cannot be zero",
  }),
  note: z.string().min(1).max(500).optional(),
});