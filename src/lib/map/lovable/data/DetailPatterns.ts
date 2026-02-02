import type { Graphics } from 'pixi.js';
import type { DetailType, DrawFunction } from '@/lib/map/lovable/types/generation';

/**
 * Procedural Detail Drawing Functions
 * Each function draws a specific detail element using PixiJS Graphics
 */

// ==================== GRASSLAND DETAILS ====================

const grass_tuft: DrawFunction = (g, x, y, scale, seed) => {
  const bladeCount = 3 + (seed % 3);
  const baseColor = 0x4a7c3b;
  const lightColor = 0x5d9c4a;

  for (let i = 0; i < bladeCount; i++) {
    const angle = ((i / bladeCount) - 0.5) * 0.8 + ((seed >> (i * 2)) % 10 - 5) * 0.02;
    const height = (8 + (seed >> (i * 3)) % 6) * scale;
    const tipX = x + Math.sin(angle) * height * 0.3;
    const tipY = y - height;
    const color = i % 2 === 0 ? baseColor : lightColor;

    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + angle * 3, y - height * 0.5, tipX, tipY);
    g.stroke({ color, width: 1.5 * scale });
  }
};

const flower: DrawFunction = (g, x, y, scale, seed) => {
  const petalColors = [0xff6b6b, 0xffd93d, 0x6bcb77, 0x4d96ff, 0xc44dff];
  const petalColor = petalColors[seed % petalColors.length];
  const petalCount = 5 + (seed % 3);

  // Stem
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - 12 * scale);
  g.stroke({ color: 0x4a7c3b, width: 1.5 * scale });

  // Petals
  const centerY = y - 14 * scale;
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const px = x + Math.cos(angle) * 4 * scale;
    const py = centerY + Math.sin(angle) * 4 * scale;
    g.circle(px, py, 2.5 * scale).fill(petalColor);
  }

  // Center
  g.circle(x, centerY, 2 * scale).fill(0xffd700);
};

const small_rock: DrawFunction = (g, x, y, scale, seed) => {
  const rockColor = 0x808080 + ((seed % 40) - 20) * 0x010101;
  const width = (8 + seed % 6) * scale;
  const height = (5 + seed % 4) * scale;

  // Main rock shape
  g.ellipse(x, y - height / 2, width / 2, height / 2).fill(rockColor);

  // Highlight
  g.ellipse(x - width * 0.15, y - height * 0.6, width * 0.2, height * 0.15).fill(0xa0a0a0);
};

const bush: DrawFunction = (g, x, y, scale, seed) => {
  const colors = [0x3d6b30, 0x4a7c3b, 0x558b45];

  // Multiple overlapping circles for bush shape
  const circles = 3 + seed % 3;
  for (let i = 0; i < circles; i++) {
    const ox = ((seed >> (i * 2)) % 10 - 5) * scale;
    const oy = ((seed >> (i * 3 + 1)) % 6 - 3) * scale;
    const r = (6 + (seed >> (i * 4)) % 5) * scale;
    g.circle(x + ox, y - 8 * scale + oy, r).fill(colors[i % colors.length]);
  }
};

// ==================== FOREST DETAILS ====================

const tree_pine: DrawFunction = (g, x, y, scale, seed) => {
  const trunkHeight = (12 + seed % 5) * scale;
  const foliageColor1 = 0x1a4314;
  const foliageColor2 = 0x2d5a27;

  // Trunk
  g.rect(x - 2 * scale, y - trunkHeight, 4 * scale, trunkHeight).fill(0x5d4037);

  // Foliage triangles (3 layers)
  const baseY = y - trunkHeight + 5 * scale;
  for (let i = 0; i < 3; i++) {
    const layerY = baseY - i * 10 * scale;
    const width = (14 - i * 3) * scale;
    const height = 15 * scale;
    g.poly([x, layerY - height, x - width, layerY, x + width, layerY])
      .fill(i % 2 === 0 ? foliageColor1 : foliageColor2);
  }
};

const tree_oak: DrawFunction = (g, x, y, scale, seed) => {
  const trunkHeight = (15 + seed % 8) * scale;

  // Trunk
  g.rect(x - 3 * scale, y - trunkHeight, 6 * scale, trunkHeight).fill(0x6d4c41);

  // Canopy (overlapping circles)
  const canopyY = y - trunkHeight - 5 * scale;
  const canopyColors = [0x2d5a27, 0x3d6b30, 0x4a7c3b];

  g.circle(x, canopyY, 12 * scale).fill(canopyColors[0]);
  g.circle(x - 7 * scale, canopyY + 3 * scale, 9 * scale).fill(canopyColors[1]);
  g.circle(x + 7 * scale, canopyY + 3 * scale, 9 * scale).fill(canopyColors[2]);
  g.circle(x, canopyY - 6 * scale, 8 * scale).fill(canopyColors[1]);
};

