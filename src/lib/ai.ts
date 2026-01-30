import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export const aiModel = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

export const hasApiKey = !!apiKey;

export async function generateJSON<T>(prompt: string): Promise<T | null> {
    if (!aiModel) return null;

    try {
        const result = await aiModel.generateContent(prompt + "\n\nResponse must be valid JSON.");
        const response = await result.response;
        const text = response.text();

        // Simple cleanup for code blocks
        const jsonString = text.replace(/```json\n?|\n?```/g, "").trim();
        return JSON.parse(jsonString) as T;
    } catch (error) {
        console.error("AI Generation Error:", error);
        return null;
    }
}
