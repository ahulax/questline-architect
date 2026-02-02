import { Container, Graphics } from 'pixi.js';
import type { MapNode, QuestPath } from '@/lib/map/lovable/types/map';
import { getBiomeAt } from '@/lib/map/lovable/generation/BiomeGenerator';
import { getBiomeDefinition } from '@/lib/map/lovable/data/BiomeDatabase';
import { ChunkRenderer } from './ChunkRenderer';
import { CHUNK_SIZE } from '@/lib/map/lovable/types/generation';
import { DiscoveryManager } from '@/lib/map/lovable/utils/DiscoveryManager';

/**
 * Layer Manager
 * Manages the 5-layer render stack for the procedural map
 * 
 * Layer order (bottom to top):
 * 1. Terrain chunks (managed by ChunkRenderer)
 * 2. Fog of war overlay
 * 3. Quest paths
 * 4. Quest nodes/POIs
 * 5. UI overlays
 */

export class LayerManager {
  // Main containers
  private worldContainer: Container;
  private terrainLayer: Container;
  private fogLayer: Container;
  private pathLayer: Container;
  private nodeLayer: Container;
  private uiLayer: Container;

  // Renderers
  private chunkRenderer: ChunkRenderer;

  // Discovery manager for fog of war
  private discoveryManager: DiscoveryManager;

  // Active chunks tracking - store references to avoid re-fetching
  private activeChunkRefs: Map<string, Container> = new Map();

  // Fog graphics cache
  private fogGraphics: Map<string, Graphics> = new Map();

  constructor() {
    // Create main world container
    this.worldContainer = new Container();
    this.worldContainer.label = 'world';

    // Create layer containers
    this.terrainLayer = new Container();
    this.terrainLayer.label = 'terrain_layer';

    this.fogLayer = new Container();
    this.fogLayer.label = 'fog_layer';

    this.pathLayer = new Container();
    this.pathLayer.label = 'path_layer';

    this.nodeLayer = new Container();
    this.nodeLayer.label = 'node_layer';

    this.uiLayer = new Container();
    this.uiLayer.label = 'ui_layer';

    // Add layers in order (bottom to top)
    this.worldContainer.addChild(this.terrainLayer);
    this.worldContainer.addChild(this.fogLayer);
    this.worldContainer.addChild(this.pathLayer);
    this.worldContainer.addChild(this.nodeLayer);
    this.worldContainer.addChild(this.uiLayer);

    // Initialize chunk renderer with large cache for zoom support
    this.chunkRenderer = new ChunkRenderer(300);

    // Initialize discovery manager
    this.discoveryManager = new DiscoveryManager(3);
  }

  /**
   * Get the main world container
   */
  getWorldContainer(): Container {
    return this.worldContainer;
  }

  /**
   * Check if destroyed
   */
  get destroyed(): boolean {
    return this.worldContainer.destroyed;
  }

  /**
   * Get the discovery manager
   */
  getDiscoveryManager(): DiscoveryManager {
    return this.discoveryManager;
  }

  /**
   * Update discovery based on nodes
   */
  updateDiscovery(nodes: MapNode[]): void {
    this.discoveryManager.updateFromNodes(nodes);
  }

