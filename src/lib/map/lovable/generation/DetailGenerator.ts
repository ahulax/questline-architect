import { Graphics } from 'pixi.js';
import type { BiomeType, DetailType, PlacedDetail } from '@/lib/map/lovable/types/generation';
import { CHUNK_SIZE, DETAIL_GRID_SIZE } from '@/lib/map/lovable/types/generation';
import { getBiomeDefinition } from '@/lib/map/lovable/data/BiomeDatabase';
import { drawDetail } from '@/lib/map/lovable/data/DetailPatterns';
import { getBiomeAt } from './BiomeGenerator';
import { createSeededRandom, hashCoords } from '@/lib/map/lovable/utils/SeededRandom';
import { PerlinNoise } from '@/lib/map/lovable/utils/PerlinNoise';

/**
 * Detail Generator
 * Places biome-specific details (trees, rocks, plants, etc.) using deterministic random
 */

// Noise for detail density variation
const densityNoise = new PerlinNoise(44444);

/**
 * Generate detail graphics for a chunk
 */
export function generateDetails(chunkX: number, chunkY: number): Graphics {
  const graphics = new Graphics();
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;

  // Generate details in a grid pattern for deterministic placement
  for (let gridY = 0; gridY < CHUNK_SIZE; gridY += DETAIL_GRID_SIZE) {
    for (let gridX = 0; gridX < CHUNK_SIZE; gridX += DETAIL_GRID_SIZE) {
      const worldX = worldOffsetX + gridX;
      const worldY = worldOffsetY + gridY;

      // Get biome and its definition
      const biome = getBiomeAt(worldX, worldY);
      const biomeDef = getBiomeDefinition(biome);

      // Get density from noise (creates natural variation)
      const densityMod = densityNoise.noise2D(worldX * 0.005, worldY * 0.005);
      const effectiveDensity = biomeDef.detailDensity * (0.5 + densityMod * 0.5);

      // Create seeded random for this grid cell
      const rng = createSeededRandom(worldX, worldY, 12345);

      // Determine how many details to place
      const detailCount = rng.nextBool(effectiveDensity) ? rng.nextInt(1, 3) : 0;

      for (let i = 0; i < detailCount; i++) {
        // Random position within grid cell
        const localX = gridX + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);
        const localY = gridY + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);

        // Pick detail type from biome
        const detailType = rng.pick(biomeDef.details);

        // Random scale variation
        const scale = rng.nextFloat(0.7, 1.3);

        // Generate seed for the detail itself
        const detailSeed = hashCoords(worldX + localX, worldY + localY, i);

        // Draw the detail
        drawDetail(graphics, detailType, localX, localY, scale, detailSeed);
      }
    }
  }

  return graphics;
}

/**
 * Get all placed details in a chunk (for debugging/inspection)
 */
export function getChunkDetails(chunkX: number, chunkY: number): PlacedDetail[] {
  const details: PlacedDetail[] = [];
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;

  for (let gridY = 0; gridY < CHUNK_SIZE; gridY += DETAIL_GRID_SIZE) {
    for (let gridX = 0; gridX < CHUNK_SIZE; gridX += DETAIL_GRID_SIZE) {
      const worldX = worldOffsetX + gridX;
      const worldY = worldOffsetY + gridY;

      const biome = getBiomeAt(worldX, worldY);
      const biomeDef = getBiomeDefinition(biome);

      const densityMod = densityNoise.noise2D(worldX * 0.005, worldY * 0.005);
      const effectiveDensity = biomeDef.detailDensity * (0.5 + densityMod * 0.5);

      const rng = createSeededRandom(worldX, worldY, 12345);
      const detailCount = rng.nextBool(effectiveDensity) ? rng.nextInt(1, 3) : 0;

      for (let i = 0; i < detailCount; i++) {
        const localX = gridX + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);
        const localY = gridY + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);
        const detailType = rng.pick(biomeDef.details);
        const scale = rng.nextFloat(0.7, 1.3);
        const detailSeed = hashCoords(worldX + localX, worldY + localY, i);

        details.push({
          type: detailType,
          x: localX,
          y: localY,
          scale,
          seed: detailSeed,
        });
      }
    }
  }

  return details;
}

/**
 * Generate details for a specific biome in an area (useful for testing)
 */
export function generateBiomeDetails(
  biome: BiomeType,
  width: number,
  height: number
): Graphics {
  const graphics = new Graphics();
  const biomeDef = getBiomeDefinition(biome);

  for (let gridY = 0; gridY < height; gridY += DETAIL_GRID_SIZE) {
    for (let gridX = 0; gridX < width; gridX += DETAIL_GRID_SIZE) {
      const rng = createSeededRandom(gridX, gridY, 12345);
      const detailCount = rng.nextBool(biomeDef.detailDensity) ? rng.nextInt(1, 3) : 0;

      for (let i = 0; i < detailCount; i++) {
        const localX = gridX + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);
        const localY = gridY + rng.nextFloat(4, DETAIL_GRID_SIZE - 4);
        const detailType = rng.pick(biomeDef.details);
        const scale = rng.nextFloat(0.7, 1.3);
        const detailSeed = hashCoords(gridX + localX, gridY + localY, i);

        drawDetail(graphics, detailType, localX, localY, scale, detailSeed);
      }
    }
  }

  return graphics;
}
