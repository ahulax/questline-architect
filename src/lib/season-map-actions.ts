
"use server";

import { db } from "@/lib/db";
import { seasons, questlines, quests } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { QuestLocationService } from "@/lib/map/quest-location";

export type MapNode = {
    id: string;
    type: "quest" | "boss";
    title: string;
    status: string;
    x: number;
    y: number;
    orderIndex: number;
    questlineId?: string;
    questlineTitle?: string;
    questlineOrderIndex?: number;
};

export async function getSeasonMapNodes(seasonId: string): Promise<MapNode[]> {
    console.log(`[ServerAction] getSeasonMapData called for seasonId: ${seasonId}`);

    try {
        // 1. Fetch Questlines (ordered)
        console.log("[ServerAction] Querying DB...");
        const qls = await (db as any).query.questlines.findMany({
            where: eq(questlines.seasonId, seasonId),
            orderBy: asc(questlines.orderIndex),
            with: {
                quests: {
                    orderBy: asc(quests.orderIndex)
                }
            }
        });
        console.log(`[ServerAction] Found ${qls.length} questlines.`);

        const nodes: MapNode[] = [];

        // 2. Map Quests to Coordinates
        qls.forEach((ql: any, qlIndex: number) => {
            ql.quests.forEach((q: any, qIndex: number) => {
                const pos = QuestLocationService.getCoordinates(q.id, ql.orderIndex, qIndex);

                nodes.push({
                    id: q.id,
                    type: "quest",
                    title: q.title,
                    status: q.status,
                    x: pos.x,
                    y: pos.y,
                    orderIndex: q.orderIndex,
                    questlineId: ql.id,
                    questlineTitle: ql.title,
                    questlineOrderIndex: ql.orderIndex
                });
            });
        });

        // 3. Add Boss Node (Final Destination)
        const lastQlIndex = qls.length;
        // Boss is further out
        const bossX = lastQlIndex * 2000 + 1000;
        const bossY = 0;

        nodes.push({
            id: "final-boss",
            type: "boss",
            title: "Final Boss",
            status: "locked",
            x: bossX,
            y: bossY,
            orderIndex: 999,
            questlineOrderIndex: 999
        });

        return nodes;
    } catch (error) {
        console.error("Error fetching map nodes:", error);
        return [];
    }
}
