import { Container, Graphics, Sprite, Assets, Texture, TilingSprite, BlurFilter } from 'pixi.js';
import { createTextureFromTemplate, createFogTexture, createSoftMaskTexture, TREE_PINE, MOUNTAIN_PEAK, PALETTE, BIOME_ASSETS, POI_ASSETS } from './pixel-assets';
import { BiomeFilter } from './biome-filter';
import { Noise } from './noise';

export const CHUNK_SIZE = 1024;

const BIOME_SCALING: Record<string, number> = {
    'FOREST': 0.6,
    'SWAMP': 0.5,
    'ICE': 0.6,
    'VOLCANIC': 0.6,
    'AUTUMN': 0.5,
    'DESERT': 1.4,
    'GRASSLAND': 1.4,
    'BEACH': 0.8,
    'WASTELAND': 0.8
};

export class ChunkManager {
    private chunkCache: Map<string, any> = new Map();
    private app: any;
    private TRULY_PIXI: any;
    private seed: string;
    private noise: Noise;
    private noiseTexture: any;

    // Texture Cache
    private textures: any = {};
    private biomeTextures: Record<string, Texture[]> = {};
    private texturesReady: boolean = false;

    constructor(app: any, pixi: any, seed: string = "season-1") {
        this.app = app;
        this.TRULY_PIXI = pixi;
        this.seed = seed;
        this.noise = new Noise(seed);
        this.loadTextures();
        this.noiseTexture = this.generateNoiseTexture();
    }

