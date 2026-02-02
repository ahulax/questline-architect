"use server";

import { db } from "@/lib/db";
import { aiArtifacts, users, seasons, quests, questNotes } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { desc, eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
                sql`${quests.completedAt} >= ${sevenDaysAgo.toISOString()}`
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
            try {
                const prompt = `
                Act as "The Architect", a mysterious RPG narrator who observes the player's every move.
                Your task is to write a Weekly Recap that feels deeply personal and reactive to the player's thoughts.
                
                Season Theme: "${activeSeason.title}"
                Current Boss: "${activeSeason.bossType}"
                
                Stats: 
                - XP Gained: ${stats.xpGained}
                - Quests Cleared: ${stats.questsCompleted}
                - Boss Damage: ${stats.bossDamageDealt}
                
                PLAYER'S ACTIONS AND REFLECTIONS (CRITICAL CONTEXT):
                ${completedQuestInfo || "The player was quiet this week. No specific reflections were recorded."}
                
                INSTRUCTIONS:
                - DO NOT use generic RPG platitudes if the player has provided notes.
                - If the player mentions specific struggles (e.g. "it was hard", "I failed"), reference them as battles fought in the mind or the spirit.
                - If the player mentions success or specific details (e.g. "set up the DB", "coded the logic"), weave those into the "Director's" narrative as building the foundations of the world.
                - The tone should be mysterious, slightly dark, but encouraging.
                - Maximum 3 sentences for the narrative.
                
                Output JSON:
                {
                  "episodeTitle": "Episode [Number]: [A unique title based on the week's notes]",
                  "narrative": "Your personal, note-driven narrative.",
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
                        inputPayload: JSON.stringify({
                            prompt,
                            contentHash: getRecapContentHash(weeklyQuests)
                        }),
                        outputText: JSON.stringify(aiData),
                    });
                    revalidatePath("/recap");
                    revalidatePath("/");
                    revalidatePath("/season");
                    return aiData;
                }
            } catch (aiError) {
                console.error("AI Generation Failed, falling back to mock:", aiError);
            }
        }

        // 3. Fallback to Mock
        const mockData: RecapData = getMockRecap(activeSeason, stats, weeklyQuests);

        // Save Mock
        const artifactId = uuidv4();
        await db.insert(aiArtifacts).values({
            id: artifactId,
            userId: activeSeason.userId,
            seasonId: activeSeason.id,
            type: "weekly_recap",
            inputPayload: JSON.stringify({
                seasonId: activeSeason.id,
                date: new Date(),
                contentHash: getRecapContentHash(weeklyQuests)
            }),
            outputText: JSON.stringify(mockData),
        });

        revalidatePath("/recap");
        revalidatePath("/");
        revalidatePath("/season");

        return mockData;

    } catch (error) {
        console.error("generateRecap CRASH:", error);
        return null;
    }
}

/**
 * Sync recap ensures the dashboard has the latest data.
 * It will trigger a full regeneration if:
 * 1. No recap exists.
 * 2. The recap is older than 6 hours.
 * 3. The underlying data (quest count or notes) has changed since the last recap.
 */
export async function syncRecap(seasonId: string) {
    const latest = await getLatestRecap(seasonId);

    // Fetch fresh stats and notes hash
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyQuests = await db.query.quests.findMany({
        where: and(
            eq(quests.seasonId, seasonId),
            eq(quests.status, "done"),
            sql`${quests.completedAt} >= ${sevenDaysAgo.toISOString()}`
        ),
        with: { notes: true }
    });

    const currentHash = getRecapContentHash(weeklyQuests);
    const savedPayload = latest ? JSON.parse(latest.inputPayload || '{}') : {};
    const savedHash = savedPayload.contentHash;

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const isStale = !latest || new Date(latest.createdAt!) < sixHoursAgo;
    const hasChanged = currentHash !== savedHash;

    if (isStale || hasChanged) {
        console.log(`Regenerating recap for ${seasonId}. Reason: ${isStale ? 'Stale' : 'Content Changed'}`);
        await generateRecap(seasonId);
    } else {
        // Just update numbers if it's very fresh and nothing meaningful changed
        console.log(`Recap for ${seasonId} is fresh and content unchanged. Syncing stats only.`);
        const freshStats = {
            xpGained: weeklyQuests.reduce((sum, q) => sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 10 : 20), 0),
            questsCompleted: weeklyQuests.length,
            bossDamageDealt: weeklyQuests.reduce((sum, q) => {
                if (q.type !== 'main') return sum;
                return sum + (q.effort === 'S' ? 5 : q.effort === 'M' ? 15 : 25);
            }, 0)
        };

        const updatedData = {
            ...latest.data,
            stats: freshStats,
            generatedAt: new Date().toISOString()
        };

        await db.update(aiArtifacts)
            .set({ outputText: JSON.stringify(updatedData) })
            .where(eq(aiArtifacts.id, latest.id));

        revalidatePath("/");
    }
}

// HELPERS

function getRecapContentHash(quests: any[]) {
    // Basic string representation of IDs and note text to detect changes
    return quests
        .map(q => `${q.id}:${q.notes.map((n: any) => n.text).join('|')}`)
        .sort()
        .join(';');
}

function getMockRecap(activeSeason: any, stats: any, weeklyQuests: any[]): RecapData {
    const hasNotes = weeklyQuests.some((q: any) => q.notes.length > 0);

    const templates = [
        `The Architect watches as you dismantle the chaos. Your progress against ${activeSeason.bossType} is noted.`,
        `The ink of fate writes of your recent victories. ${stats.questsCompleted} battles won, yet more shadow remains.`,
        `A productive cycle, hero. The foundations of ${activeSeason.title} grow stronger with every quest.`
    ];

    const noteAddon = hasNotes
        ? " Your recorded reflections show a mind sharpening for the coming storm."
        : " The Architect waits for your deeper reflections; do not be a silent warrior.";

    const randomIdx = Math.floor(Math.abs(Math.sin(stats.questsCompleted) * templates.length));

    return {
        episodeTitle: `The ${activeSeason.bossType} Chronicles`,
        narrative: `${templates[randomIdx]}${noteAddon}`,
        stats,
        generatedAt: new Date().toISOString()
    };
}