const mushroom: DrawFunction = (g, x, y, scale, seed) => {
  const capColors = [0xff6347, 0xffd700, 0x9370db, 0x8b4513];
  const capColor = capColors[seed % capColors.length];
  const capWidth = (5 + seed % 4) * scale;
  const stemHeight = (6 + seed % 3) * scale;

  // Stem
  g.roundRect(x - 1.5 * scale, y - stemHeight, 3 * scale, stemHeight, 1).fill(0xf5f5dc);

  // Cap
  g.ellipse(x, y - stemHeight, capWidth, capWidth * 0.6).fill(capColor);

  // Spots
  if (seed % 2 === 0) {
    g.circle(x - 2 * scale, y - stemHeight - 1 * scale, 1 * scale).fill(0xffffff);
    g.circle(x + 1.5 * scale, y - stemHeight + 0.5 * scale, 0.8 * scale).fill(0xffffff);
  }
};

const log: DrawFunction = (g, x, y, scale, seed) => {
  const length = (20 + seed % 15) * scale;
  const thickness = (5 + seed % 3) * scale;

  // Log body (horizontal)
  g.roundRect(x - length / 2, y - thickness, length, thickness * 2, thickness / 2).fill(0x6d4c41);

  // End rings
  g.ellipse(x - length / 2, y, thickness * 0.3, thickness).fill(0x8b7355);
  g.ellipse(x + length / 2, y, thickness * 0.3, thickness).fill(0x8b7355);
};

// ==================== DESERT DETAILS ====================

const cactus: DrawFunction = (g, x, y, scale, seed) => {
  const height = (18 + seed % 10) * scale;
  const cactusGreen = 0x228b22;

  // Main body
  g.roundRect(x - 3 * scale, y - height, 6 * scale, height, 2).fill(cactusGreen);

  // Arms
  if (seed % 3 !== 0) {
    const armY = y - height * 0.6;
    g.roundRect(x + 3 * scale, armY, 8 * scale, 3 * scale, 1.5).fill(cactusGreen);
    g.roundRect(x + 8 * scale, armY - 8 * scale, 3 * scale, 10 * scale, 1.5).fill(cactusGreen);
  }
  if (seed % 2 === 0) {
    const armY = y - height * 0.4;
    g.roundRect(x - 10 * scale, armY, 7 * scale, 3 * scale, 1.5).fill(cactusGreen);
    g.roundRect(x - 10 * scale, armY - 6 * scale, 3 * scale, 8 * scale, 1.5).fill(cactusGreen);
  }
};

const skull: DrawFunction = (g, x, y, scale) => {
  const boneWhite = 0xf5f5dc;

  // Skull
  g.ellipse(x, y - 4 * scale, 5 * scale, 4 * scale).fill(boneWhite);

  // Eye sockets
  g.circle(x - 2 * scale, y - 4 * scale, 1.2 * scale).fill(0x1a1a1a);
  g.circle(x + 2 * scale, y - 4 * scale, 1.2 * scale).fill(0x1a1a1a);

  // Nose
  g.poly([x, y - 3 * scale, x - 0.8 * scale, y - 1.5 * scale, x + 0.8 * scale, y - 1.5 * scale]).fill(0x1a1a1a);
};

const sand_dune: DrawFunction = (g, x, y, scale, seed) => {
  const width = (30 + seed % 20) * scale;
  const height = (8 + seed % 6) * scale;
  const duneColor = 0xe8c97d;
  const shadowColor = 0xc9923a;

  // Light side
  g.poly([x - width / 2, y, x + width * 0.1, y - height, x + width / 2, y]).fill(duneColor);

  // Shadow side
  g.poly([x + width * 0.1, y - height, x + width / 2, y, x + width * 0.3, y]).fill(shadowColor);
};

