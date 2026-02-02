"use server";

import { db } from "@/lib/db";
import { aiArtifacts, users, seasons, quests, questNotes } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { desc, eq, and, sql } from "drizzle-orm";

export type RecapData = {
    episodeTitle: string;
    narrative: string;
    stats: {
        xpGained: number;
        questsCompleted: number;
        bossDamageDealt: number;
    };
    generatedAt: string;
};

export async function getLatestRecap(seasonId: string) {
    const recentArtifacts = await db
        .select()
        .from(aiArtifacts)
        .where(
            and(
                eq(aiArtifacts.type, "weekly_recap"),
                eq(aiArtifacts.seasonId, seasonId)
            )
        )
        .orderBy(desc(aiArtifacts.createdAt))
        .limit(1);

    const latest = recentArtifacts[0];

    if (!latest) return null;

    try {
        return {
            ...latest,
            data: JSON.parse(latest.outputText) as RecapData
        };
    } catch (e) {
        console.error("Failed to parse recap artifact", e);
        return null;
    }
}

import { hasApiKey, generateJSON } from "@/lib/ai";

export async function generateRecap(seasonId: string) {
    try {
        // 1. Get Context (Active Season)
        const activeSeasons = await db
            .select()
            .from(seasons)
            .where(and(eq(seasons.id, seasonId), eq(seasons.status, "active")))
            .limit(1);

        const activeSeason = activeSeasons[0];
        if (!activeSeason) {
            console.error(`generateRecap: Season ${seasonId} not found or not active.`);
            return null;
        }

        // Get REAL Stats Context
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Fetch weekly quests WITH notes using the relations API
        const weeklyQuests = await db.query.quests.findMany({
            where: and(
                eq(quests.seasonId, activeSeason.id),
                eq(quests.status, "done"),
                sql`${quests.completedAt} >= ${sevenDaysAgo}`
            ),
            with: {
                notes: true
            }
        });

        // EXTRACT NOTES for the prompt
        const completedQuestInfo = weeklyQuests.map(q => {
            const notesText = q.notes.map(n => n.text).join(" | ");
            return `- Quest: "${q.title}" (Effort: ${q.effort}) ${notesText ? `[User Notes: ${notesText}]` : ''}`;
        }).join("\n");

        const stats = {
            xpGained: weeklyQuests.reduce((sum, q) => sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 10 : 20), 0),
            questsCompleted: weeklyQuests.length,
            bossDamageDealt: weeklyQuests.reduce((sum, q) => {
                // Only main quests damage the boss
                if (q.type !== 'main') return sum;
                const damage = (q.effort === 'S' ? 5 : q.effort === 'M' ? 15 : 25);
                return sum + damage;
            }, 0)
        };

        // 2. Try Real AI
        if (hasApiKey) {
            const prompt = `
           Act as "The Architect", a mysterious RPG narrator.
           Write a Weekly Recap for a player.
           Season Theme: "${activeSeason.title}" against Boss "${activeSeason.bossType}".
           
           Stats: 
           - XP: ${stats.xpGained}
           - Quests: ${stats.questsCompleted}
           - Damage: ${stats.bossDamageDealt}
           
           RECENTLY COMPLETED QUESTS AND NOTES:
           ${completedQuestInfo}
           
           INSTRUCTIONS:
           - Use the user's notes to personalize the narrative. If they mentioned struggles or victories, reference them metaphorically.
           - Write a dramatic paragraph (max 3 sentences) summarizing their progress.
           
           Output JSON:
           {
             "episodeTitle": "Episode [Number]: [Title]",
             "narrative": "A dramatic paragraph (max 3 sentences) summarizing their progress.",
             "stats": { "xpGained": ${stats.xpGained}, "questsCompleted": ${stats.questsCompleted}, "bossDamageDealt": ${stats.bossDamageDealt} },
             "generatedAt": "${new Date().toISOString()}"
           }
         `;

            const aiData = await generateJSON<RecapData>(prompt);
            if (aiData) {
                // 3. Save Artifact
                const artifactId = uuidv4();
                await db.insert(aiArtifacts).values({
                    id: artifactId,
                    userId: activeSeason.userId,
                    seasonId: activeSeason.id,
                    type: "weekly_recap",
                    inputPayload: JSON.stringify({ prompt }),
                    outputText: JSON.stringify(aiData),
                });
                return aiData;
            }
        }

        // 3. Fallback to Mock
        const mockData: RecapData = {
            episodeTitle: `The ${activeSeason.bossType} Incursion`,
            narrative: `In this week's episode, our hero faced the daunting presence of ${activeSeason.bossType}. Despite initial setbacks, the completion of critical main quests dealt significant damage to the enemy. The momentum is shifting. The Architect is pleased with your progress, but warns that the mid-season slump is approaching. Stay vigilant.`,
            stats: stats,
            generatedAt: new Date().toISOString()
        };

        // Save Mock
        const artifactId = uuidv4();
        await db.insert(aiArtifacts).values({
            id: artifactId,
            userId: activeSeason.userId,
            seasonId: activeSeason.id,
            type: "weekly_recap",
            inputPayload: JSON.stringify({ seasonId: activeSeason.id, date: new Date() }),
            outputText: JSON.stringify(mockData),
        });

        return mockData;

    } catch (error) {
        console.error("generateRecap CRASH:", error);
        // Safely return null to prevent 500
        return null;
    }
}

export async function syncRecap(seasonId: string) {
    const latest = await getLatestRecap(seasonId);

    // If no recap exists or if the latest one is older than 1 hour, regenerate fully
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const shouldFullRegen = !latest || new Date(latest.createdAt!) < oneHourAgo;

    if (shouldFullRegen) {
        await generateRecap(seasonId);
    } else {
        // Just update the stats to keep it "strictly in line" with activity
        // without burning AI credits/wait time for every minor click
        const freshData = await generateRecapStatsOnly(seasonId);

        // Update the existing artifact's outputText
        const updatedData = {
            ...latest.data,
            stats: freshData,
            generatedAt: new Date().toISOString()
        };

        await db.update(aiArtifacts)
            .set({
                outputText: JSON.stringify(updatedData)
            })
            .where(eq(aiArtifacts.id, latest.id));
    }
}

async function generateRecapStatsOnly(seasonId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyQuests = await db
        .select()
        .from(quests)
        .where(
            and(
                eq(quests.seasonId, seasonId),
                eq(quests.status, "done"),
                sql`${quests.completedAt} >= ${sevenDaysAgo}`
            )
        );

    return {
        xpGained: weeklyQuests.reduce((sum, q) => sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 10 : 20), 0),
        questsCompleted: weeklyQuests.length,
        bossDamageDealt: weeklyQuests.reduce((sum, q) => {
            if (q.type !== 'main') return sum;
            return sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 15 : 25);
        }, 0)
    };
}
