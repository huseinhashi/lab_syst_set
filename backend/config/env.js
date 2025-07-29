import { config } from "dotenv";

config({ path: `.env` });

export const {
  PORT,
  DB_URI,
  JWT_SECRET,
  MERCHANT_U_ID,
  MERCHANT_API_USER_ID,
  MERCHANT_API_KEY,
} = process.env;
