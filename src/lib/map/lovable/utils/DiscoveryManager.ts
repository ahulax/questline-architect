import type { MapNode } from '@/lib/map/lovable/types/map';
import { CHUNK_SIZE } from '@/lib/map/lovable/types/generation';

/**
 * Discovery Manager
 * Manages fog of war and area unlocking based on quest node discovery
 */

export class DiscoveryManager {
  private discoveredChunks: Set<string> = new Set();
  private chunkDiscoveryLevels: Map<string, number> = new Map();
  private discoveryRadius: number;

  constructor(discoveryRadius: number = 3) {
    this.discoveryRadius = discoveryRadius;
  }

  /**
   * Update discovered areas based on quest nodes
   * Call this whenever nodes change
   */
  updateFromNodes(nodes: MapNode[]): void {
    // Clear existing discovery data
    this.discoveredChunks.clear();
    this.chunkDiscoveryLevels.clear();

    // Process each discovered node
    for (const node of nodes) {
      if (node.isDiscovered) {
        this.discoverArea(node.x, node.y);
      }
    }
  }

  /**
   * Discover an area around a world position
   */
  discoverArea(worldX: number, worldY: number): void {
    const centerChunkX = Math.floor(worldX / CHUNK_SIZE);
    const centerChunkY = Math.floor(worldY / CHUNK_SIZE);

    // Discover chunks in radius
    for (let dy = -this.discoveryRadius; dy <= this.discoveryRadius; dy++) {
      for (let dx = -this.discoveryRadius; dx <= this.discoveryRadius; dx++) {
        const chunkX = centerChunkX + dx;
        const chunkY = centerChunkY + dy;
        const key = `${chunkX},${chunkY}`;

        // Calculate distance-based discovery level (1 = fully discovered, 0 = edge)
        const distance = Math.sqrt(dx * dx + dy * dy);
        const level = Math.max(0, 1 - distance / (this.discoveryRadius + 1));

        // Keep the highest discovery level for overlapping areas
        const existingLevel = this.chunkDiscoveryLevels.get(key) || 0;
        if (level > existingLevel) {
          this.chunkDiscoveryLevels.set(key, level);
        }

        // Mark as discovered if within radius
        if (distance <= this.discoveryRadius) {
          this.discoveredChunks.add(key);
        }
      }
    }
  }

  /**
   * Check if a chunk is fully discovered
   */
  isChunkDiscovered(chunkX: number, chunkY: number): boolean {
    return this.discoveredChunks.has(`${chunkX},${chunkY}`);
  }

  /**
   * Get the discovery level for a chunk (0-1)
   * 0 = completely hidden, 1 = fully discovered
   * Values in between = edge fog
   */
  getDiscoveryLevel(chunkX: number, chunkY: number): number {
    const key = `${chunkX},${chunkY}`;
    return this.chunkDiscoveryLevels.get(key) || 0;
  }

  /**
   * Check if a chunk has any visibility (including edge visibility)
   */
  hasAnyVisibility(chunkX: number, chunkY: number): boolean {
    return this.getDiscoveryLevel(chunkX, chunkY) > 0;
  }

  /**
   * Get fog opacity for a chunk (0 = no fog, 1 = full fog)
   */
  getFogOpacity(chunkX: number, chunkY: number): number {
    const level = this.getDiscoveryLevel(chunkX, chunkY);
    // No discovery = full fog (0.9 opacity for slight visibility)
    // Partial discovery = gradient fog
    // Full discovery = no fog
    if (level === 0) return 0.95;
    if (level >= 0.8) return 0;
    return (1 - level) * 0.8;
  }

  /**
   * Get all discovered chunk keys
   */
  getDiscoveredChunks(): string[] {
    return Array.from(this.discoveredChunks);
  }

  /**
   * Set the discovery radius
   */
  setDiscoveryRadius(radius: number): void {
    this.discoveryRadius = radius;
  }

  /**
   * Clear all discovery data
   */
  clear(): void {
    this.discoveredChunks.clear();
    this.chunkDiscoveryLevels.clear();
  }
}
