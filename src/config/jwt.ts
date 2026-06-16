import jwt from "jsonwebtoken";
import type { AccessTokenPayload, RefreshTokenPayload } from "../types/auth.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// Generate token
export const generateRefreshToken = (payload: RefreshTokenPayload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
  expiresIn: "7d",
});
};

export const generateAccessToken = (payload: AccessTokenPayload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
  expiresIn: "15m",
});
};

// Verify token
export const verifyToken = (token: string):AccessTokenPayload => {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Invalid token");
  }

  return decoded as AccessTokenPayload;
};