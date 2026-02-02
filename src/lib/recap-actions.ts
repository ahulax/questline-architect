"use server";

import { db } from "@/lib/db";
import { aiArtifacts, users, seasons, quests } from "@/db/schema";
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

export async function getLatestRecap() {
    // Switched from db.query to db.select for stability
    const recentArtifacts = await db
        .select()
        .from(aiArtifacts)
        .where(eq(aiArtifacts.type, "weekly_recap"))
        .orderBy(desc(aiArtifacts.createdAt))
        .limit(1);

    const latest = recentArtifacts[0];

    if (!latest) return null;

    return {
        ...latest,
        data: JSON.parse(latest.outputText) as RecapData
    };
}

import { hasApiKey, generateJSON } from "@/lib/ai";

export async function generateRecap() {
    // 1. Get Context (Active Season)
    const activeSeasons = await db
        .select()
        .from(seasons)
        .where(eq(seasons.status, "active"))
        .limit(1);

    const activeSeason = activeSeasons[0];
    if (!activeSeason) throw new Error("No active season found");

    // Get REAL Stats Context
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyQuests = await db
        .select()
        .from(quests)
        .where(
            and(
                eq(quests.seasonId, activeSeason.id),
                eq(quests.status, "done"),
                sql`${quests.completedAt} >= ${sevenDaysAgo}`
            )
        );

    const stats = {
        xpGained: weeklyQuests.reduce((sum, q) => sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 10 : 20), 0),
        questsCompleted: weeklyQuests.length,
        bossDamageDealt: weeklyQuests.reduce((sum, q) => {
            if (q.type !== 'main') return sum;
            const damage = q.effort === 'S' ? 5 : q.effort === 'M' ? 15 : 25;
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
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate thinking

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
}

export async function syncRecap(seasonId: string) {
    const latest = await getLatestRecap();

    // If no recap exists or if the latest one is older than 1 hour, regenerate fully
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const shouldFullRegen = !latest || new Date(latest.createdAt!) < oneHourAgo;

    if (shouldFullRegen) {
        await generateRecap();
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
