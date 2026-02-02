import type { BiomeDefinition, BiomeType } from '@/lib/map/lovable/types/generation';

/**
 * Complete Biome Database
 * Defines all 6 biomes with colors, details, structures, and generation parameters
 */

export const BIOME_DATABASE: Record<BiomeType, BiomeDefinition> = {
  grassland: {
    id: 'grassland',
    colors: {
      primary: 0x4a7c3b,   // Main grass green
      secondary: 0x5d9c4a, // Lighter grass
      accent: 0x8bc34a,    // Bright highlights
      dark: 0x3a5c2b,      // Shadows
    },
    details: ['grass_tuft', 'flower', 'small_rock', 'bush'],
    structures: ['cottage', 'windmill', 'well', 'barn', 'chapel', 'market_stall'],
    transitionElements: ['scattered_grass', 'dirt_patch'],
    detailDensity: 0.7,
    structureChance: 0.08,
  },

  forest: {
    id: 'forest',
    colors: {
      primary: 0x2d5a27,   // Deep forest green
      secondary: 0x1a4314, // Dark undergrowth
      accent: 0x4a7c3b,    // Lighter patches
      dark: 0x0f2a0c,      // Deep shadows
    },
    details: ['tree_pine', 'tree_oak', 'mushroom', 'log'],
    structures: ['treehouse', 'ranger_cabin', 'druid_circle', 'hunting_lodge', 'moonwell', 'archer_tower'],
    transitionElements: ['saplings', 'fallen_leaves'],
    detailDensity: 0.9,
    structureChance: 0.06,
  },

  desert: {
    id: 'desert',
    colors: {
      primary: 0xd4a853,   // Sand
      secondary: 0xc9923a, // Darker sand
      accent: 0xe8c97d,    // Light sand
      dark: 0xa67c3d,      // Shadows
    },
    details: ['cactus', 'skull', 'sand_dune', 'dead_bush'],
    structures: ['pyramid', 'oasis_tent', 'sand_castle', 'buried_ruins', 'sphinx', 'merchant_caravan'],
    transitionElements: ['sand_scatter', 'rock_formation'],
    detailDensity: 0.3,
    structureChance: 0.05,
  },

  snow: {
    id: 'snow',
    colors: {
      primary: 0xe8f4f8,   // Snow white
      secondary: 0xc5dce4, // Ice blue
      accent: 0xffffff,    // Pure white
      dark: 0x9bb5c4,      // Shadows
    },
    details: ['pine_snow', 'ice_crystal', 'snowdrift', 'frozen_rock'],
    structures: ['igloo', 'ice_tower', 'frozen_shrine', 'nordic_hall', 'frost_giant_bones', 'ski_lodge'],
    transitionElements: ['snow_patches', 'ice_cracks'],
    detailDensity: 0.5,
    structureChance: 0.07,
  },

  swamp: {
    id: 'swamp',
    colors: {
      primary: 0x3d4a2c,   // Murky green
      secondary: 0x5a6b42, // Moss green
      accent: 0x7a8f5e,    // Lighter areas
      dark: 0x2a3320,      // Deep mud
    },
    details: ['cattail', 'lily_pad', 'dead_tree', 'mud_bubble'],
    structures: ['witch_hut', 'sunken_temple', 'bog_bridge', 'spirit_shrine', 'fisherman_dock', 'hermit_cave'],
    transitionElements: ['puddles', 'moss_spread'],
    detailDensity: 0.6,
    structureChance: 0.06,
  },

  volcanic: {
    id: 'volcanic',
    colors: {
      primary: 0x2a1a1a,   // Dark ash
      secondary: 0x4a2a2a, // Dark red-brown
      accent: 0xff4500,    // Lava glow
      dark: 0x1a0f0f,      // Deep shadows
    },
    details: ['lava_crack', 'obsidian_spike', 'ember', 'ash_pile'],
    structures: ['forge', 'lava_bridge', 'demon_gate', 'fire_temple', 'obsidian_throne', 'lava_waterfall'],
    transitionElements: ['scorched_earth', 'smoke_vent'],
    detailDensity: 0.4,
    structureChance: 0.05,
  },
};

/**
 * Get biome definition by type
 */
export function getBiomeDefinition(biome: BiomeType): BiomeDefinition {
  return BIOME_DATABASE[biome];
}

/**
 * Get all biome types
 */
export function getAllBiomeTypes(): BiomeType[] {
  return Object.keys(BIOME_DATABASE) as BiomeType[];
}

/**
 * Biome compatibility for transitions (which biomes can border each other smoothly)
 * Higher values = more compatible
 */
export const BIOME_COMPATIBILITY: Record<BiomeType, Record<BiomeType, number>> = {
  grassland: { grassland: 1, forest: 0.9, desert: 0.5, snow: 0.4, swamp: 0.6, volcanic: 0.2 },
  forest: { grassland: 0.9, forest: 1, desert: 0.3, snow: 0.6, swamp: 0.7, volcanic: 0.2 },
  desert: { grassland: 0.5, forest: 0.3, desert: 1, snow: 0.1, swamp: 0.2, volcanic: 0.6 },
  snow: { grassland: 0.4, forest: 0.6, desert: 0.1, snow: 1, swamp: 0.3, volcanic: 0.1 },
  swamp: { grassland: 0.6, forest: 0.7, desert: 0.2, snow: 0.3, swamp: 1, volcanic: 0.3 },
  volcanic: { grassland: 0.2, forest: 0.2, desert: 0.6, snow: 0.1, swamp: 0.3, volcanic: 1 },
};
