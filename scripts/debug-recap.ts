
import { config } from 'dotenv';
config({ path: '.env.local' });

import { eq, and, desc, sql } from "drizzle-orm";

async function debugRecap() {
    console.log("--- Starting Recap Debug (Dynamic Import) ---");

    // Dynamic import to ensure env is loaded
    const { db } = await import("@/lib/db");
    const { users, seasons, quests } = await import("@/db/schema");
    const { generateRecap } = await import("@/lib/recap-actions");

    // 1. Get a User
    const allUsers = await db.select().from(users).limit(1);
    if (!allUsers.length) {
        console.error("No users found in DB.");
        return;
    }
    const user = allUsers[0];
    console.log(`User found: ${user.email} (${user.id})`);

    // 2. Get Active Season
    const activeSeasons = await db
        .select()
        .from(seasons)
        .where(and(eq(seasons.userId, user.id), eq(seasons.status, "active")))
        .limit(1);

    if (!activeSeasons.length) {
        console.error("No active season found for user.");
        return;
    }
    const activeSeason = activeSeasons[0];
    console.log(`Active Season: ${activeSeason.title} (${activeSeason.id})`);

    // 3. Check Weekly Quests
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Raw check
    const weeklyQuests = await db.select().from(quests).where(and(
        eq(quests.seasonId, activeSeason.id),
        eq(quests.status, "done"),
        sql`${quests.completedAt} >= ${sevenDaysAgo}`
    ));

    console.log(`Found ${weeklyQuests.length} completed quests in the last 7 days.`);
    weeklyQuests.forEach(q => console.log(` - ${q.title} (${q.completedAt})`));

    // 4. Try Generate
    console.log("Attempting generateRecap()...");
    try {
        const result = await generateRecap(activeSeason.id);
        console.log("generateRecap Result:", result ? "SUCCESS (Data returned)" : "FAILURE (Returned null)");
        if (result) {
            console.log(JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.error("generateRecap THREW exception:", e);
    }
}

debugRecap().catch(console.error).finally(() => process.exit());
