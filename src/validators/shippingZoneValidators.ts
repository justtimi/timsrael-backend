import { z } from "zod";

const shippingTierSchema = z.object({
  minOrderValue: z.number().min(0),
  maxOrderValue: z.number().min(0).optional(),
  additionalFee: z.number().min(0),
}).refine(
  (data) => data.maxOrderValue === undefined || data.maxOrderValue > data.minOrderValue,
  {
    message: "maxOrderValue must be greater than minOrderValue",
  },
);

export const createShippingZoneSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  states: z.array(z.string().min(1)).min(1, "At least one state is required"),
  baseFee: z.number().min(0),
  tiers: z.array(shippingTierSchema).optional(),
  isActive: z.boolean().optional(),
});

export const updateShippingZoneSchema = createShippingZoneSchema.partial();