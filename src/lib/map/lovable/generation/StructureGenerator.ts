import { Graphics } from 'pixi.js';
import type { BiomeType, StructureType, PlacedStructure, StructureVariation } from '@/lib/map/lovable/types/generation';
import { CHUNK_SIZE } from '@/lib/map/lovable/types/generation';
import { getBiomeDefinition } from '@/lib/map/lovable/data/BiomeDatabase';
import { drawStructure } from '@/lib/map/lovable/data/StructurePatterns';
import { getBiomeAt } from './BiomeGenerator';
import { createSeededRandom, hashCoords } from '@/lib/map/lovable/utils/SeededRandom';
import { PerlinNoise } from '@/lib/map/lovable/utils/PerlinNoise';

/**
 * Structure Generator
 * Places rare biome-specific structures using noise-based placement
 * Now includes variation system for visual diversity
 */

// Structure placement noise (very large scale for sparse placement)
const structureNoise = new PerlinNoise(55555);

// Minimum distance between structures (in world units)
const MIN_STRUCTURE_SPACING = 300;

// Grid size for structure placement checks
const STRUCTURE_GRID_SIZE = 200;

/**
 * Generate structure graphics for a chunk
 */
export function generateStructures(chunkX: number, chunkY: number): Graphics | null {
  const graphics = new Graphics();
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;
  let hasStructures = false;

  // Check potential structure positions in a grid
  for (let gridY = 0; gridY < CHUNK_SIZE; gridY += STRUCTURE_GRID_SIZE) {
    for (let gridX = 0; gridX < CHUNK_SIZE; gridX += STRUCTURE_GRID_SIZE) {
      const worldX = worldOffsetX + gridX + STRUCTURE_GRID_SIZE / 2;
      const worldY = worldOffsetY + gridY + STRUCTURE_GRID_SIZE / 2;

      const placement = shouldPlaceStructure(worldX, worldY);

      if (placement) {
        const localX = gridX + STRUCTURE_GRID_SIZE / 2;
        const localY = gridY + STRUCTURE_GRID_SIZE / 2;

        drawStructure(graphics, placement.type, localX, localY, placement.scale);
        hasStructures = true;
      }
    }
  }

  return hasStructures ? graphics : null;
}

/**
 * Determine if a structure should be placed at this position
 */
export function shouldPlaceStructure(worldX: number, worldY: number): PlacedStructure | null {
  // Sample structure noise
  const noiseVal = structureNoise.noise2D(worldX * 0.002, worldY * 0.002);

  // Only place at noise peaks (very sparse)
  if (noiseVal < 0.88) {
    return null;
  }

  // Get biome at this location
  const biome = getBiomeAt(worldX, worldY);
  const biomeDef = getBiomeDefinition(biome);

  // Additional chance check based on biome
  const rng = createSeededRandom(worldX, worldY, 99999);
  if (!rng.nextBool(biomeDef.structureChance * 2)) {
    return null;
  }

  // Pick structure type
  const structureType = rng.pick(biomeDef.structures);

  // Scale variation
  const scale = rng.nextFloat(0.8, 1.2);

  return {
    type: structureType,
    biome,
    x: worldX,
    y: worldY,
    scale,
  };
}

/**
 * Get all structures in a chunk (for debugging/inspection)
 */
export function getChunkStructures(chunkX: number, chunkY: number): PlacedStructure[] {
  const structures: PlacedStructure[] = [];
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;

  for (let gridY = 0; gridY < CHUNK_SIZE; gridY += STRUCTURE_GRID_SIZE) {
    for (let gridX = 0; gridX < CHUNK_SIZE; gridX += STRUCTURE_GRID_SIZE) {
      const worldX = worldOffsetX + gridX + STRUCTURE_GRID_SIZE / 2;
      const worldY = worldOffsetY + gridY + STRUCTURE_GRID_SIZE / 2;

      const placement = shouldPlaceStructure(worldX, worldY);

      if (placement) {
        structures.push(placement);
      }
    }
  }

  return structures;
}

/**
 * Find the nearest structure to a position
 */
export function findNearestStructure(
  worldX: number,
  worldY: number,
  searchRadius: number = 1000
): PlacedStructure | null {
  const chunkRadius = Math.ceil(searchRadius / CHUNK_SIZE);
  const centerChunkX = Math.floor(worldX / CHUNK_SIZE);
  const centerChunkY = Math.floor(worldY / CHUNK_SIZE);

  let nearest: PlacedStructure | null = null;
  let nearestDist = Infinity;

  for (let dy = -chunkRadius; dy <= chunkRadius; dy++) {
    for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
      const structures = getChunkStructures(centerChunkX + dx, centerChunkY + dy);

      for (const structure of structures) {
        const dist = Math.hypot(structure.x - worldX, structure.y - worldY);
        if (dist < nearestDist && dist <= searchRadius) {
          nearestDist = dist;
          nearest = structure;
        }
      }
    }
  }

  return nearest;
}
