import { structuredModel } from "./gemini-client";
import { SchemaType } from "@google/generative-ai";
import { z } from "zod";

// --- Zod Schemas for Runtime Validation ---

export const QuestAIOutputSchema = z.object({
    id: z.string().describe("Unique sequential ID like 'step-1', 'step-2'"),
    parentId: z.string().nullable().describe("ID of parent quest if this is a sub-step, else null"),
    order: z.number().describe("Order index starting at 1"),
    title: z.string().describe("Action-oriented title starting with a verb"),
    description: z.string().describe("Concrete artifact or outcome"),
    type: z.enum(["main", "side"]).describe("Main path vs optional"),
    effort: z.enum(["S", "M", "L"]).describe("t-shirt size estimate"),
    tags: z.array(z.string()).default([]),
    enemy_name: z.string().describe("Creative D&D style name for the enemy representing the task"),
    enemy_description: z.string().describe("Short description of the enemy's nature"),
    enemy_visual: z.string().describe("Visual prompt for generating an image of this enemy"),
});

export const QuestlineAIOutputSchema = z.object({
    questline: z.object({
        title: z.string(),
        description: z.string(),
        structure: z.enum(["flat", "tree"]),
        complexity_score: z.number(),
        quests: z.array(QuestAIOutputSchema).min(10).max(20),
    }),
});

export type QuestlineAIOutput = z.infer<typeof QuestlineAIOutputSchema>;

// --- Complexity Heuristic ---

export function scoreGoalComplexity(goal: string): number {
    let score = 30; // base score

    // 1. Length factor
    if (goal.length > 50) score += 10;
    if (goal.length > 100) score += 10;

    // 2. Keyword factor
    const bigProjectKeywords = [
        "launch", "mvp", "product", "app", "course", "exam",
        "thesis", "campaign", "funnel", "website", "onboarding", "rebrand",
        "business", "startup", "rewrite", "overhaul"
    ];

    const lowerGoal = goal.toLowerCase();
    let matches = 0;
    bigProjectKeywords.forEach(kw => {
        if (lowerGoal.includes(kw)) matches++;
    });

    score += matches * 15;

    // Cap at 100
    return Math.min(score, 100);
}

// --- Gemini Generation ---

type GenerateQuestlineInput = {
    goal: string;
    seasonTitle?: string;
    seasonGoal?: string;
    timeWindowWeeks?: number;
};

export async function generateQuestline(input: GenerateQuestlineInput): Promise<QuestlineAIOutput> {
    const complexity = scoreGoalComplexity(input.goal);
    // Lower threshold to 45 to trigger TREE mode more easily
    const structureType = complexity > 45 ? "tree" : "flat";

    const systemPrompt = `
You are Quest Forge, an expert project manager for solo founders.
Your goal is to break down a user's goal into a concrete RPG-style Questline.

RULES:
1. Quest titles MUST start with a verb (e.g., "Draft", "Deploy", "Email").
2. Descriptions MUST mention a concrete artifact (e.g., "landing page URL", "PDF draft").
3. MINIMUM QUESTS: 10. Even for simple goals, break them down into at least 10 granular steps to ensure completeness.
4. BANNED TITLES: "Plan the project", "Do research", "Work on it", "Stay consistent".
5. Structure Mode: based on complexity score ${complexity}, utilize ${structureType}. 
   ${structureType === 'tree' ? 'Use parentId to link sub-tasks to their primary milestones.' : ''}
6. EVERY QUEST MUST HAVE A UNIQUE ENEMY. Personify the task's difficulty as a D&D style monster. 
   Categorize them using these archetypes for visual mapping:
   - Spectral Eye: For vision, arcane, abstract, or oversight tasks.
   - Bureaucracy Golem: For legal, admin, paperwork, or repetitive tasks.
   - Git Goblin: For coding, bugs, technical hurdles, or syntax.
   - Toxic Slime: For cleanup, messy data, or unpleasant chores.
   - Bone Warrior: For legacy code, outdated tasks, or ancient technical debt.
   - Fire Drake: For high-effort (L), urgent, or "fiery" challenges.
   - Treasure Mimic: For side quests, surprises, or optional rewards.
   Ensure the enemy_name and enemy_description use keywords from the chosen archetype (e.g., "The Legacy Skeleton" or "Database Slime") to ensure visual variety.
7. Return purely valid JSON matching the schema.
`;

    const userPrompt = `
GOAL: "${input.goal}"
CONTEXT: Season "${input.seasonTitle || 'General'}", Time Window: ${input.timeWindowWeeks || 4} weeks.
Complexity Score: ${complexity}.
`;

    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            questline: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING },
                    structure: { type: SchemaType.STRING, enum: ["flat", "tree"] },
                    complexity_score: { type: SchemaType.NUMBER },
                    quests: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                id: { type: SchemaType.STRING },
                                parentId: { type: SchemaType.STRING, nullable: true },
                                order: { type: SchemaType.NUMBER },
                                title: { type: SchemaType.STRING },
                                description: { type: SchemaType.STRING },
                                type: { type: SchemaType.STRING, enum: ["main", "side"] },
                                effort: { type: SchemaType.STRING, enum: ["S", "M", "L"] },
                                tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                                enemy_name: { type: SchemaType.STRING },
                                enemy_description: { type: SchemaType.STRING },
                                enemy_visual: { type: SchemaType.STRING },
                            },
                            required: ["id", "order", "title", "description", "type", "effort", "enemy_name", "enemy_description", "enemy_visual"],
                        },
                    },
                },
                required: ["title", "description", "structure", "complexity_score", "quests"],
            },
        },
        required: ["questline"],
    };

    try {
        const result = await structuredModel.generateContent({
            contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n" + userPrompt }] }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema as any,
            }
        });

        const text = result.response.text();
        console.log("Gemini Raw Response:", text); // Debug log

        const json = JSON.parse(text);

        // Validate with Zod
        const parsed = QuestlineAIOutputSchema.parse(json);
        return parsed;
    } catch (error) {
        console.error("Gemini quest generation failed:", error);
        if (error instanceof z.ZodError) {
            console.error("Zod Validation Error:", JSON.stringify(error.format(), null, 2));
        }
        throw new Error("Failed to generate questline from AI: " + (error instanceof Error ? error.message : String(error)));
    }
}
