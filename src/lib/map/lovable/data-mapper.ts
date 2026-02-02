import type { MapNode, QuestPath, BiomeType, NodeType } from '@/lib/map/lovable/types/map';
import type { quests, questlines } from '@/db/schema';

type Quest = typeof quests.$inferSelect;
type Questline = typeof questlines.$inferSelect;

interface QuestlineWithQuests extends Questline {
    quests: Quest[];
}

interface MappedData {
    nodes: MapNode[];
    paths: QuestPath[];
}

const BIOME_ORDER: BiomeType[] = ['grassland', 'forest', 'swamp', 'desert', 'snow', 'volcanic'];

/**
 * Deterministic pseudo-random number generator
 */
function seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

/**
 * Maps database quest data to visual map nodes and paths
 * Uses a deterministic layout algorithm to place nodes in a winding path
 */
export function mapSeasonDataToMap(seasonQuestlines: QuestlineWithQuests[]): MappedData {
    const nodes: MapNode[] = [];
    const paths: QuestPath[] = [];

    let globalX = 0;
    let globalY = 0;
    let previousNodeId: string | null = null;
    let seed = 12345; // Fixed seed for consistent layout

    // Sort questlines by order
    const sortedQuestlines = [...seasonQuestlines].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    sortedQuestlines.forEach((ql, qlIndex) => {
        // Assign biome based on questline index
        const biome = BIOME_ORDER[qlIndex % BIOME_ORDER.length];

        // Sort quests inside questline
        const sortedQuests = [...ql.quests].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

        sortedQuests.forEach((quest, qIndex) => {
            // Determine node type based on quest effort (S, M, L)
            // S = Camp/Ruins (Small)
            // M = Town/Tower (Medium)
            // L = Fortress/Portal (Large)
            let type: NodeType = 'ruins';

            if (quest.effort === 'L') {
                type = 'fortress';
            } else if (quest.effort === 'M') {
                type = 'town';
            } else {
                // S - Randomize between small structures
                const r = seededRandom(quest.id.charCodeAt(0));
                type = r > 0.5 ? 'ruins' : 'stone_circle';
            }

            // Generate Position
            // Create a winding path behavior
            // We want to move generally RIGHT (positive X), but snake up and down
            const stepX = 250 + seededRandom(seed++) * 100;
            const stepY = (seededRandom(seed++) - 0.5) * 400; // Vary Y up and down

            globalX += stepX;
            globalY += stepY;

            // Clamp Y to avoid drifting too far
            if (globalY > 1000) globalY -= 200;
            if (globalY < -1000) globalY += 200;

            // Discovery Logic
            // A node is discovered if:
            // 1. It is completed or in progress
            // 2. It is the very first quest
            // 3. The previous quest in the line is completed
            let isDiscovered = false;

            if (quest.status === 'done' || quest.status === 'in_progress') {
                isDiscovered = true;
            } else if (qIndex === 0 && qlIndex === 0) {
                // First quest of first questline is always discovered
                isDiscovered = true;
            } else if (qIndex === 0) {
                // First quest of subsequent questlines:
                // Discovered if the previous questline is fully done? 
                // OR: for now, let's say discovered if previous questline is at least started?
                // Let's keep it simple: Start of every questline is discovered for now, or check previous questline status.
                // Assuming sequential questlines:
                const prevQl = sortedQuestlines[qlIndex - 1];
                if (prevQl && prevQl.quests.every(q => q.status === 'done')) {
                    isDiscovered = true;
                } else {
                    // If we allow parallel questlines, maybe always visible? 
                    // Let's default to visible if it's the start of a track, so users can switch tracks.
                    isDiscovered = true;
                }
            } else {
                // Check previous quest in this line
                const prevQuest = sortedQuests[qIndex - 1];
                if (prevQuest && prevQuest.status === 'done') {
                    isDiscovered = true;
                }
            }

            const node: MapNode = {
                id: quest.id,
                x: globalX,
                y: globalY,
                type,
                biome,
                isDiscovered,
                title: quest.title,
                description: quest.description || undefined,
                status: quest.status as 'todo' | 'in_progress' | 'done' | 'dropped',
            };

            nodes.push(node);

            // Create Path from previous node
            if (previousNodeId) {
                let pathStatus: 'locked' | 'active' | 'completed' = 'locked';

                if (quest.status === 'done') {
                    pathStatus = 'completed';
                } else if (quest.status === 'in_progress' || quest.status === 'todo') {
                    pathStatus = 'active';
                }

                paths.push({
                    id: `path-${previousNodeId}-${quest.id}`,
                    fromNodeId: previousNodeId,
                    toNodeId: quest.id,
                    status: pathStatus
                });
            }

            previousNodeId = quest.id;
        });
    });

    return { nodes, paths };
}