const dead_bush: DrawFunction = (g, x, y, scale, seed) => {
  const brownColor = 0x8b4513;
  const branches = 4 + seed % 4;

  for (let i = 0; i < branches; i++) {
    const angle = ((i / branches) - 0.5) * Math.PI * 0.8 + ((seed >> i) % 10 - 5) * 0.05;
    const length = (8 + (seed >> (i * 2)) % 6) * scale;
    const endX = x + Math.sin(angle) * length;
    const endY = y - Math.cos(angle) * length;

    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(endX, endY);
    g.stroke({ color: brownColor, width: 1.5 * scale });

    // Smaller branches
    if (seed % 2 === i % 2) {
      const subAngle = angle + (seed % 2 === 0 ? 0.4 : -0.4);
      g.beginPath();
      g.moveTo(endX, endY);
      g.lineTo(endX + Math.sin(subAngle) * length * 0.4, endY - Math.cos(subAngle) * length * 0.4);
      g.stroke({ color: brownColor, width: 1 * scale });
    }
  }
};

// ==================== SNOW DETAILS ====================

const pine_snow: DrawFunction = (g, x, y, scale, seed) => {
  // Draw pine tree first
  tree_pine(g, x, y, scale, seed);

  // Add snow patches
  const snowY = y - (12 + seed % 5) * scale - 5 * scale;
  for (let i = 0; i < 3; i++) {
    const layerY = snowY - i * 10 * scale;
    const width = (12 - i * 2.5) * scale;
    g.ellipse(x, layerY + 2 * scale, width * 0.8, 3 * scale).fill(0xffffff);
  }
};

const ice_crystal: DrawFunction = (g, x, y, scale, seed) => {
  const crystalColor = 0xadd8e6;
  const shineColor = 0xffffff;
  const spikes = 6;
  const length = (8 + seed % 5) * scale;

  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const endX = x + Math.cos(angle) * length;
    const endY = y - length / 2 + Math.sin(angle) * length;

    g.beginPath();
    g.moveTo(x, y - length / 2);
    g.lineTo(endX, endY);
    g.stroke({ color: crystalColor, width: 2 * scale });

    // Smaller offshoots
    const midX = x + Math.cos(angle) * length * 0.6;
    const midY = y - length / 2 + Math.sin(angle) * length * 0.6;
    g.beginPath();
    g.moveTo(midX, midY);
    g.lineTo(midX + Math.cos(angle + 0.5) * length * 0.3, midY + Math.sin(angle + 0.5) * length * 0.3);
    g.stroke({ color: shineColor, width: 1 * scale });
  }
};

const snowdrift: DrawFunction = (g, x, y, scale, seed) => {
  const width = (20 + seed % 15) * scale;
  const height = (5 + seed % 4) * scale;

  g.ellipse(x, y - height / 2, width / 2, height).fill(0xffffff);
  g.ellipse(x + width * 0.2, y - height * 0.3, width * 0.3, height * 0.6).fill(0xf0f8ff);
};

const frozen_rock: DrawFunction = (g, x, y, scale, seed) => {
  // Base rock
  small_rock(g, x, y, scale, seed);

  // Ice coating
  const width = (8 + seed % 6) * scale;
  const height = (5 + seed % 4) * scale;
  g.ellipse(x, y - height / 2 - 1 * scale, width * 0.4, height * 0.3).fill({ color: 0xadd8e6, alpha: 0.6 });
};

// ==================== SWAMP DETAILS ====================

const cattail: DrawFunction = (g, x, y, scale, seed) => {
  const height = (15 + seed % 8) * scale;
  const lean = ((seed % 10) - 5) * 0.02;

  // Stem
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + lean * height, y - height / 2, x + lean * height * 2, y - height);
  g.stroke({ color: 0x556b2f, width: 1.5 * scale });

  // Brown head
  const headY = y - height + 2 * scale;
  g.roundRect(x + lean * height * 2 - 1.5 * scale, headY - 6 * scale, 3 * scale, 8 * scale, 1.5).fill(0x8b4513);
};

const lily_pad: DrawFunction = (g, x, y, scale, seed) => {
  const size = (8 + seed % 5) * scale;
  const padColor = 0x228b22;

  // Pad (circle with notch)
  g.beginPath();
  g.arc(x, y - 1 * scale, size, 0.2, Math.PI * 2 - 0.2);
  g.lineTo(x, y - 1 * scale);
  g.closePath();
  g.fill(padColor);

  // Optional flower
  if (seed % 4 === 0) {
    g.circle(x, y - 2 * scale, 2 * scale).fill(0xffc0cb);
    g.circle(x, y - 2 * scale, 1 * scale).fill(0xffff00);
  }
};

