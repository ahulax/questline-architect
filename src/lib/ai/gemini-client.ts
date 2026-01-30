import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key");

export const geminiClient = genAI;

export const structuredModel = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
});
