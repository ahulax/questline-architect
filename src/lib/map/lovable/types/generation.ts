import type { Graphics } from 'pixi.js';

// Biome types - the 6 procedural biomes
export type BiomeType = 'grassland' | 'forest' | 'desert' | 'snow' | 'swamp' | 'volcanic';

// Color palette for each biome
export interface BiomeColors {
  primary: number;
  secondary: number;
  accent: number;
  dark: number;
}

// Detail element types per biome
export type GrasslandDetail = 'grass_tuft' | 'flower' | 'small_rock' | 'bush';
export type ForestDetail = 'tree_pine' | 'tree_oak' | 'mushroom' | 'log';
export type DesertDetail = 'cactus' | 'skull' | 'sand_dune' | 'dead_bush';
export type SnowDetail = 'pine_snow' | 'ice_crystal' | 'snowdrift' | 'frozen_rock';
export type SwampDetail = 'cattail' | 'lily_pad' | 'dead_tree' | 'mud_bubble';
export type VolcanicDetail = 'lava_crack' | 'obsidian_spike' | 'ember' | 'ash_pile';

export type DetailType = GrasslandDetail | ForestDetail | DesertDetail | SnowDetail | SwampDetail | VolcanicDetail;

// Structure types per biome (6 per biome = 36 total)
export type GrasslandStructure = 'cottage' | 'windmill' | 'well' | 'barn' | 'chapel' | 'market_stall';
export type ForestStructure = 'treehouse' | 'ranger_cabin' | 'druid_circle' | 'hunting_lodge' | 'moonwell' | 'archer_tower';
export type DesertStructure = 'pyramid' | 'oasis_tent' | 'sand_castle' | 'buried_ruins' | 'sphinx' | 'merchant_caravan';
export type SnowStructure = 'igloo' | 'ice_tower' | 'frozen_shrine' | 'nordic_hall' | 'frost_giant_bones' | 'ski_lodge';
export type SwampStructure = 'witch_hut' | 'sunken_temple' | 'bog_bridge' | 'spirit_shrine' | 'fisherman_dock' | 'hermit_cave';
export type VolcanicStructure = 'forge' | 'lava_bridge' | 'demon_gate' | 'fire_temple' | 'obsidian_throne' | 'lava_waterfall';

export type StructureType = GrasslandStructure | ForestStructure | DesertStructure | SnowStructure | SwampStructure | VolcanicStructure;

// Structure variation for visual diversity
export interface StructureVariation {
  rotation: 0 | 90 | 180 | 270;
  colorShift: number;      // -0.1 to 0.1 HSL hue shift
  wearLevel: number;       // 0 = pristine, 1 = weathered
  hasDecoration: boolean;  // Add extra details
}

// Transition element types
export type TransitionElement = 'scattered_grass' | 'dirt_patch' | 'saplings' | 'fallen_leaves' |
  'sand_scatter' | 'rock_formation' | 'snow_patches' | 'ice_cracks' |
  'puddles' | 'moss_spread' | 'scorched_earth' | 'smoke_vent';

// Drawing function signature
export type DrawFunction = (g: Graphics, x: number, y: number, scale: number, seed: number) => void;
export type StructureDrawFunction = (g: Graphics, x: number, y: number, scale: number) => void;

// Biome definition
export interface BiomeDefinition {
  id: BiomeType;
  colors: BiomeColors;
  details: DetailType[];
  structures: StructureType[];
  transitionElements: TransitionElement[];
  detailDensity: number; // 0-1 scale for how many details per cell
  structureChance: number; // 0-1 probability multiplier
}

// Chunk coordinate
export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
}

// World coordinate
export interface WorldCoord {
  worldX: number;
  worldY: number;
}

// Placed detail instance
export interface PlacedDetail {
  type: DetailType;
  x: number;
  y: number;
  scale: number;
  seed: number;
}

// Placed structure instance
export interface PlacedStructure {
  type: StructureType;
  biome: BiomeType;
  x: number;
  y: number;
  scale: number;
}

// Biome transition info
export interface TransitionInfo {
  fromBiome: BiomeType;
  toBiome: BiomeType;
  blendFactor: number; // 0 = fully from, 1 = fully to
  direction: { x: number; y: number }; // Normal direction of transition edge
}

// Chunk generation constants
export const CHUNK_SIZE = 512;
export const CELL_SIZE = 16;
export const DETAIL_GRID_SIZE = 32;
