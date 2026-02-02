import { Graphics } from 'pixi.js';
import type { BiomeType, TransitionElement, TransitionInfo } from '@/lib/map/lovable/types/generation';
import { CHUNK_SIZE, CELL_SIZE } from '@/lib/map/lovable/types/generation';
import { getBiomeDefinition } from '@/lib/map/lovable/data/BiomeDatabase';
import { getBiomeAt } from './BiomeGenerator';
import { createSeededRandom, hashCoords } from '@/lib/map/lovable/utils/SeededRandom';
import { lerpColorRGB } from '@/lib/map/lovable/utils/ColorUtils';

/**
 * Transition Generator
 * Creates smooth visual transitions between biome boundaries
 */

// Transition detection radius
const TRANSITION_CHECK_RADIUS = 80;

// Transition drawing density
const TRANSITION_DENSITY = 24;

/**
 * Generate transition effects for a chunk
 */
export function generateTransitions(chunkX: number, chunkY: number): Graphics | null {
  const graphics = new Graphics();
  const worldOffsetX = chunkX * CHUNK_SIZE;
  const worldOffsetY = chunkY * CHUNK_SIZE;
  let hasTransitions = false;

  // Check for transitions in a grid
  for (let localY = 0; localY < CHUNK_SIZE; localY += TRANSITION_DENSITY) {
    for (let localX = 0; localX < CHUNK_SIZE; localX += TRANSITION_DENSITY) {
      const worldX = worldOffsetX + localX;
      const worldY = worldOffsetY + localY;

      const transition = detectTransition(worldX, worldY);

      if (transition) {
        drawTransitionElements(graphics, localX, localY, transition);
        hasTransitions = true;
      }
    }
  }

  return hasTransitions ? graphics : null;
}

/**
 * Detect if there's a biome transition at this position
 */
function detectTransition(worldX: number, worldY: number): TransitionInfo | null {
  const centerBiome = getBiomeAt(worldX, worldY);

  // Check in 8 directions
  const directions: Array<[number, number]> = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
  ];

  let differentBiome: BiomeType | null = null;
  let transitionDirection = { x: 0, y: 0 };
  let transitionCount = 0;

  for (const [dx, dy] of directions) {
    const checkX = worldX + dx * TRANSITION_CHECK_RADIUS;
    const checkY = worldY + dy * TRANSITION_CHECK_RADIUS;
    const neighborBiome = getBiomeAt(checkX, checkY);

    if (neighborBiome !== centerBiome) {
      if (!differentBiome) {
        differentBiome = neighborBiome;
      }
      transitionDirection.x += dx;
      transitionDirection.y += dy;
      transitionCount++;
    }
  }

  if (!differentBiome || transitionCount === 0) {
    return null;
  }

  // Normalize direction
  const len = Math.hypot(transitionDirection.x, transitionDirection.y);
  if (len > 0) {
    transitionDirection.x /= len;
    transitionDirection.y /= len;
  }

  return {
    fromBiome: centerBiome,
    toBiome: differentBiome,
    blendFactor: transitionCount / 8,
    direction: transitionDirection,
  };
}

/**
 * Draw transition elements at a position
 */
function drawTransitionElements(
  graphics: Graphics,
  localX: number,
  localY: number,
  transition: TransitionInfo
): void {
  const fromDef = getBiomeDefinition(transition.fromBiome);
  const toDef = getBiomeDefinition(transition.toBiome);
  const rng = createSeededRandom(localX, localY, 77777);

  // Draw scattered elements based on blend factor
  const elementCount = Math.floor(2 + transition.blendFactor * 3);

  for (let i = 0; i < elementCount; i++) {
    const offsetX = rng.nextFloat(-TRANSITION_DENSITY / 2, TRANSITION_DENSITY / 2);
    const offsetY = rng.nextFloat(-TRANSITION_DENSITY / 2, TRANSITION_DENSITY / 2);
    const x = localX + offsetX;
    const y = localY + offsetY;

    // Alternate between from and to biome elements
    const useFromBiome = rng.nextBool(1 - transition.blendFactor);
    const colors = useFromBiome ? fromDef.colors : toDef.colors;

    // Draw transition element based on biome combination
    drawTransitionElement(graphics, x, y, transition, colors, rng.next());
  }
}

/**
 * Draw a single transition element
 */
function drawTransitionElement(
  graphics: Graphics,
  x: number,
  y: number,
  transition: TransitionInfo,
  colors: { primary: number; secondary: number; accent: number },
  seed: number
): void {
  const size = 3 + (seed * 4);
  const type = Math.floor(seed * 10) % 5;

  const color = lerpColorRGB(colors.primary, colors.secondary, seed);

  switch (type) {
    case 0:
      // Scattered dots
      graphics.circle(x, y, size).fill({ color, alpha: 0.6 + seed * 0.3 });
      break;
    case 1:
      // Small patches
      graphics.ellipse(x, y, size * 1.5, size).fill({ color, alpha: 0.5 + seed * 0.3 });
      break;
    case 2:
      // Gradient blobs
      graphics.circle(x, y, size * 0.8).fill({ color: colors.accent, alpha: 0.4 });
      graphics.circle(x, y, size * 0.4).fill({ color, alpha: 0.7 });
      break;
    case 3:
      // Scattered lines
      const angle = seed * Math.PI * 2;
      graphics.moveTo(x, y);
      graphics.lineTo(x + Math.cos(angle) * size * 2, y + Math.sin(angle) * size * 2);
      graphics.stroke({ color, width: 1, alpha: 0.5 });
      break;
    case 4:
      // Texture marks
      for (let i = 0; i < 3; i++) {
        const ox = (Math.sin(seed + i) * size);
        const oy = (Math.cos(seed + i) * size);
        graphics.circle(x + ox, y + oy, 1.5).fill({ color, alpha: 0.4 });
      }
      break;
  }
}

/**
 * Get transition info for debugging
 */
export function getTransitionInfo(worldX: number, worldY: number): TransitionInfo | null {
  return detectTransition(worldX, worldY);
}
