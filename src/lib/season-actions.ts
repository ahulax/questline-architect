"use server";

import { db } from "@/lib/db";
import { seasons, questlines, quests, users } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

// Types for the Wizard
export type GeneratedSeason = {
    title: string;
    description: string;
    bossType: string;
    bossImageUrl?: string;
    questlines: {
        title: string;
        description: string;
        quests: {
            title: string;
            effort: "S" | "M" | "L";
            type: "main" | "side";
        }[];
    }[];
};

import { hasApiKey, generateJSON } from "@/lib/ai";

export async function generateSeasonPlan(goal: string, bossType: string): Promise<GeneratedSeason> {
    // 1. Try Real AI
    if (hasApiKey) {
        const prompt = `
       Act as an RPG Quest Architect.
       User Goal: "${goal}"
       Boss Theme: "${bossType}"
       
       Create a 3-phase progression season in JSON format.
       Structure:
       {
         "title": "Season of [Theme]",
         "description": "Short flavor text",
         "bossType": "${bossType}",
         "questlines": [
            { "title": "Phase 1 Name", "description": "Phase focus", "quests": [ { "title": "...", "effort": "S|M|L", "type": "main|side" } ] }
         ]
       }
       Rules:
       - 3 Phases
       - 3 Quests per phase
       - Mix of Main and Side quests
       - Effort S=Small, M=Medium, L=Large
     `;

        const aiData = await generateJSON<GeneratedSeason>(prompt);
        if (aiData) return aiData;
    }

    // 2. Fallback to Mock
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate thinking

    return {
        title: `Season of ${goal.split(' ').slice(0, 3).join(' ')}`,
        description: `A 30-day campaign to achieve: "${goal}". defeat ${bossType} by staying consistent.`,
        bossType: bossType,
        questlines: [
            {
                title: "Phase 1: Mobilization",
                description: "Getting the basics right.",
                quests: [
                    { title: "Define scope and strict boundaries", effort: "S", type: "main" },
                    { title: "Research competitors (timeboxed)", effort: "S", type: "side" },
                    { title: "Setup initial infrastructure", effort: "M", type: "main" }
                ]
            },
            {
                title: "Phase 2: The Grind",
                description: "Executing the core loop.",
                quests: [
                    { title: "Build core feature MVP", effort: "L", type: "main" },
                    { title: "Write weekly update", effort: "S", type: "side" },
                    { title: "Refine user flows", effort: "M", type: "main" }
                ]
            },
            {
                title: "Phase 3: The Boss Fight",
                description: "Shipping and launching.",
                quests: [
                    { title: "Final QA and Polish", effort: "M", type: "main" },
                    { title: "Prepare launch assets", effort: "M", type: "side" },
                    { title: "LAUNCH DAY", effort: "L", type: "main" }
                ]
            }
        ]
    };
}

export async function createSeason(data: GeneratedSeason) {
    // Transaction-like insertion
    // 1. Get User (Hardcoded for v1 MVP)
    const allUsers = await db.select().from(users).limit(1);
    const user = allUsers[0];
    if (!user) throw new Error("No user found");

    const seasonId = uuidv4();

    // 2. Create Season
    await db.insert(seasons).values({
        id: seasonId,
        userId: user.id,
        title: data.title,
        description: data.description,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        bossType: data.bossType,
        bossImageUrl: data.bossImageUrl || null,
        bossHpMax: 100, // TODO: Calc based on quests
        bossHpCurrent: 100,
        status: "active",
    });

    // 3. Create Questlines and Quests
    for (const [index, ql] of data.questlines.entries()) {
        const qlId = uuidv4();
        await db.insert(questlines).values({
            id: qlId,
            seasonId: seasonId,
            title: ql.title,
            description: ql.description,
            orderIndex: index,
        });

        for (const q of ql.quests) {
            await db.insert(quests).values({
                id: uuidv4(),
                seasonId: seasonId,
                questlineId: qlId,
                title: q.title,
                type: q.type,
                effort: q.effort,
                status: "todo",
            });
        }
    }

    revalidatePath("/");
    return seasonId;
}