    private generateNoiseTexture(): any {
        const P = this.TRULY_PIXI;
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const imgData = ctx.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const n = this.noise.perlin(x * 0.05, y * 0.05) * 0.5 + 0.5;
                const v = Math.floor(n * 255);
                const i = (y * size + x) * 4;
                imgData.data[i] = v;
                imgData.data[i + 1] = v;
                imgData.data[i + 2] = v;
                imgData.data[i + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
        return P.Texture.from(canvas);
    }

    private async loadTextures() { // Renamed from initTextures
        if (this.texturesReady) return;

        const P = this.TRULY_PIXI;
        // 1. Load Biome Images
        try {
            const loadBiome = async (key: string, paths: string | string[]) => {
                const texPaths = Array.isArray(paths) ? paths : [paths];
                const texs = [];
                for (const p of texPaths) {
                    try {
                        const t = await Assets.load(p);
                        if (t) {
                            t.source.scaleMode = 'nearest';
                            texs.push(t);
                        }
                    } catch (err) {
                        console.warn(`Failed to load texture ${p}:`, err);
                    }
                }
                this.biomeTextures[key] = texs;
            };

            const assetsToLoad = Object.entries(BIOME_ASSETS);
            await Promise.all(assetsToLoad.map(([key, paths]) => loadBiome(key, paths)));

            // 2. Load POI Images
            const poiEntries = Object.entries(POI_ASSETS);
            for (const [key, path] of poiEntries) {
                try {
                    const t = await Assets.load(path);
                    if (t) {
                        t.source.scaleMode = 'nearest';
                        this.textures[key] = t;
                    }
                } catch (err) {
                    console.warn(`Failed to load POI ${key}:`, err);
                }
            }

            console.log("Biome & POI Textures Successfully Mapped");

        } catch (e) {
            console.error("Critical Failure Loading Assets:", e);
        }

        // 3. Generate Templates & Masks
        try {
            this.textures.tree = await createTextureFromTemplate(this.app, P, TREE_PINE, PALETTE.TREE);
            this.textures.mountain = await createTextureFromTemplate(this.app, P, MOUNTAIN_PEAK, PALETTE.MOUNTAIN);
            this.textures.fog = createFogTexture(this.app, P);
            this.textures.mask = createSoftMaskTexture(this.app, P);
        } catch (e) { console.error("Texture Gen Failed:", e); }

        this.texturesReady = true;
    }

    public get isTexturesReady(): boolean {
        return this.texturesReady;
    }

    public get allTextures(): any {
        return this.textures;
    }

    public getChunkKey(x: number, y: number): string {
        return `${x},${y}`;
    }

    public getChunk(x: number, y: number): any {
        const key = this.getChunkKey(x, y);

        if (this.chunkCache.has(key)) {
            return this.chunkCache.get(key)!;
        }

        const chunk = this.generateChunk(x, y);
        chunk.label = `chunk-${key}`;
        chunk.x = x * CHUNK_SIZE;
        chunk.y = y * CHUNK_SIZE;

        // Always cache the chunk container to maintain consistency
        this.chunkCache.set(key, chunk);
        return chunk;
    }

    public clearCache() {
        this.chunkCache.forEach(c => {
            if (c.parent) c.parent.removeChild(c);
            c.destroy({ children: true });
        });
        this.chunkCache.clear();
    }


    // --- Biome Logic (Perlin Noise) ---
    private getBiome(x: number, y: number): { type: string, variant: number, weight: number } {
        const nx = x * 0.25;
        const ny = y * 0.25;

        const e1 = this.noise.perlin(nx, ny);
        const e2 = 0.5 * this.noise.perlin(nx * 2.1, ny * 2.1);
        const e3 = 0.25 * this.noise.perlin(nx * 4.2, ny * 4.2);
        const e4 = 0.125 * this.noise.perlin(nx * 8.4, ny * 8.4);

        let raw = (e1 + e2 + e3 + e4) / (1 + 0.5 + 0.25 + 0.125);
        raw = raw * 2.2; // Increase contrast

        const variant = (Math.abs(Math.floor(x * 13 + y * 27)) % 100);

        if (raw < -1.4) return { type: 'ICE', variant, weight: raw };
        if (raw < -0.9) return { type: 'SWAMP', variant, weight: raw };
        if (raw < -0.5) return { type: 'AUTUMN', variant, weight: raw };
        if (raw < 0.2) return { type: 'GRASSLAND', variant, weight: raw };
        if (raw < 0.6) return { type: 'FOREST', variant, weight: raw };
        if (raw < 0.9) return { type: 'BEACH', variant, weight: raw };
        if (raw < 1.3) return { type: 'DESERT', variant, weight: raw };
        if (raw < 1.7) return { type: 'WASTELAND', variant, weight: raw };
        return { type: 'VOLCANIC', variant, weight: raw };
    }

    private getPOI(x: number, y: number): string | null {
        const nx = x * 1.5 + 1234.5;
        const ny = y * 1.5 + 6789.0;
        const p = this.noise.perlin(nx, ny);

        if (p > 0.92) {
            const types = ['VILLAGE', 'STONE_CIRCLE', 'FORTRESS', 'RUINS', 'TOWER'];
            const index = Math.abs(Math.floor(p * 100)) % types.length;
            return types[index];
        }
        return null;
    }

    private generateChunk(x: number, y: number): any {
        const P = this.TRULY_PIXI;
        const container = new P.Container();

        // --- Layer 0: Global Base (Prevent Holes) ---
        // Using Grassland as a safety net under everything
        const grasslandTex = this.biomeTextures['GRASSLAND']?.[0];
        if (grasslandTex) {
            const base = new P.TilingSprite({
                texture: grasslandTex,
                width: CHUNK_SIZE,
                height: CHUNK_SIZE
            });
            base.tilePosition.x = -x * CHUNK_SIZE;
            base.tilePosition.y = -y * CHUNK_SIZE;
            container.addChild(base);
        }

        const { type, variant, weight } = this.getBiome(x, y);

        // --- Layer 1: The Primary Biome (With Soft Blending) ---
        const SPRITE_SIZE = 1536;
        const OFFSET = (SPRITE_SIZE - CHUNK_SIZE) / 2;

        const textures = this.biomeTextures[type];
        if (this.texturesReady && textures && textures.length > 0) {
            const tex = textures[Math.abs(Math.floor(variant)) % textures.length];

            const bg = new P.TilingSprite({
                texture: tex,
                width: CHUNK_SIZE,
                height: CHUNK_SIZE
            });
            bg.tilePosition.x = -x * CHUNK_SIZE;
            bg.tilePosition.y = -y * CHUNK_SIZE;

            // --- Map 2.0 Shader Blending ---
            // We use the noise texture to mask this biome into the baseline
            // alpha = 1.0 (Biome), alpha = 0.0 (reveal Baseline)
            if (this.noiseTexture && tex) {
                // Determine a threshold based on the biome weight (normalized -1 to 1)
                // If weight is high, we want MORE of this biome (lower limit)
                const threshold = (weight + 1) / 2; // 0 to 1
                try {
                    const filter = new BiomeFilter(this.noiseTexture);
                    filter.limit = 1.0 - threshold;
                    filter.smoothness = 0.15;
                    bg.filters = [filter];
                } catch (e) {
                    bg.alpha = weight > 0 ? 1 : 0;
                }
            }

            container.addChild(bg);
        }

        // --- Layer 2: POIs (The Landmarks) ---
        const poiType = this.getPOI(x, y);
        if (poiType && this.textures[poiType]) {
            const poi = new P.Sprite(this.textures[poiType]);
            poi.anchor.set(0.5);

            // Randomly place within chunk area
            const rx = (this.noise.perlin(x * 5, y * 5) * 0.5 + 0.5) * CHUNK_SIZE;
            const ry = (this.noise.perlin(x * 5 + 10, y * 5 + 10) * 0.5 + 0.5) * CHUNK_SIZE;

            poi.x = rx;
            poi.y = ry;

            // Scale up for impact
            poi.width = 600;
            poi.height = 600;

            // Random horizontal flip
            const flip = this.noise.perlin(x * 2.1, y * 2.1) > 0 ? 1 : -1;
            poi.scale.x *= flip;

            // Subtle rotation variation (+/- 5 degrees)
            const rotation = (this.noise.perlin(x * 3.1, y * 3.1) - 0.5) * 0.17;
            poi.rotation = rotation;

            // --- Circular Mask (Fix for baked checkerboard) ---
            const mask = new P.Graphics();
            mask.circle(0, 0, poi.width * 0.4);
            mask.fill(0xffffff);
            poi.mask = mask;
            container.addChild(mask);

            container.addChild(poi);
        }

        return container;
    }

    public updateChunk(chunk: any, isDiscovered: boolean) {
        if (!chunk) return;
        chunk.alpha = isDiscovered ? 1.0 : 0.05;
        chunk.visible = isDiscovered || chunk.alpha > 0.05;
    }

    public setDiscoveredChunks(discovered: Set<string>) {
        // This is used by SeasonMapCanvas
    }

    public pruneChunks(visibleKeys: Set<string>) {
        // Only prune if cache is getting too large to avoid flicker
        if (this.chunkCache.size < 50) return;

        this.chunkCache.forEach((chunk, key) => {
            if (!visibleKeys.has(key)) {
                if (chunk.parent) chunk.parent.removeChild(chunk);
                chunk.destroy({ children: true });
                this.chunkCache.delete(key);
            }
        });
    }
}
