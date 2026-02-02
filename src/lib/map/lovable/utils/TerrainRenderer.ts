import { Container, TilingSprite, Texture, Assets } from 'pixi.js';
import { BiomeAlphaFilter, BiomeType } from '@/lib/map/lovable/shaders/BiomeAlphaFilter';
import { generateNoiseCanvas } from './PerlinNoise';

// Biome texture imports
const grasslandUrl = '/assets/map/biomes/grassland.webp';
const iceUrl = '/assets/map/biomes/ice.png';
const forestUrl = '/assets/map/biomes/forest.webp';
const desertUrl = '/assets/map/biomes/desert.webp';
const swampUrl = '/assets/map/biomes/swamp.webp';
const volcanicUrl = '/assets/map/biomes/volcanic.webp';

const BIOME_URLS: Record<string, string> = {
  grassland: grasslandUrl,
  forest: forestUrl,
  ice: iceUrl,
  desert: desertUrl,
  swamp: swampUrl,
  volcanic: volcanicUrl,
};

// Overlay biomes (everything except grassland base)
const OVERLAY_BIOMES: BiomeType[] = ['ice', 'desert', 'swamp', 'volcanic'];

interface BiomeOverlay {
  sprite: TilingSprite;
  filter: BiomeAlphaFilter;
}

export class TerrainRenderer {
  private container: Container;
  private baseLayer: TilingSprite | null = null;
  private overlayLayers: Map<BiomeType, BiomeOverlay> = new Map();
  private textures: Map<string, Texture> = new Map();
  private temperatureNoiseTexture: Texture | null = null;
  private humidityNoiseTexture: Texture | null = null;
  private viewportWidth: number;
  private viewportHeight: number;
  private isLoaded = false;

  constructor(parentContainer: Container, viewportWidth: number, viewportHeight: number) {
    this.container = new Container();
    this.container.label = 'terrain-layer';
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Insert at bottom of render order
    parentContainer.addChildAt(this.container, 0);
  }

  async loadTextures(): Promise<void> {
    if (this.isLoaded) return;

    // Load all biome textures in parallel
    const loadPromises = Object.entries(BIOME_URLS).map(async ([name, url]) => {
      try {
        const texture = await Assets.load(url);
        this.textures.set(name, texture);
      } catch (error) {
        console.warn(`Failed to load biome texture: ${name}`, error);
      }
    });

    await Promise.all(loadPromises);

    // Generate noise textures for temperature and humidity
    const tempCanvas = generateNoiseCanvas(512, 512, 0.015, 12345);
    const humidCanvas = generateNoiseCanvas(512, 512, 0.015, 67890);

    this.temperatureNoiseTexture = Texture.from(tempCanvas);
    this.humidityNoiseTexture = Texture.from(humidCanvas);

    // Create the layer stack
    this.createLayers();

    this.isLoaded = true;
  }

  private createLayers(): void {
    const grasslandTexture = this.textures.get('grassland');
    if (!grasslandTexture || !this.temperatureNoiseTexture || !this.humidityNoiseTexture) {
      console.error('Required textures not loaded');
      return;
    }

    // Layer 1: Base grassland - infinite tiling, no filter
    // Use large size to cover viewport plus buffer for scrolling
    const layerSize = Math.max(this.viewportWidth, this.viewportHeight) * 3;

    this.baseLayer = new TilingSprite({
      texture: grasslandTexture,
      width: layerSize,
      height: layerSize,
    });
    this.baseLayer.label = 'base-grassland';
    // Center the base layer so tilePosition offsets work correctly
    this.baseLayer.x = -layerSize / 2 + this.viewportWidth / 2;
    this.baseLayer.y = -layerSize / 2 + this.viewportHeight / 2;
    this.container.addChild(this.baseLayer);

    // Layer 2: Biome overlays with alpha filters
    for (const biomeType of OVERLAY_BIOMES) {
      const texture = this.textures.get(biomeType);
      if (!texture) continue;

      const sprite = new TilingSprite({
        texture,
        width: layerSize,
        height: layerSize,
      });
      sprite.label = `overlay-${biomeType}`;
      sprite.x = -layerSize / 2 + this.viewportWidth / 2;
      sprite.y = -layerSize / 2 + this.viewportHeight / 2;

      // Create filter for this biome
      const filter = new BiomeAlphaFilter({
        temperatureNoise: this.temperatureNoiseTexture,
        humidityNoise: this.humidityNoiseTexture,
        biomeType,
        viewportSize: { width: layerSize, height: layerSize },
        edgeSoftness: 0.08,
      });

      sprite.filters = [filter];
      this.container.addChild(sprite);

      this.overlayLayers.set(biomeType, { sprite, filter });
    }
  }

  /**
   * Update terrain based on camera position for infinite scrolling effect
   */
  update(cameraX: number, cameraY: number, zoom: number): void {
    if (!this.isLoaded || !this.baseLayer) return;

    // Update base layer tile position for infinite scrolling
    this.baseLayer.tilePosition.set(-cameraX, -cameraY);

    // Update all overlay layers
    for (const [_, overlay] of this.overlayLayers) {
      overlay.sprite.tilePosition.set(-cameraX, -cameraY);

      // Update filter's world offset for correct noise sampling
      overlay.filter.worldOffset = { x: cameraX, y: cameraY };
    }
  }

  /**
   * Handle viewport resize
   */
  resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;

    if (!this.isLoaded) return;

    const layerSize = Math.max(width, height) * 3;

    // Resize base layer
    if (this.baseLayer) {
      this.baseLayer.width = layerSize;
      this.baseLayer.height = layerSize;
      this.baseLayer.x = -layerSize / 2 + width / 2;
      this.baseLayer.y = -layerSize / 2 + height / 2;
    }

    // Resize overlay layers
    for (const [_, overlay] of this.overlayLayers) {
      overlay.sprite.width = layerSize;
      overlay.sprite.height = layerSize;
      overlay.sprite.x = -layerSize / 2 + width / 2;
      overlay.sprite.y = -layerSize / 2 + height / 2;
      overlay.filter.viewportSize = { width: layerSize, height: layerSize };
    }
  }

  destroy(): void {
    // Destroy all sprites and filters
    if (this.baseLayer) {
      this.baseLayer.destroy();
      this.baseLayer = null;
    }

    for (const [_, overlay] of this.overlayLayers) {
      overlay.sprite.destroy();
    }
    this.overlayLayers.clear();

    // Destroy noise textures
    if (this.temperatureNoiseTexture) {
      this.temperatureNoiseTexture.destroy(true);
      this.temperatureNoiseTexture = null;
    }
    if (this.humidityNoiseTexture) {
      this.humidityNoiseTexture.destroy(true);
      this.humidityNoiseTexture = null;
    }

    this.container.destroy({ children: true });
    this.isLoaded = false;
  }
}
