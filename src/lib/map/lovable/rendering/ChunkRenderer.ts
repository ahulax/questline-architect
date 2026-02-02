import { Container, Graphics } from 'pixi.js';
import { CHUNK_SIZE } from '@/lib/map/lovable/types/generation';
import { generateTerrain } from '@/lib/map/lovable/generation/TerrainGenerator';
import { generateDetails } from '@/lib/map/lovable/generation/DetailGenerator';
import { generateStructures } from '@/lib/map/lovable/generation/StructureGenerator';
import { generateTransitions } from '@/lib/map/lovable/generation/TransitionGenerator';

/**
 * Chunk Renderer
 * Renders complete chunks with all layers (terrain, details, transitions, structures)
 * Caches rendered chunks for performance
 */

export class ChunkRenderer {
  private chunkCache: Map<string, Container> = new Map();
  private maxCacheSize: number;
  private accessOrder: string[] = [];
  private protectedChunks: Set<string> = new Set();

  constructor(maxCacheSize: number = 300) {
    this.maxCacheSize = maxCacheSize;
  }

  /**
   * Set chunks that should be protected from eviction
   */
  setProtectedChunks(chunkKeys: string[]): void {
    this.protectedChunks = new Set(chunkKeys);
  }

  /**
   * Dynamically set max cache size
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = size;
  }

  /**
   * Get or create a chunk container
   */
  getOrCreateChunk(chunkX: number, chunkY: number): Container {
    const key = `${chunkX},${chunkY}`;

    // Check cache
    const cached = this.chunkCache.get(key);
    if (cached && !cached.destroyed) {
      // Move to end of access order (LRU)
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
      return cached;
    }

    // Remove from cache if destroyed
    if (cached) {
      this.chunkCache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
    }

    // Create new chunk
    const chunk = this.createChunk(chunkX, chunkY);

    // Add to cache
    this.chunkCache.set(key, chunk);
    this.accessOrder.push(key);

    // Evict old chunks if over limit
    this.evictOldChunks();

    return chunk;
  }

  /**
   * Create a new chunk with all layers
   */
  private createChunk(chunkX: number, chunkY: number): Container {
    const chunk = new Container();
    chunk.label = `chunk_${chunkX}_${chunkY}`;

    // Layer 1: Terrain (base ground colors)
    const terrain = generateTerrain(chunkX, chunkY);
    terrain.label = 'terrain';
    chunk.addChild(terrain);

    // Layer 2: Transitions (biome edge blending)
    const transitions = generateTransitions(chunkX, chunkY);
    if (transitions) {
      transitions.label = 'transitions';
      chunk.addChild(transitions);
    }

    // Layer 3: Details (vegetation, rocks, etc.)
    const details = generateDetails(chunkX, chunkY);
    details.label = 'details';
    chunk.addChild(details);

    // Layer 4: Structures (buildings, monuments)
    const structures = generateStructures(chunkX, chunkY);
    if (structures) {
      structures.label = 'structures';
      chunk.addChild(structures);
    }

    // Position chunk in world space
    chunk.x = chunkX * CHUNK_SIZE;
    chunk.y = chunkY * CHUNK_SIZE;

    return chunk;
  }

  /**
   * Evict oldest chunks when cache exceeds limit
   * Never evicts chunks in the protected set
   */
  private evictOldChunks(): void {
    let safetyCounter = 0;
    const maxIterations = this.accessOrder.length + 10;

    while (this.chunkCache.size > this.maxCacheSize && this.accessOrder.length > 0 && safetyCounter < maxIterations) {
      safetyCounter++;
      const oldestKey = this.accessOrder[0];

      // NEVER evict protected (visible) chunks
      if (this.protectedChunks.has(oldestKey)) {
        // Move to end instead of evicting
        this.accessOrder.shift();
        this.accessOrder.push(oldestKey);
        continue;
      }

      // Safe to evict
      this.accessOrder.shift();
      const chunk = this.chunkCache.get(oldestKey);

      if (chunk) {
        // Remove from parent if attached
        if (chunk.parent) {
          chunk.parent.removeChild(chunk);
        }
        // Destroy graphics to free memory
        chunk.destroy({ children: true });
        this.chunkCache.delete(oldestKey);
      }
    }
  }

  /**
   * Check if a chunk is cached
   */
  hasChunk(chunkX: number, chunkY: number): boolean {
    const key = `${chunkX},${chunkY}`;
    const chunk = this.chunkCache.get(key);
    // Check if chunk exists AND hasn't been destroyed
    return chunk !== undefined && !chunk.destroyed;
  }

  /**
   * Remove a specific chunk from cache
   */
  removeChunk(chunkX: number, chunkY: number): void {
    const key = `${chunkX},${chunkY}`;
    const chunk = this.chunkCache.get(key);

    if (chunk) {
      if (chunk.parent) {
        chunk.parent.removeChild(chunk);
      }
      chunk.destroy({ children: true });
      this.chunkCache.delete(key);

      const index = this.accessOrder.indexOf(key);
      if (index !== -1) {
        this.accessOrder.splice(index, 1);
      }
    }
  }

  /**
   * Clear all cached chunks
   */
  clearCache(): void {
    for (const [key, chunk] of this.chunkCache) {
      if (chunk.parent) {
        chunk.parent.removeChild(chunk);
      }
      chunk.destroy({ children: true });
    }
    this.chunkCache.clear();
    this.accessOrder = [];
  }

  /**
   * Get visible chunk coordinates for a viewport
   */
  getVisibleChunks(
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    zoom: number = 1,
    padding: number = 1
  ): Array<{ chunkX: number; chunkY: number }> {
    const scaledWidth = viewportWidth / zoom;
    const scaledHeight = viewportHeight / zoom;

    const minChunkX = Math.floor(cameraX / CHUNK_SIZE) - padding;
    const maxChunkX = Math.ceil((cameraX + scaledWidth) / CHUNK_SIZE) + padding;
    const minChunkY = Math.floor(cameraY / CHUNK_SIZE) - padding;
    const maxChunkY = Math.ceil((cameraY + scaledHeight) / CHUNK_SIZE) + padding;

    const chunks: Array<{ chunkX: number; chunkY: number }> = [];

    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        chunks.push({ chunkX: cx, chunkY: cy });
      }
    }

    return chunks;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.chunkCache.size,
      maxSize: this.maxCacheSize,
    };
  }
}
