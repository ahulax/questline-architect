import { Container, Sprite, Texture, Assets, ColorMatrixFilter } from 'pixi.js';
import type { MapNode } from '@/lib/map/lovable/types/map';
import { POI_SPRITES } from '@/lib/map/lovable/types/map';

// POI sprite imports
const villageUrl = '/assets/map/poi/village.png';
const ruinsUrl = '/assets/map/poi/ruins.png';
const towerUrl = '/assets/map/poi/tower.png';
const stoneCircleUrl = '/assets/map/poi/stone_circle.png';

const POI_URLS: Record<string, string> = {
  village: villageUrl,
  ruins: ruinsUrl,
  tower: towerUrl,
  stone_circle: stoneCircleUrl,
};

const BASE_SCALE = 0.5;
const HOVER_SCALE = 0.6;
const UNDISCOVERED_ALPHA = 0.4;

interface NodeSprite {
  sprite: Sprite;
  node: MapNode;
  targetScale: number;
  currentScale: number;
  isHovered: boolean;
}

export class NodeRenderer {
  private container: Container;
  private textures: Map<string, Texture> = new Map();
  private nodeSprites: Map<string, NodeSprite> = new Map();
  private onNodeClick: ((nodeId: string) => void) | null = null;
  private texturesLoaded = false;
  private grayscaleFilter: ColorMatrixFilter;

  constructor(parentContainer: Container) {
    this.container = new Container();
    this.container.label = 'node-layer';
    parentContainer.addChild(this.container);

    // Filter for undiscovered nodes
    this.grayscaleFilter = new ColorMatrixFilter();
    this.grayscaleFilter.desaturate();
  }

  async loadTextures(): Promise<void> {
    if (this.texturesLoaded) return;

    const loadPromises = Object.entries(POI_URLS).map(async ([name, url]) => {
      try {
        const texture = await Assets.load(url);
        this.textures.set(name, texture);
      } catch (error) {
        console.warn(`Failed to load POI texture: ${name}`, error);
      }
    });

    await Promise.all(loadPromises);
    this.texturesLoaded = true;
  }

  setOnNodeClick(callback: (nodeId: string) => void): void {
    this.onNodeClick = callback;
  }

  setNodes(nodes: MapNode[]): void {
    // Remove old sprites
    for (const nodeSprite of this.nodeSprites.values()) {
      this.container.removeChild(nodeSprite.sprite);
      nodeSprite.sprite.destroy();
    }
    this.nodeSprites.clear();

    // Create new sprites
    for (const node of nodes) {
      this.createNodeSprite(node);
    }
  }

  private getTextureForType(type: MapNode['type']): Texture {
    const spriteName = POI_SPRITES[type];
    return this.textures.get(spriteName) ?? Texture.WHITE;
  }

  private createNodeSprite(node: MapNode): void {
    const texture = this.getTextureForType(node.type);
    const sprite = new Sprite(texture);

    sprite.anchor.set(0.5);
    sprite.x = node.x;
    sprite.y = node.y;
    sprite.scale.set(BASE_SCALE);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    // Visual state for undiscovered nodes
    if (!node.isDiscovered) {
      sprite.alpha = UNDISCOVERED_ALPHA;
      sprite.filters = [this.grayscaleFilter];
    }

    // Interaction handlers
    sprite.on('pointerenter', () => this.onPointerEnter(node.id));
    sprite.on('pointerleave', () => this.onPointerLeave(node.id));
    sprite.on('pointertap', () => this.onPointerTap(node.id));

    this.container.addChild(sprite);

    this.nodeSprites.set(node.id, {
      sprite,
      node,
      targetScale: BASE_SCALE,
      currentScale: BASE_SCALE,
      isHovered: false,
    });
  }

  private onPointerEnter(nodeId: string): void {
    const nodeSprite = this.nodeSprites.get(nodeId);
    if (nodeSprite) {
      nodeSprite.isHovered = true;
      nodeSprite.targetScale = HOVER_SCALE;
    }
  }

  private onPointerLeave(nodeId: string): void {
    const nodeSprite = this.nodeSprites.get(nodeId);
    if (nodeSprite) {
      nodeSprite.isHovered = false;
      nodeSprite.targetScale = BASE_SCALE;
    }
  }

  private onPointerTap(nodeId: string): void {
    if (this.onNodeClick) {
      this.onNodeClick(nodeId);
    }
  }

  update(deltaTime: number, zoom: number): void {
    const lerpFactor = 1 - Math.pow(0.001, deltaTime);

    for (const nodeSprite of this.nodeSprites.values()) {
      // Smooth scale animation
      nodeSprite.currentScale += (nodeSprite.targetScale - nodeSprite.currentScale) * lerpFactor;

      // Adjust scale based on zoom to keep nodes readable
      const zoomAdjustedScale = nodeSprite.currentScale / Math.sqrt(zoom);
      nodeSprite.sprite.scale.set(zoomAdjustedScale);
    }
  }

  updateNodeDiscovery(nodeId: string, isDiscovered: boolean): void {
    const nodeSprite = this.nodeSprites.get(nodeId);
    if (nodeSprite) {
      nodeSprite.node.isDiscovered = isDiscovered;

      if (isDiscovered) {
        nodeSprite.sprite.alpha = 1;
        nodeSprite.sprite.filters = [];
      } else {
        nodeSprite.sprite.alpha = UNDISCOVERED_ALPHA;
        nodeSprite.sprite.filters = [this.grayscaleFilter];
      }
    }
  }

  destroy(): void {
    for (const nodeSprite of this.nodeSprites.values()) {
      nodeSprite.sprite.destroy();
    }
    this.nodeSprites.clear();
    this.container.destroy({ children: true });
  }
}
