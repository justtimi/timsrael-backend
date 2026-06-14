import type { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  user?: any;
}

export const admin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};