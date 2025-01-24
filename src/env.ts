import dotenv from 'dotenv';
import isInitialized from './utils/isInitialized';
dotenv.config();

export const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY!;
export const GOOGLE_CUSTOM_SEARCH_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX!;
export const GPT4_API_KEY = process.env.GPT4_API_KEY!;
export const DB_TYPE = process.env.DB_TYPE! || 'sqlite';

if (isInitialized() && (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLE_CUSTOM_SEARCH_CX || !GPT4_API_KEY || !DB_TYPE)) {
    throw new Error("Please provide all the required environment variables");
}