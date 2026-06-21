import { z } from "zod";

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1),
    phone: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    country: z.string().min(1),
  }),
});