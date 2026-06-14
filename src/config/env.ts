import dotenv from "dotenv";

const result = dotenv.config();

if (result.error) {
  throw result.error;
}

console.log("Loaded env:", process.env.JWT_SECRET);