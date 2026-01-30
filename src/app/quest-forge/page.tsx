import { auth } from "@/auth";
import { db } from "@/lib/db";
import { seasons, quests, questlines } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { QuestForgeMain } from "@/components/quest-forge/quest-forge-main";

export default async function QuestForgePage() {
    const session = await auth();
    if (!session || !session.user?.id) return <div>Please login</div>;

    // Get available seasons (active or possibly upcoming)
    const availableSeasons = await db.query.seasons.findMany({
        where: eq(seasons.userId, session.user.id),
        orderBy: (seasons, { desc }) => [desc(seasons.startDate)],
    });

    const activeSeason = availableSeasons.find(s => s.status === 'active') || availableSeasons[0];



    if (!activeSeason) {
        return (
            <div className="container mx-auto p-12 text-center">
                <h1 className="text-2xl font-bold mb-4">No Active Season</h1>
                <p>Please create a season first to forge quests.</p>
            </div>
        );
    }

    // 1. Fetch ALL questlines for the season
    const allQuestlines = await db.query.questlines.findMany({
        where: eq(questlines.seasonId, activeSeason.id),
    });

    // 2. Fetch ALL quests for the season
    const allQuests = await db.query.quests.findMany({
        where: eq(quests.seasonId, activeSeason.id),
        orderBy: (quests, { asc }) => [asc(quests.orderIndex)],
    });

    // 3. Group quests by questline ID in memory for 100% consistency
    // We also handle orphans that have a parent_id but no direct questline_id
    const groupedQuestlines = allQuestlines.map(ql => {
        // Quests that directly belong to this questline
        const directQuests = allQuests.filter(q => q.questlineId === ql.id);

        // Also find children of these quests that might be missing the questlineId (legacy/edge case)
        const childQuests = allQuests.filter(q =>
            !q.questlineId && q.parentId && directQuests.some(dq => dq.id === q.parentId)
        );

        return {
            ...ql,
            quests: [...directQuests, ...childQuests]
        };
    });

    const standaloneQuests = allQuests.filter(q =>
        // Must have no questlineId AND its parent (if any) must also have no questlineId
        (!q.questlineId || !allQuestlines.find(ql => ql.id === q.questlineId)) &&
        (!q.parentId || !allQuests.find(pq => pq.id === q.parentId && pq.questlineId))
    );

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-2 font-display">Quest Forge ⚒️</h1>
            <p className="text-text-muted mb-8">Turn your big goals into a concrete RPG campaign.</p>

            <QuestForgeMain
                seasonId={activeSeason.id}
                seasonTitle={activeSeason.title}
                initialQuestlines={groupedQuestlines}
                standaloneQuests={standaloneQuests}
                availableSeasons={availableSeasons.map(s => ({ id: s.id, title: s.title }))}
            />
        </div>
    );
}
