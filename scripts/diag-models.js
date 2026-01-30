const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

async function listModels() {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        try {
            const env = fs.readFileSync(".env.local", "utf8");
            const match = env.match(/GEMINI_API_KEY=["']?([^"'\n]+)["']?/);
            if (match) apiKey = match[1];
        } catch (e) { }
    }

    if (!apiKey) {
        console.error("GEMINI_API_KEY not found");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching models...");
        // There isn't a direct listModels in the high-level SDK easily exposed sometimes, 
        // but we can try to fetch a specific model info or use the rest architecture if needed.
        // Actually, the SDK has it!
        const result = await genAI.getGenerativeModel({ model: "gemini-pro" }).generateContent("ping");
        console.log("Basic 'gemini-pro' ping successful!");
    } catch (e) {
        console.error("Ping failed:", e.message);
    }

    try {
        // Trying to use fetch to list models via REST to see EXACTLY what's up
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Models:");
            data.models.forEach(m => {
                console.log(`- ${m.name} (Supports: ${m.supportedGenerationMethods.join(", ")})`);
            });
        } else {
            console.log("\nNo models found or error in response:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("REST list failed:", e.message);
    }
}

listModels();
