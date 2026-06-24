import { z } from "zod";

const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});

export const createOrderSchema = z
  .object({
    addressId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format").optional(),
    shippingAddress: shippingAddressSchema.optional(),
  })
  .refine((data) => data.addressId || data.shippingAddress, {
    message: "Either addressId or shippingAddress must be provided",
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;