  /**
   * Update visible terrain chunks based on camera position
   */
  updateTerrain(
    cameraX: number,
    cameraY: number,
    viewportWidth: number,
    viewportHeight: number,
    zoom: number
  ): void {
    // Get visible chunk coordinates
    const visibleChunks = this.chunkRenderer.getVisibleChunks(
      cameraX,
      cameraY,
      viewportWidth,
      viewportHeight,
      zoom
    );

    // Dynamic cache sizing based on visible chunks
    const requiredChunks = visibleChunks.length;
    const safeCache = Math.max(300, requiredChunks + 50);
    if (this.chunkRenderer.getCacheStats().maxSize < safeCache) {
      this.chunkRenderer.setMaxCacheSize(safeCache);
    }

    // PROTECT all visible chunks BEFORE creating any new ones
    const visibleKeys = visibleChunks.map(c => `${c.chunkX},${c.chunkY}`);
    this.chunkRenderer.setProtectedChunks(visibleKeys);

    // Track which chunks should be visible
    const newActiveChunkRefs = new Map<string, Container>();

    // Add/update visible chunks
    for (const { chunkX, chunkY } of visibleChunks) {
      const key = `${chunkX},${chunkY}`;

      // Always get from renderer (updates LRU tracking)
      const chunk = this.chunkRenderer.getOrCreateChunk(chunkX, chunkY);

      // Ensure chunk is in the scene
      if (!chunk.parent || chunk.parent !== this.terrainLayer) {
        this.terrainLayer.addChild(chunk);
      }

      newActiveChunkRefs.set(key, chunk);

      // Update fog overlay if this is a newly visible chunk
      if (!this.activeChunkRefs.has(key)) {
        this.updateChunkFog(chunkX, chunkY);
      }
    }

    // Remove chunks that are no longer visible (use stored refs, don't re-fetch)
    for (const [key, chunk] of this.activeChunkRefs) {
      if (!newActiveChunkRefs.has(key)) {
        // Remove from scene using stored reference
        if (chunk && !chunk.destroyed && chunk.parent === this.terrainLayer) {
          this.terrainLayer.removeChild(chunk);
        }

        // Remove fog overlay
        const fog = this.fogGraphics.get(key);
        if (fog) {
          if (fog.parent) fog.parent.removeChild(fog);
          fog.destroy();
          this.fogGraphics.delete(key);
        }
      }
    }

    this.activeChunkRefs = newActiveChunkRefs;
  }

  /**
   * Update fog overlay for a specific chunk
   */
  private updateChunkFog(chunkX: number, chunkY: number): void {
    const key = `${chunkX},${chunkY}`;
    const opacity = this.discoveryManager.getFogOpacity(chunkX, chunkY);

    // Remove existing fog if any
    const existingFog = this.fogGraphics.get(key);
    if (existingFog) {
      if (existingFog.parent) existingFog.parent.removeChild(existingFog);
      existingFog.destroy();
      this.fogGraphics.delete(key);
    }

    // Only create fog if opacity > 0
    if (opacity > 0) {
      const fog = new Graphics();
      fog.label = `fog_${chunkX}_${chunkY}`;

      // Draw fog rectangle
      fog.rect(0, 0, CHUNK_SIZE, CHUNK_SIZE)
        .fill({ color: 0x0a0a12, alpha: opacity });

      // Add subtle noise/texture effect for partial fog
      if (opacity < 0.9 && opacity > 0) {
        // Add some scattered dark spots for texture
        const level = this.discoveryManager.getDiscoveryLevel(chunkX, chunkY);
        const spotCount = Math.floor((1 - level) * 20);
        for (let i = 0; i < spotCount; i++) {
          const spotX = (Math.sin(i * 7.3 + chunkX) * 0.5 + 0.5) * CHUNK_SIZE;
          const spotY = (Math.cos(i * 11.7 + chunkY) * 0.5 + 0.5) * CHUNK_SIZE;
          const spotSize = 20 + Math.sin(i * 3.1) * 15;
          fog.circle(spotX, spotY, spotSize)
            .fill({ color: 0x0a0a12, alpha: 0.3 });
        }
      }

      // Position fog at chunk location
      fog.x = chunkX * CHUNK_SIZE;
      fog.y = chunkY * CHUNK_SIZE;

      this.fogLayer.addChild(fog);
      this.fogGraphics.set(key, fog);
    }
  }

  /**
   * Refresh all fog overlays (call after discovery changes)
   */
  refreshFog(): void {
    for (const key of this.activeChunkRefs.keys()) {
      const [cx, cy] = key.split(',').map(Number);
      this.updateChunkFog(cx, cy);
    }
  }

