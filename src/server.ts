import "./config/env.js";

import app from "./app.js";
import { connectDB } from "./config/database.js";

const PORT = process.env.PORT || 5000;

if (!process.env.NODE_ENV) throw new Error("NODE_ENV is not set");
if (!process.env.REFRESH_TOKEN_SECRET)
  throw new Error("REFRESH_TOKEN_SECRET is not set");
if (!process.env.ACCESS_TOKEN_SECRET)
  throw new Error("ACCESS_TOKEN_SECRET is not set");

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} 🚀`);
  });
});
