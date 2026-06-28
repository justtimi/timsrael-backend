import { z } from "zod";

export const flattenErrors = (error: z.ZodError) =>
  z.flattenError(error).fieldErrors;