  /**
   * Render quest paths
   */
  renderPaths(paths: QuestPath[], nodes: MapNode[]): void {
    // Clear existing paths
    this.pathLayer.removeChildren();

    const pathGraphics = new Graphics();

    for (const path of paths) {
      const fromNode = nodes.find(n => n.id === path.fromNodeId);
      const toNode = nodes.find(n => n.id === path.toNodeId);

      if (!fromNode || !toNode) continue;

      // Path styling based on status
      let color = 0x888888;
      let alpha = 0.5;
      let width = 3;
      let dashPattern: number[] | null = null;

      switch (path.status) {
        case 'completed':
          color = 0xffd700;
          alpha = 0.9;
          width = 4;
          break;
        case 'active':
          color = 0xffdd44;
          alpha = 0.8;
          width = 4;
          break;
        case 'locked':
          color = 0x666666;
          alpha = 0.4;
          width = 2;
          dashPattern = [8, 8];
          break;
      }

      // Draw bezier curve between nodes
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const controlOffset = 50;

      // Calculate perpendicular offset for curve
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const len = Math.hypot(dx, dy);
      const perpX = -dy / len * controlOffset;
      const perpY = dx / len * controlOffset;

      pathGraphics.beginPath();
      pathGraphics.moveTo(fromNode.x, fromNode.y);
      pathGraphics.quadraticCurveTo(midX + perpX, midY + perpY, toNode.x, toNode.y);

      if (dashPattern) {
        // Dashed line for locked paths
        pathGraphics.stroke({ color, width, alpha });
      } else {
        pathGraphics.stroke({ color, width, alpha });

        // Glow effect for active/completed
        if (path.status === 'active' || path.status === 'completed') {
          pathGraphics.beginPath();
          pathGraphics.moveTo(fromNode.x, fromNode.y);
          pathGraphics.quadraticCurveTo(midX + perpX, midY + perpY, toNode.x, toNode.y);
          pathGraphics.stroke({ color, width: width + 4, alpha: 0.2 });
        }
      }
    }

    this.pathLayer.addChild(pathGraphics);
  }

  /**
   * Render quest nodes/POIs
   */
  renderNodes(nodes: MapNode[], onNodeClick: (nodeId: string) => void, onNodeHover?: (nodeId: string | null) => void): void {
    // Clear existing nodes
    this.nodeLayer.removeChildren();

    for (const node of nodes) {
      const nodeContainer = new Container();
      nodeContainer.x = node.x;
      nodeContainer.y = node.y;
      nodeContainer.label = `node_${node.id}`;

      const graphics = new Graphics();

      // Get biome colors at node position
      const biome = getBiomeAt(node.x, node.y);
      const biomeDef = getBiomeDefinition(biome);

      // Node styling based on type and importance
      // L = 30, M = 20, S = 15
      let baseSize = 20;
      if (node.type === 'fortress') baseSize = 30; // Large for L quests
      if (node.type === 'ruins' || node.type === 'stone_circle') baseSize = 15; // Small for S quests
      const discovered = node.isDiscovered;

      // Base circle and Color Selection
      let baseColor = 0x444444;
      let strokeColor = 0x666666;
      let strokeWidth = 2;

      if (discovered) {
        if (node.status === 'done') {
          // Completed: Gold/Bright - Structure Built
          baseColor = this.getNodeColor(node.type);
          strokeColor = 0xffd700; // Gold border
        } else {
          // In Progress/Todo: Blueprint/Foundation - Greyish
          baseColor = 0x555566;
          strokeColor = 0x8888aa;
        }
      }

      // Outer glow for completed
      if (discovered && node.status === 'done') {
        graphics.circle(0, 0, baseSize + 8).fill({ color: 0xffd700, alpha: 0.2 });
      }

      graphics.circle(0, 0, baseSize).fill(baseColor);

      // Inner detail based on type
      if (discovered) {
        // Pass status to icon drawer to control icon brightness/style if needed
        this.drawNodeIcon(graphics, node.type, baseSize * 0.6, node.status === 'done');
      } else {
        // Question mark for undiscovered
        graphics.circle(0, -4, 4).fill(0x888888);
        graphics.rect(-2, 2, 4, 6).fill(0x888888);
      }

      // Border
      graphics.circle(0, 0, baseSize).stroke({
        color: strokeColor,
        width: strokeWidth
      });

      nodeContainer.addChild(graphics);

      // Make interactive
      nodeContainer.eventMode = 'static';
      nodeContainer.cursor = 'pointer';
      nodeContainer.on('pointerdown', () => onNodeClick(node.id));

      // Hover effect
      nodeContainer.on('pointerover', () => {
        nodeContainer.scale.set(1.1);
        onNodeHover?.(node.id);
      });
      nodeContainer.on('pointerout', () => {
        nodeContainer.scale.set(1);
        onNodeHover?.(null);
      });

      this.nodeLayer.addChild(nodeContainer);
    }
  }

