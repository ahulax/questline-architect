import type { BiomeType } from '@/lib/map/lovable/types/generation';
import { PerlinNoise } from '@/lib/map/lovable/utils/PerlinNoise';

/**
 * Biome Generator
 * Uses dual-channel noise (temperature + humidity) to determine biome type at any world position
 */

// Noise instances for consistent world generation
const temperatureNoise = new PerlinNoise(12345);
const humidityNoise = new PerlinNoise(67890);
const variationNoise = new PerlinNoise(11111);

// Noise scale controls biome region size (smaller = larger regions)
const BIOME_SCALE = 0.0003;
const VARIATION_SCALE = 0.002;

/**
 * Get the biome type at a given world coordinate
 * Uses temperature and humidity noise to create natural biome distribution
 */
export function getBiomeAt(worldX: number, worldY: number): BiomeType {
  // Sample temperature and humidity at world position
  const temp = temperatureNoise.fbm(worldX * BIOME_SCALE, worldY * BIOME_SCALE, 4);
  const humid = humidityNoise.fbm(
    (worldX + 10000) * BIOME_SCALE,
    (worldY + 10000) * BIOME_SCALE,
    4
  );

  // Add small variation to create more organic boundaries
  const variation = variationNoise.noise2D(worldX * VARIATION_SCALE, worldY * VARIATION_SCALE) * 0.1;
  const adjustedTemp = temp + variation;
  const adjustedHumid = humid + variation;

  return determineBiome(adjustedTemp, adjustedHumid);
}

/**
 * Get biome blend information for smooth transitions
 * Returns the primary biome and any neighboring biomes with blend weights
 */
export interface BiomeBlendInfo {
  primary: BiomeType;
  blends: Array<{ biome: BiomeType; weight: number }>;
}

export function getBiomeBlendAt(worldX: number, worldY: number): BiomeBlendInfo {
  const sampleRadius = 100;
  const samples: BiomeType[] = [];

  // Sample in a small area to detect biome boundaries
  const offsets = [
    [0, 0],
    [-sampleRadius, 0],
    [sampleRadius, 0],
    [0, -sampleRadius],
    [0, sampleRadius],
  ];

  for (const [ox, oy] of offsets) {
    samples.push(getBiomeAt(worldX + ox, worldY + oy));
  }

  const primary = samples[0];
  const blendMap = new Map<BiomeType, number>();

  // Count occurrences of each biome
  for (const biome of samples) {
    if (biome !== primary) {
      blendMap.set(biome, (blendMap.get(biome) || 0) + 1);
    }
  }

  // Convert to blend weights
  const blends: Array<{ biome: BiomeType; weight: number }> = [];
  for (const [biome, count] of blendMap) {
    blends.push({ biome, weight: count / samples.length });
  }

  return { primary, blends };
}

/**
 * Determine biome from temperature and humidity values
 * Creates a natural climate-based distribution
 */
function determineBiome(temp: number, humid: number): BiomeType {
  // Extreme temperatures override humidity
  if (temp < 0.22) return 'snow';
  if (temp > 0.78) return 'volcanic';

  // Hot + dry = desert
  if (temp > 0.58 && humid < 0.38) return 'desert';

  // High humidity = swamp
  if (humid > 0.68) return 'swamp';

  // Moderate conditions with good humidity = forest
  if (humid > 0.42 && temp > 0.32 && temp < 0.62) return 'forest';

  // Default to grassland
  return 'grassland';
}

/**
 * Get raw noise values at a position (useful for debugging)
 */
export function getNoiseValuesAt(worldX: number, worldY: number): { temp: number; humid: number } {
  const temp = temperatureNoise.fbm(worldX * BIOME_SCALE, worldY * BIOME_SCALE, 4);
  const humid = humidityNoise.fbm(
    (worldX + 10000) * BIOME_SCALE,
    (worldY + 10000) * BIOME_SCALE,
    4
  );
  return { temp, humid };
}

/**
 * Check if a position is near a biome boundary
 */
export function isNearBiomeBoundary(worldX: number, worldY: number, threshold: number = 150): boolean {
  const centerBiome = getBiomeAt(worldX, worldY);

  // Check cardinal directions
  const directions = [
    [threshold, 0],
    [-threshold, 0],
    [0, threshold],
    [0, -threshold],
  ];

  for (const [dx, dy] of directions) {
    if (getBiomeAt(worldX + dx, worldY + dy) !== centerBiome) {
      return true;
    }
  }

  return false;
}

/**
 * Get the distance to the nearest biome boundary (approximate)
 */
export function getDistanceToBoundary(worldX: number, worldY: number, maxSearch: number = 500): number {
  const centerBiome = getBiomeAt(worldX, worldY);
  const step = 50;

  for (let distance = step; distance <= maxSearch; distance += step) {
    const angles = 8;
    for (let i = 0; i < angles; i++) {
      const angle = (i / angles) * Math.PI * 2;
      const checkX = worldX + Math.cos(angle) * distance;
      const checkY = worldY + Math.sin(angle) * distance;

      if (getBiomeAt(checkX, checkY) !== centerBiome) {
        return distance;
      }
    }
  }

  return maxSearch;
}
