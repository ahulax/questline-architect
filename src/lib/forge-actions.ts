"use server";

import { generateQuestline as generateQuestlineAI, QuestlineAIOutput } from "@/lib/ai/quest-forge";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { quests, questlines, questNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function generateQuestlineAction(goal: string, seasonTitle?: string, timeWindowWeeks?: number) {
    try {
        const result = await generateQuestlineAI({
            goal,
            seasonTitle,
            timeWindowWeeks
        });
        return { success: true, data: result };
    } catch (error) {
        console.error("Generate Questline Action Failed:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to generate questline." };
    }
}

export async function saveQuestlineAction(seasonId: string, data: QuestlineAIOutput) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const qlData = data.questline;
    const questlineId = uuidv4();

    // Get current max order index
    const existing = await db.select().from(questlines).where(eq(questlines.seasonId, seasonId));
    const orderIndex = existing.length + 1;

    // 1. Insert Questline
    await db.insert(questlines).values({
        id: questlineId,
        seasonId: seasonId,
        title: qlData.title,
        description: qlData.description,
        orderIndex: orderIndex,
    });

    // 2. Insert Quests
    // Map temp IDs to real UUIDs
    const idMap = new Map<string, string>();
    qlData.quests.forEach(q => idMap.set(q.id, uuidv4()));

    for (const q of qlData.quests) {
        const realId = idMap.get(q.id)!;
        const realParentId = q.parentId ? idMap.get(q.parentId) : null;

        await db.insert(quests).values({
            id: realId,
            seasonId: seasonId,
            questlineId: questlineId,
            parentId: realParentId || null,
            title: q.title,
            description: q.description,
            type: q.type,
            effort: q.effort,
            status: "todo",
            orderIndex: q.order, // Correctly mapped
            flavorData: JSON.stringify({
                tags: q.tags,
                enemyType: q.enemy_name,
                enemyDescription: q.enemy_description,
                enemyVisual: q.enemy_visual
            }),
        });
    }

    revalidatePath("/");
    revalidatePath("/quest-forge");

    return { success: true, questlineId };
}

export async function getQuestNotesAction(questId: string) {
    try {
        const notes = await db.query.questNotes.findMany({
            where: eq(questNotes.questId, questId),
            orderBy: desc(questNotes.createdAt),
        });
        return { success: true, data: notes };
    } catch (err) {
        console.error("Failed to fetch notes:", err);
        return { success: false, error: "Failed to fetch notes" };
    }
}

export async function addQuestNoteAction(questId: string, text: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await db.insert(questNotes).values({
            id: uuidv4(),
            questId,
            text,
        });
        return { success: true };
    } catch (err) {
        console.error("Failed to add note:", err);
        return { success: false, error: "Failed to add note" };
    }
}

// --- Backward Compatibility for Legacy Helper / Scripts ---

export type ForgeResult = QuestlineAIOutput;

export const generateQuestline = generateQuestlineAction;

export async function breakDownQuest(goal: string): Promise<QuestlineAIOutput> {
    const res = await generateQuestlineAction(goal);
    if (!res.success || !res.data) {
        throw new Error(res.error || "Failed to breakdown quest");
    }
    return res.data;
}

export async function action_acceptQuest(seasonId: string, result: QuestlineAIOutput) {
    const res = await saveQuestlineAction(seasonId, result);
    if (!res.success) {
        throw new Error("Failed to save questline");
    }
}
