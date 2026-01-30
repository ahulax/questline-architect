
// Pixel Art Templates (1 = Primary, 2 = Highlight, 3 = Shadow)
// 0 = Transparent

export const TREE_PINE = [
    "0001000",
    "0011100",
    "0011100",
    "0111110",
    "0111110",
    "1111111",
    "0003000",
    "0003000",
];

export const MOUNTAIN_PEAK = [
    "0000001000000",
    "0000012100000",
    "0000122210000",
    "0001122211000",
    "0011111111100",
    "0133111111330",
    "1333333333331",
];

// --- RETRO RPG PALETTE ---
export const PALETTE = {
    WATER: 0x5e8cba,
    PLAINS: 0x9bb57c,
    FOREST_GROUND: 0x7a9660,
    MOUNTAIN_BASE: 0x9da5ab,

    // Sprite Colors
    TREE: { PRIMARY: 0x2d4f3e, HIGHLIGHT: 0x4a7a62, SHADOW: 0x1f362a },
    MOUNTAIN: { PRIMARY: 0x6e767d, HIGHLIGHT: 0xe8ebe4, SHADOW: 0x4a5054 },

    // Markers
    QUEST: { PRIMARY: 0xD2691E, HIGHLIGHT: 0xFFD700, SHADOW: 0x8B4513 }, // Chocolate / Gold
    BOSS: { PRIMARY: 0x8B0000, HIGHLIGHT: 0xFF4500, SHADOW: 0x000000 },   // Dark Red / Orange
};

export const BIOME_ASSETS = {
    DESERT: ["/textures/biomes/desert_clean.png"],
    FOREST: ["/textures/biomes/forest_clean.png"],
    GRASSLAND: ["/textures/biomes/grassland_clean.png"],
    ICE: ["/textures/biomes/ice_clean.png"],
    SWAMP: ["/textures/biomes/swamp_clean.png"],
    VOLCANIC: ["/textures/biomes/volcanic_clean.png"],
    AUTUMN: ["/textures/biomes/autumn_clean.png"],
    BEACH: ["/textures/biomes/beach_clean.png"],
    WASTELAND: ["/textures/biomes/wasteland_clean.png"],
    TRANSITION: "/textures/biomes/biome_transitions.webp"
};

export const POI_ASSETS = {
    VILLAGE: "/textures/poi/village.png",
    STONE_CIRCLE: "/textures/poi/stone_circle.png",
    FORTRESS: "/textures/poi/fortress.png",
    RUINS: "/textures/poi/ruins.png",
    TOWER: "/textures/poi/tower.png"
};

export const HOUSE_SMALL = [
    "000010000",
    "000111000",
    "001111100",
    "011121110",
    "122222221",
    "013333310",
    "013111310",
    "013111310",
];

export const SKULL_BOSS = [
    "000111000",
    "001222100",
    "012222210",
    "121222121",
    "122222221",
    "012222210",
    "001010100",
    "001010100",
];

export const TOWER_SMALL = [
    "000111000",
    "001111100",
    "001222100",
    "001111100",
    "001131100",
    "001333100",
    "011131110",
];

// Helper to compile texture on the fly
export async function createTextureFromTemplate(app: any, pixi: any, template: string[], palette: any): Promise<any> {
    const P = pixi;
    const container = new P.Container();
    const size = 4; // Pixel Size multiplier

    template.forEach((row, y) => {
        row.split('').forEach((pixel, x) => {
            if (pixel === "0") return;

            const g = new P.Graphics();
            let color = 0x000000;
            if (pixel === "1") color = palette.PRIMARY;
            if (pixel === "2") color = palette.HIGHLIGHT;
            if (pixel === "3") color = palette.SHADOW;

            g.rect(0, 0, size, size);
            g.fill(color);
            g.x = x * size;
            g.y = y * size;
            container.addChild(g);
        });
    });

    return app.renderer.generateTexture(container);
}

export function createFogTexture(app: any, pixi: any): any {
    const P = pixi;
    const g = new P.Graphics();
    const size = 512; // Larger tile for background

    // Base Dark
    g.rect(0, 0, size, size);
    g.fill(0x0a0a0a);

    // Smoke Puffs
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = 30 + Math.random() * 60;
        g.circle(x, y, r);
        g.fill({ color: 0x1a1a1a, alpha: 0.4 });
    }

    return app.renderer.generateTexture(g);
}

/**
 * Creates a variant of a texture by cropping or offsetting it.
 * This allows reusing the same asset for different "parts" of a biome.
 */
export function createTextureVariant(baseTexture: any, x: number, y: number, width: number, height: number): any {
    try {
        const frame = { x, y, width, height };
        // PIXI Texture.from or clone with frame
        return new baseTexture.constructor(baseTexture.baseTexture, frame);
    } catch (e) {
        console.error("Failed to create texture variant:", e);
        return baseTexture;
    }
}

export function createSoftMaskTexture(app: any, pixi: any, size: number = 1024): any {
    const P = pixi;
    const container = new P.Container();
    const g = new P.Graphics();

    // Draw white circle
    g.circle(size / 2, size / 2, size / 2 - 64);
    g.fill(0xffffff);
    container.addChild(g);

    // Apply blur to the entire container to get soft edges
    const blur = new P.BlurFilter();
    blur.blur = 80;
    container.filters = [blur];

    return app.renderer.generateTexture(container);
}
