"use server";

import { db } from "@/lib/db";
import { quests, seasons, dailyLogs, loot } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import { syncRecap } from "@/lib/recap-actions";

export async function toggleQuestStatus(questId: string, currentStatus: string) {
    // 1. Fetch Quest Details
    const questList = await db.select().from(quests).where(eq(quests.id, questId)).limit(1);
    const quest = questList[0];

    if (!quest) throw new Error("Quest not found");

    const newStatus = currentStatus === "done" ? "todo" : "done";
    const now = new Date().toISOString();

    // 2. Update Quest
    await db.update(quests)
        .set({
            status: newStatus,
            completedAt: newStatus === "done" ? now : null,
        })
        .where(eq(quests.id, questId));

    // 3. Apply Game Rules (XP / Boss Damage)
    // Only apply on completion (reverting logic is complex, for v1 let's just add/subtract if needed, 
    // or just handle forward progress for simplicity. Reverting might just undo the damage/xp).

    // For V1 MVP: We will just handle "Complete" -> Add XP/Damage. 
    // If "Undo" -> Remove XP/Damage.

    if (!quest.seasonId) return; // Should have season

    const seasonList = await db.select().from(seasons).where(eq(seasons.id, quest.seasonId)).limit(1);
    const season = seasonList[0];

    if (!season) return;

    // XP Values
    const xpMap = { S: 5, M: 10, L: 20 };
    const xpAmount = xpMap[quest.effort as keyof typeof xpMap] || 5;

    // Boss Damage (Only for Main Quests)
    // Logic: 10 HP per main quest roughly. Let's say:
    // S = 5 HP, M = 10 HP, L = 20 HP? Or flat?
    // Plan said: "completed main quest deals 80–120% of its allocated share."
    // Simplification: S=5, M=15, L=25 damage.
    const damageMap = { S: 5, M: 15, L: 25 };
    let damage = 0;
    if (quest.type === "main") {
        damage = damageMap[quest.effort as keyof typeof damageMap] || 10;
    }

    if (newStatus === "done") {
        // Add XP & Deal Damage
        const xpCurrent = season.xpCurrent + xpAmount;
        const xpLevel = Math.floor(xpCurrent / 100) + 1;
        const isLevelUp = xpLevel > season.xpLevel;

        await db.update(seasons)
            .set({
                xpCurrent: xpCurrent,
                xpLevel: xpLevel,
                bossHpCurrent: sql`MAX(0, ${seasons.bossHpCurrent} - ${damage})`,
            })
            .where(eq(seasons.id, season.id));

        if (isLevelUp) {
            // Generate Loot
            const lootPool = [
                { name: "Sword of Consistency", description: "Forged in the fires of daily habits.", rarity: "common" },
                { name: "Shield of Focus", description: "Blocks 10% of distractions.", rarity: "rare" },
                { name: "Potion of Clarity", description: "Instantly clears mental fog.", rarity: "common" },
                { name: "Helm of Vision", description: "See your goals clearly.", rarity: "legendary" },
            ];
            const reward = lootPool[Math.floor(Math.random() * lootPool.length)];

            await db.insert(loot).values({
                id: uuidv4(),
                userId: season.userId,
                seasonId: season.id,
                name: reward.name,
                description: reward.description,
                rarity: reward.rarity as "common" | "rare" | "legendary",
            });
        }

        // Update Daily Log
        const today = new Date().toISOString().split('T')[0];
        const logs = await db.select().from(dailyLogs).where(
            and(eq(dailyLogs.userId, season.userId), eq(dailyLogs.date, today))
        ).limit(1);

        if (logs.length > 0) {
            const log = logs[0];
            await db.update(dailyLogs).set({
                mainQuestsCompletedCount: quest.type === 'main' ? log.mainQuestsCompletedCount + 1 : log.mainQuestsCompletedCount,
                sideQuestsCompletedCount: quest.type !== 'main' ? log.sideQuestsCompletedCount + 1 : log.sideQuestsCompletedCount,
            }).where(eq(dailyLogs.id, log.id));
        } else {
            await db.insert(dailyLogs).values({
                id: uuidv4(),
                userId: season.userId,
                date: today,
                mainQuestsCompletedCount: quest.type === 'main' ? 1 : 0,
                sideQuestsCompletedCount: quest.type !== 'main' ? 1 : 0,
            });
        }

        // Trigger Recap Sync (keep it in line with activity)
        await syncRecap(quest.seasonId);

    } else {
        // ... (Undo logic can stay simple or also decrement logs if strict correctness needed)
        // For V1, we skip decrementing logs to avoid complexity with reverting dates
        // Revert XP & Heal Boss (Undo)
        await db.update(seasons)
            .set({
                xpCurrent: sql`MAX(0, ${seasons.xpCurrent} - ${xpAmount})`,
                bossHpCurrent: sql`MIN(${season.bossHpMax}, ${seasons.bossHpCurrent} + ${damage})`,
            })
            .where(eq(seasons.id, season.id));
    }

    revalidatePath("/");
    revalidatePath("/quest-forge");
}

export async function clearStandaloneQuestsAction() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.delete(quests).where(
        sql`${quests.questlineId} IS NULL`
    );

    revalidatePath("/");
    revalidatePath("/quest-forge");
    return { success: true };
}
