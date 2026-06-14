import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// Generate token
export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
  expiresIn: "7d",
});
};

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET!, {
  expiresIn: "15m",
});
};

// Verify token
export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};