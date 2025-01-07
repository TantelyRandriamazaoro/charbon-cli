import dotenv from 'dotenv';
dotenv.config();

export const GOOGLE_CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY!;
export const GOOGLE_CUSTOM_SEARCH_CX = process.env.GOOGLE_CUSTOM_SEARCH_CX!;
export const GPT4_API_KEY = process.env.GPT4_API_KEY!;

if (!GOOGLE_CUSTOM_SEARCH_API_KEY || !GOOGLE_CUSTOM_SEARCH_CX || !GPT4_API_KEY) {
    throw new Error("Please provide all the required environment variables");
}