import type { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("[ErrorHandler]", err);

  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({ message: "Invalid ID format" });
  }

  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: "Validation failed", errors: messages });
  }

  if (err instanceof Error) {
    return res.status(500).json({ message: "An unexpected error occurred" });
  }

  return res.status(500).json({ message: "An unexpected error occurred" });
};