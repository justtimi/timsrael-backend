import { z } from "zod";

export const createCouponSchema = z
  .object({
    code: z.string().min(1).max(50).toUpperCase(),
    type: z.enum(["percentage", "fixed", "free_shipping"]),
    value: z.number().min(0).default(0),
    minOrderValue: z.number().min(0).default(0),
    usageLimit: z.number().int().min(1),
    expiresAt: z.string().datetime({ message: "Invalid date format" }),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "percentage") {
        return data.value > 0 && data.value <= 100;
      }
      if (data.type === "fixed") {
        return data.value > 0;
      }
      return true;
    },
    {
      message:
        "Percentage must be between 1-100, fixed amount must be greater than 0",
    },
  );

export const updateCouponSchema = createCouponSchema.partial();

export const applyCouponSchema = z.object({
  couponCode: z.string().min(1).toUpperCase(),
});
