import { z } from "zod";

// --- Quest Schema ---
export const QuestSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    order: z.number().int(),
    title: z.string().min(2, "Title too short"),
    description: z.string().min(5, "Description too short"),
    type: z.enum(["main", "side"]),
    effort: z.enum(["S", "M", "L"]),
    tags: z.array(z.string()).optional().default([]),
});

// --- Questline Schema ---
export const QuestlineSchema = z.object({
    questline: z.object({
        title: z.string().min(3),
        description: z.string().min(10),
        structure: z.enum(["flat", "tree"]),
        complexity_score: z.number().min(0).max(100),
        quests: z.array(QuestSchema).min(5).max(20),
    }),
}).refine((data) => {
    // 1. Structure Rules
    if (data.questline.structure === "flat") {
        // Flat: All parentId must be null
        return data.questline.quests.every(q => q.parentId === null);
    }
    // Tree: Allow parentId (no stricter check requested, just 'allow')
    return true;
}, {
    message: "Flat structure cannot have nested quests.",
    path: ["questline", "structure"],
});

export type QuestlineData = z.infer<typeof QuestlineSchema>;
