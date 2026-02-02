// Map Node Types
export type NodeType = 'town' | 'ruins' | 'fortress' | 'portal' | 'stone_circle';
import type { BiomeType } from './generation';
export { BiomeType };

export type MapNode = {
  id: string;
  x: number;
  y: number;
  type: NodeType;
  biome: BiomeType;
  isDiscovered: boolean;
};

// Quest Path Types
export type QuestPath = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  status: 'active' | 'completed' | 'locked';
};

// Component Props
export interface SeasonMapProps {
  nodes: MapNode[];
  paths: QuestPath[];
  currentSeasonId: string;
  onNodeClick: (nodeId: string) => void;
}

// Internal types for chunk management
export interface ChunkCoord {
  chunkX: number;
  chunkY: number;
}

export interface ChunkData {
  key: string;
  coord: ChunkCoord;
  biome: MapNode['biome'];
  blendBiomes: Array<{ biome: MapNode['biome']; strength: number }>;
}

// Biome texture mapping
export const BIOME_TEXTURES: Record<MapNode['biome'], string> = {
  grassland: 'grassland',
  forest: 'forest',
  snow: 'ice',
  desert: 'desert',
  swamp: 'swamp',
  volcanic: 'volcanic',
};

// POI type to sprite mapping
export const POI_SPRITES: Record<MapNode['type'], string> = {
  town: 'village',
  ruins: 'ruins',
  fortress: 'tower',
  portal: 'stone_circle',
  stone_circle: 'stone_circle',
};