const dead_tree: DrawFunction = (g, x, y, scale, seed) => {
  const height = (25 + seed % 15) * scale;
  const deadColor = 0x4a4a4a;

  // Trunk
  g.moveTo(x - 3 * scale, y);
  g.lineTo(x - 2 * scale, y - height);
  g.lineTo(x + 2 * scale, y - height * 0.95);
  g.lineTo(x + 3 * scale, y);
  g.closePath();
  g.fill(deadColor);

  // Bare branches
  const branches = 3 + seed % 3;
  for (let i = 0; i < branches; i++) {
    const branchY = y - height * (0.4 + i * 0.2);
    const dir = i % 2 === 0 ? 1 : -1;
    const branchLength = (10 + (seed >> i) % 8) * scale;

    g.beginPath();
    g.moveTo(x, branchY);
    g.lineTo(x + dir * branchLength, branchY - branchLength * 0.3);
    g.stroke({ color: deadColor, width: 2 * scale });
  }
};

const mud_bubble: DrawFunction = (g, x, y, scale, seed) => {
  const size = (3 + seed % 3) * scale;

  // Bubble
  g.circle(x, y - size, size).fill({ color: 0x5a6b42, alpha: 0.7 });
  g.beginPath();
  g.arc(x - size * 0.3, y - size * 1.2, size * 0.4, Math.PI, Math.PI * 1.8);
  g.stroke({ color: 0x7a8f5e, width: 1 });
};

// ==================== VOLCANIC DETAILS ====================

const lava_crack: DrawFunction = (g, x, y, scale, seed) => {
  const length = (15 + seed % 10) * scale;
  const glowColor = 0xff4500;
  const crackColor = 0xff6600;

  // Glow underneath
  g.beginPath();
  g.moveTo(x - length / 2, y);
  g.quadraticCurveTo(x, y - 3 * scale, x + length / 2, y + 2 * scale);
  g.stroke({ color: glowColor, width: 4 * scale, alpha: 0.5 });

  // Main crack
  g.beginPath();
  g.moveTo(x - length / 2, y);
  g.bezierCurveTo(x - length / 4, y - 2 * scale, x + length / 4, y + 2 * scale, x + length / 2, y);
  g.stroke({ color: crackColor, width: 2 * scale });
};

const obsidian_spike: DrawFunction = (g, x, y, scale, seed) => {
  const height = (15 + seed % 12) * scale;
  const width = (6 + seed % 4) * scale;
  const obsidianColor = 0x1a1a2e;
  const shineColor = 0x4a4a6a;

  // Main spike
  g.poly([x, y - height, x - width / 2, y, x + width / 2, y]).fill(obsidianColor);

  // Shine edge
  g.poly([x, y - height, x + width / 4, y - height / 2, x + width / 2, y]).fill(shineColor);
};

const ember: DrawFunction = (g, x, y, scale, seed) => {
  const colors = [0xff4500, 0xff6600, 0xff8c00, 0xffa500];
  const size = (2 + seed % 2) * scale;
  const floatOffset = Math.sin(seed) * 3 * scale;

  g.circle(x, y - 5 * scale + floatOffset, size).fill(colors[seed % colors.length]);
  g.circle(x, y - 5 * scale + floatOffset, size * 0.6).fill(0xffff00);
};

const ash_pile: DrawFunction = (g, x, y, scale, seed) => {
  const width = (12 + seed % 8) * scale;
  const height = (3 + seed % 2) * scale;

  g.ellipse(x, y - height / 2, width / 2, height).fill(0x3a3a3a);
  g.ellipse(x + width * 0.1, y - height * 0.3, width * 0.3, height * 0.5).fill(0x4a4a4a);
};

// ==================== PATTERN REGISTRY ====================

export const DETAIL_PATTERNS: Record<DetailType, DrawFunction> = {
  // Grassland
  grass_tuft,
  flower,
  small_rock,
  bush,
  // Forest
  tree_pine,
  tree_oak,
  mushroom,
  log,
  // Desert
  cactus,
  skull,
  sand_dune,
  dead_bush,
  // Snow
  pine_snow,
  ice_crystal,
  snowdrift,
  frozen_rock,
  // Swamp
  cattail,
  lily_pad,
  dead_tree,
  mud_bubble,
  // Volcanic
  lava_crack,
  obsidian_spike,
  ember,
  ash_pile,
};

/**
 * Draw a detail element at the specified position
 */
export function drawDetail(
  graphics: Graphics,
  type: DetailType,
  x: number,
  y: number,
  scale: number = 1,
  seed: number = 0
): void {
  const pattern = DETAIL_PATTERNS[type];
  if (pattern) {
    pattern(graphics, x, y, scale, seed);
  }
}
