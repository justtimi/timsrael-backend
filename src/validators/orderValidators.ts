import { z } from "zod";

const measurementsSchema = z.object({
  bust: z.number().positive(),
  waist: z.number().positive(),
  hips: z.number().positive(),
  backLength: z.number().positive(),
  halfLength: z.number().positive(),
  sleeveLength: z.number().positive(),
  roundSleeve: z.number().positive(),
  wrist: z.number().positive(),
  waistToHip: z.number().positive(),
  waistToKnee: z.number().positive(),
  skirtOrGownLength: z.number().positive(),
});

const shippingAddressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
});

export const trackingEventSchema = z.object({
  status: z.enum([
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
    "failed_delivery",
  ]),
  note: z.string().min(1).max(500).optional(),
});

export const measurementsInputSchema = z.record(
  z.string(),
  measurementsSchema.optional(),
);

export const createOrderSchema = z
  .object({
    addressId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format").optional(),
    shippingAddress: shippingAddressSchema.optional(),
    measurements: measurementsInputSchema.optional(),
  })
  .refine((data) => data.addressId || data.shippingAddress, {
    message: "Either addressId or shippingAddress must be provided",
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type MeasurementsInput = z.infer<typeof measurementsSchema>;