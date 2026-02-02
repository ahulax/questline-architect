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
            // Determine node type based on tier or importance
            // For V1, let's make the last quest of a questline a 'fortress' or 'tower', others 'village' or 'ruins'
            const isLastInLine = qIndex === sortedQuests.length - 1;
            let type: NodeType = 'town';

            if (isLastInLine) {
                type = 'fortress';
            } else if (qIndex === 0) {
                type = 'town';
            } else {
                // Randomize slightly based on seed
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

            const node: MapNode = {
                id: quest.id,
                x: globalX,
                y: globalY,
                type,
                biome,
                isDiscovered: true, // Always visible for now
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
