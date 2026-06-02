import dotenv from 'dotenv';

// Load environment variables from .env into process.env
dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "ASDFASD234";