  /**
   * Get color for node type
   */
  private getNodeColor(type: MapNode['type']): number {
    switch (type) {
      case 'town': return 0x4a90d9;
      case 'ruins': return 0x9b7653;
      case 'fortress': return 0x8b0000;
      case 'portal': return 0x9932cc;
      default: return 0x888888;
    }
  }

  /**
   * Draw icon for node type
   */
  private drawNodeIcon(graphics: Graphics, type: MapNode['type'], size: number, isCompleted: boolean = false): void {
    const iconColor = isCompleted ? 0xffffff : 0xaaaaaa; // Bright white for completed, grey for foundation

      case 'town':
    // House icon
    graphics.poly([0, -size, -size * 0.7, 0, size * 0.7, 0]).fill(iconColor);
    graphics.rect(-size * 0.4, 0, size * 0.8, size * 0.6).fill(iconColor);
    break;

      case 'ruins':
    // Broken pillars (Small camp)
    graphics.rect(-size * 0.5, -size * 0.3, size * 0.3, size * 0.8).fill(iconColor);
    graphics.rect(size * 0.2, -size * 0.5, size * 0.3, size).fill(iconColor);
    break;

      case 'fortress':
    // Tower with crenellations (Grand Castle/Dungeon)
    graphics.rect(-size * 0.6, -size * 0.4, size * 1.2, size * 1.0).fill(iconColor); // Main keep
    graphics.rect(-size * 0.8, -size * 0.4, size * 0.4, size * 1.2).fill(iconColor); // Left tower
    graphics.rect(size * 0.4, -size * 0.4, size * 0.4, size * 1.2).fill(iconColor); // Right tower
    // Roofs
    graphics.poly([-size * 0.8, -size * 0.6, -size * 0.6, -size * 0.4, -size * 0.4, -size * 0.6]).fill(iconColor);
    graphics.poly([size * 0.4, -size * 0.6, size * 0.6, -size * 0.4, size * 0.8, -size * 0.6]).fill(iconColor);
    break;

      case 'stone_circle': // Using as 'Camp' or generic small point
      case 'portal':
    // Swirl / Camp fire
    graphics.circle(0, 0, size * 0.5).stroke({ color: iconColor, width: 2 });
    graphics.poly([-size * 0.3, size * 0.3, 0, -size * 0.4, size * 0.3, size * 0.3]).fill(iconColor);
    break;
  }
}

/**
 * Clear all layers
 */
clear(): void {
  this.terrainLayer.removeChildren();
  this.fogLayer.removeChildren();
  this.pathLayer.removeChildren();
  this.nodeLayer.removeChildren();
  this.uiLayer.removeChildren();
  this.activeChunkRefs.clear();
  this.chunkRenderer.clearCache();

  // Clear fog graphics
  for(const fog of this.fogGraphics.values()) {
  fog.destroy();
}
this.fogGraphics.clear();
  }

/**
 * Destroy and cleanup
 */
destroy(): void {
  this.clear();
  this.chunkRenderer.clearCache();
  this.worldContainer.destroy({ children: true });
}
}
