
// Simple, browser/node compatible pseudo-random based on string seed
// Using a simple hash function instead of Node's crypto module

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function pseudoRandom(seed: string): number {
    return (simpleHash(seed) % 10000) / 10000;
}

export type Point = { x: number; y: number };

export class QuestLocationService {
    private static REGION_DISTANCE = 2000;
    private static QUEST_SPREAD = 600;

    static getCoordinates(
        questId: string,
        questlineIndex: number,
        questIndexInLine: number
    ): Point {
        const hubX = questlineIndex * this.REGION_DISTANCE;
        const hubY = Math.sin(questlineIndex * 0.8) * (this.REGION_DISTANCE * 0.5);

        const seed = `${questId}-pos`;
        const rngAngle = pseudoRandom(seed + "angle") * Math.PI * 2;
        const rngDist = pseudoRandom(seed + "dist") * this.QUEST_SPREAD;

        const baseAngle = (questIndexInLine / 3) * Math.PI * 2;

        const finalX = hubX + Math.cos(baseAngle + rngAngle * 0.2) * (300 + rngDist * 0.5);
        const finalY = hubY + Math.sin(baseAngle + rngAngle * 0.2) * (300 + rngDist * 0.5);

        return { x: Math.round(finalX), y: Math.round(finalY) };
    }
}
