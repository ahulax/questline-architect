import { db } from "@/lib/db";
import { users, seasons, quests, dailyLogs, questlines } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

import { auth } from "@/auth";
import { getLatestRecap } from "@/lib/recap-actions";

export async function getDashboardData() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const usersResult = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
    const user = usersResult[0];

    // If no user found in DB (shouldn't happen if auth worked), return null
    if (!user) return null;

    // 2. Get Active Season
    const activeSeasons = await db
        .select()
        .from(seasons)
        .where(and(eq(seasons.userId, user.id), eq(seasons.status, "active")))
        .limit(1);

    const activeSeason = activeSeasons[0] || null;

    // 3. Get Quests for Today
    // Logic: For every active questline, show the first 1-2 incomplete quests.
    let todayQuests: typeof quests.$inferSelect[] = [];
    let seasonQuestlines: typeof questlines.$inferSelect[] = [];

    if (activeSeason) {
        // 1. Get all questlines for the season
        seasonQuestlines = await db
            .select()
            .from(questlines)
            .where(eq(questlines.seasonId, activeSeason.id));

        // 2. Fetch all quests for the season (to count progress)
        const allSeasonQuests = await db
            .select()
            .from(quests)
            .where(eq(quests.seasonId, activeSeason.id))
            .orderBy(quests.orderIndex, quests.createdAt);

        const allIncompleteQuests = allSeasonQuests.filter(q => ["todo", "in_progress"].includes(q.status));

        // 3. Group and Pick (1-2 per questline) + Stats
        const pickedQuests: typeof quests.$inferSelect[] = [];

        // Attach stats to questlines
        const questlinesWithStats = seasonQuestlines.map(ql => {
            const qlQuests = allSeasonQuests.filter(q => q.questlineId === ql.id);
            const done = qlQuests.filter(q => q.status === 'done').length;
            const total = qlQuests.length;

            const qlIncomplete = allIncompleteQuests.filter(q => q.questlineId === ql.id);

            // Logic: Pick "1 Current" and "1 Next"
            // Current = first one that is in_progress, else the first todo.
            // Next = the one immediately following the current.
            const current = qlIncomplete.find(q => q.status === 'in_progress') || qlIncomplete[0];
            const currentIndex = qlIncomplete.indexOf(current);
            const next = currentIndex !== -1 ? qlIncomplete[currentIndex + 1] : qlIncomplete[1];

            if (current) pickedQuests.push(current);
            if (next) pickedQuests.push(next);

            return {
                ...ql,
                stats: { done, total }
            };
        });

        // Handle Standalone (no questline)
        const standaloneIncomplete = allIncompleteQuests.filter(q => !q.questlineId);
        const currentStandalone = standaloneIncomplete.find(q => q.status === 'in_progress') || standaloneIncomplete[0];
        const standaloneIndex = standaloneIncomplete.indexOf(currentStandalone);
        const nextStandalone = standaloneIndex !== -1 ? standaloneIncomplete[standaloneIndex + 1] : standaloneIncomplete[1];

        if (currentStandalone) pickedQuests.push(currentStandalone);
        if (nextStandalone) pickedQuests.push(nextStandalone);

        todayQuests = pickedQuests;
        seasonQuestlines = questlinesWithStats as any;
    }

    const latestRecap = activeSeason ? await getLatestRecap(activeSeason.id) : null;

    return {
        user,
        activeSeason,
        quests: todayQuests,
        questlines: seasonQuestlines,
        latestRecap: latestRecap?.data || null
    };
}

export async function getSeasonMapData() {
    const { user, activeSeason } = await getDashboardData() || {};
    if (!activeSeason) return null;

    // Get Questlines
    const seasonQuestlines = await db
        .select()
        .from(questlines)
        .where(eq(questlines.seasonId, activeSeason.id))
        .orderBy(questlines.orderIndex);

    // Get Quests for these questlines
    // We'll group them manually or use a join. Simple separate query for v1.
    const seasonQuests = await db
        .select()
        .from(quests)
        .where(eq(quests.seasonId, activeSeason.id));

    // Build Hierarchy
    const mapData = seasonQuestlines.map(ql => {
        return {
            ...ql,
            quests: seasonQuests.filter(q => q.questlineId === ql.id).sort((a, b) => {
                // Sort by implicit order if we had it, or just creation / arbitrary.
                // V1 Schema didn't put order on quests, let's assume they are sorted by creation or just simple filter.
                return 0;
            })
        };
    });

    return { activeSeason, mapData };
}
