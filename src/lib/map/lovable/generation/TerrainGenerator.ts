import { Graphics } from 'pixi.js';
import type { BiomeType } from '@/lib/map/lovable/types/generation';
import { CHUNK_SIZE, CELL_SIZE } from '@/lib/map/lovable/types/generation';
import { getBiomeDefinition } from '@/lib/map/lovable/data/BiomeDatabase';
import { getBiomeAt, getBiomeBlendAt } from './BiomeGenerator';
import { lerpColorRGB, varyColor } from '@/lib/map/lovable/utils/ColorUtils';
import { PerlinNoise } from '@/lib/map/lovable/utils/PerlinNoise';

/**
 * Terrain Generator
 * Generates the base terrain layer (ground colors/patterns) for each chunk
 */

// Detail noise for terrain variation
const terrainDetailNoise = new PerlinNoise(33333);

/**
 * Generate terrain graphics for a chunk
 */
export function generateTerrain(chunkX: number, chunkY: number): Graphics {
  const graphics = new Graphics();
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;

  // Generate cells with biome-based coloring
  for (let localY = 0; localY < CHUNK_SIZE; localY += CELL_SIZE) {
    for (let localX = 0; localX < CHUNK_SIZE; localX += CELL_SIZE) {
      const worldX = worldOffsetX + localX;
      const worldY = worldOffsetY + localY;

      // Get biome and blend info
      const blendInfo = getBiomeBlendAt(worldX, worldY);
      const primaryDef = getBiomeDefinition(blendInfo.primary);

      // Get noise value for color variation
      const noiseVal = terrainDetailNoise.noise2D(worldX * 0.01, worldY * 0.01);

      // Calculate base color from primary biome
      let baseColor = lerpColorRGB(
        primaryDef.colors.primary,
        primaryDef.colors.secondary,
        noiseVal
      );

      // Apply subtle variation
      baseColor = varyColor(baseColor, noiseVal, 0.08);

      // Blend with neighboring biomes if at boundary
      if (blendInfo.blends.length > 0) {
        for (const blend of blendInfo.blends) {
          const blendDef = getBiomeDefinition(blend.biome);
          const blendColor = lerpColorRGB(
            blendDef.colors.primary,
            blendDef.colors.secondary,
            noiseVal
          );
          baseColor = lerpColorRGB(baseColor, blendColor, blend.weight * 0.5);
        }
      }

      // Draw the cell
      graphics.rect(localX, localY, CELL_SIZE, CELL_SIZE).fill(baseColor);
    }
  }

  return graphics;
}

/**
 * Generate terrain for a specific biome (useful for testing)
 */
export function generateBiomeTerrain(biome: BiomeType, width: number, height: number): Graphics {
  const graphics = new Graphics();
  const biomeDef = getBiomeDefinition(biome);

  for (let y = 0; y < height; y += CELL_SIZE) {
    for (let x = 0; x < width; x += CELL_SIZE) {
      const noiseVal = terrainDetailNoise.noise2D(x * 0.01, y * 0.01);
      let color = lerpColorRGB(
        biomeDef.colors.primary,
        biomeDef.colors.secondary,
        noiseVal
      );
      color = varyColor(color, noiseVal, 0.08);
      graphics.rect(x, y, CELL_SIZE, CELL_SIZE).fill(color);
    }
  }

  return graphics;
}

/**
 * Get the dominant biome for a chunk (for optimization decisions)
 */
export function getChunkDominantBiome(chunkX: number, chunkY: number): BiomeType {
  const worldX = chunkX * CHUNK_SIZE + CHUNK_SIZE / 2;
  const worldY = chunkY * CHUNK_SIZE + CHUNK_SIZE / 2;
  return getBiomeAt(worldX, worldY);
}
