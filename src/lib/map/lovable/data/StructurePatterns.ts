import type { Graphics } from 'pixi.js';
import type { StructureType, StructureDrawFunction } from '@/lib/map/lovable/types/generation';

/**
 * Procedural Structure Drawing Functions
 * Each function draws a structure using PixiJS Graphics
 * 24 total structures (4 per biome)
 */

// ==================== GRASSLAND STRUCTURES ====================

const cottage: StructureDrawFunction = (g, x, y, scale) => {
  const wallColor = 0x8b7355;
  const roofColor = 0x5d4037;
  const doorColor = 0x3e2723;
  const windowColor = 0xffeb3b;

  // Base walls
  g.rect(x - 25 * scale, y - 30 * scale, 50 * scale, 30 * scale).fill(wallColor);

  // Roof
  g.poly([
    x - 30 * scale, y - 30 * scale,
    x, y - 55 * scale,
    x + 30 * scale, y - 30 * scale
  ]).fill(roofColor);

  // Door
  g.roundRect(x - 6 * scale, y - 18 * scale, 12 * scale, 18 * scale, 2).fill(doorColor);
  g.circle(x + 3 * scale, y - 9 * scale, 1.5 * scale).fill(0xffd700);

  // Windows
  g.rect(x - 20 * scale, y - 22 * scale, 8 * scale, 8 * scale).fill(windowColor);
  g.rect(x + 12 * scale, y - 22 * scale, 8 * scale, 8 * scale).fill(windowColor);

  // Chimney
  g.rect(x + 15 * scale, y - 50 * scale, 8 * scale, 15 * scale).fill(0x8b4513);
};

const windmill: StructureDrawFunction = (g, x, y, scale) => {
  const bodyColor = 0xf5f5dc;
  const roofColor = 0x8b4513;
  const bladeColor = 0x6d4c41;

  // Tower (tapered)
  g.poly([
    x - 15 * scale, y,
    x - 12 * scale, y - 50 * scale,
    x + 12 * scale, y - 50 * scale,
    x + 15 * scale, y
  ]).fill(bodyColor);

  // Roof
  g.poly([
    x - 15 * scale, y - 50 * scale,
    x, y - 65 * scale,
    x + 15 * scale, y - 50 * scale
  ]).fill(roofColor);

  // Blades (4)
  const bladeLength = 35 * scale;
  const centerY = y - 40 * scale;
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 8;
    const endX = x + Math.cos(angle) * bladeLength;
    const endY = centerY + Math.sin(angle) * bladeLength;

    g.beginPath();
    g.moveTo(x, centerY);
    g.lineTo(endX, endY);
    g.stroke({ color: bladeColor, width: 3 * scale });

    // Blade panels
    g.poly([
      x + Math.cos(angle) * 5 * scale, centerY + Math.sin(angle) * 5 * scale,
      x + Math.cos(angle + 0.15) * bladeLength, centerY + Math.sin(angle + 0.15) * bladeLength,
      x + Math.cos(angle - 0.05) * bladeLength, centerY + Math.sin(angle - 0.05) * bladeLength
    ]).fill({ color: 0xdeb887, alpha: 0.8 });
  }

  // Center hub
  g.circle(x, centerY, 4 * scale).fill(0x5d4037);
};

const well: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x808080;
  const roofColor = 0x8b4513;
  const waterColor = 0x4169e1;

  // Stone base (cylinder-ish)
  g.ellipse(x, y - 3 * scale, 15 * scale, 8 * scale).fill(stoneColor);
  g.rect(x - 15 * scale, y - 15 * scale, 30 * scale, 12 * scale).fill(stoneColor);
  g.ellipse(x, y - 15 * scale, 15 * scale, 8 * scale).fill(0x707070);

  // Water inside
  g.ellipse(x, y - 15 * scale, 12 * scale, 6 * scale).fill(waterColor);

  // Roof supports
  g.rect(x - 12 * scale, y - 35 * scale, 3 * scale, 20 * scale).fill(roofColor);
  g.rect(x + 9 * scale, y - 35 * scale, 3 * scale, 20 * scale).fill(roofColor);

  // Roof
  g.poly([
    x - 18 * scale, y - 35 * scale,
    x, y - 48 * scale,
    x + 18 * scale, y - 35 * scale
  ]).fill(roofColor);
};

const barn: StructureDrawFunction = (g, x, y, scale) => {
  const wallColor = 0x8b0000;
  const roofColor = 0x4a4a4a;
  const doorColor = 0x5d4037;

  // Main structure
  g.rect(x - 35 * scale, y - 35 * scale, 70 * scale, 35 * scale).fill(wallColor);

  // Gambrel roof
  g.poly([
    x - 38 * scale, y - 35 * scale,
    x - 25 * scale, y - 50 * scale,
    x, y - 58 * scale,
    x + 25 * scale, y - 50 * scale,
    x + 38 * scale, y - 35 * scale
  ]).fill(roofColor);

  // Large barn doors
  g.rect(x - 15 * scale, y - 30 * scale, 30 * scale, 30 * scale).fill(doorColor);
  g.beginPath();
  g.moveTo(x, y - 30 * scale);
  g.lineTo(x, y);
  g.stroke({ color: 0x3e2723, width: 2 * scale });

  // X pattern on doors
  g.beginPath();
  g.moveTo(x - 15 * scale, y - 30 * scale);
  g.lineTo(x, y - 15 * scale);
  g.moveTo(x, y - 15 * scale);
  g.lineTo(x + 15 * scale, y - 30 * scale);
  g.stroke({ color: 0x3e2723, width: 1.5 * scale });
};

// ==================== FOREST STRUCTURES ====================

const treehouse: StructureDrawFunction = (g, x, y, scale) => {
  const trunkColor = 0x5d4037;
  const houseColor = 0x8b7355;
  const roofColor = 0x2d5a27;

  // Tree trunk
  g.rect(x - 8 * scale, y - 50 * scale, 16 * scale, 50 * scale).fill(trunkColor);

  // Platform
  g.rect(x - 25 * scale, y - 55 * scale, 50 * scale, 5 * scale).fill(0x6d4c41);

  // House structure
  g.rect(x - 20 * scale, y - 80 * scale, 40 * scale, 25 * scale).fill(houseColor);

  // Leaf roof
  g.ellipse(x, y - 85 * scale, 30 * scale, 20 * scale).fill(roofColor);

  // Window
  g.circle(x, y - 70 * scale, 5 * scale).fill(0xffeb3b);

  // Ladder
  for (let i = 0; i < 5; i++) {
    g.rect(x - 15 * scale, y - 10 * scale - i * 10 * scale, 8 * scale, 2 * scale).fill(0x8b4513);
  }
};

const ranger_cabin: StructureDrawFunction = (g, x, y, scale) => {
  const logColor = 0x6d4c41;
  const roofColor = 0x3e2723;

  // Log walls (horizontal lines)
  for (let i = 0; i < 5; i++) {
    g.rect(x - 30 * scale, y - 8 * scale - i * 6 * scale, 60 * scale, 5 * scale).fill(logColor);
  }

  // Roof
  g.poly([
    x - 35 * scale, y - 35 * scale,
    x, y - 55 * scale,
    x + 35 * scale, y - 35 * scale
  ]).fill(roofColor);

  // Door
  g.rect(x - 6 * scale, y - 20 * scale, 12 * scale, 20 * scale).fill(0x3e2723);

  // Antlers above door
  g.beginPath();
  g.moveTo(x - 8 * scale, y - 25 * scale);
  g.lineTo(x - 15 * scale, y - 32 * scale);
  g.moveTo(x + 8 * scale, y - 25 * scale);
  g.lineTo(x + 15 * scale, y - 32 * scale);
  g.stroke({ color: 0xf5f5dc, width: 2 * scale });
};

const druid_circle: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x696969;
  const glowColor = 0x7cfc00;

  // Ground circle (moss)
  g.circle(x, y - 5 * scale, 35 * scale).fill(0x556b2f);

  // Standing stones
  const stoneCount = 8;
  for (let i = 0; i < stoneCount; i++) {
    const angle = (i / stoneCount) * Math.PI * 2;
    const stoneX = x + Math.cos(angle) * 30 * scale;
    const stoneY = y - 5 * scale + Math.sin(angle) * 15 * scale;
    const height = (15 + (i % 3) * 5) * scale;

    g.poly([
      stoneX - 4 * scale, stoneY,
      stoneX - 3 * scale, stoneY - height,
      stoneX + 3 * scale, stoneY - height,
      stoneX + 4 * scale, stoneY
    ]).fill(stoneColor);
  }

  // Central altar with glow
  g.circle(x, y - 5 * scale, 8 * scale).fill({ color: glowColor, alpha: 0.3 });
  g.rect(x - 6 * scale, y - 10 * scale, 12 * scale, 8 * scale).fill(stoneColor);
};

const hunting_lodge: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x8b4513;
  const stoneColor = 0x696969;

  // Stone foundation
  g.rect(x - 35 * scale, y - 5 * scale, 70 * scale, 5 * scale).fill(stoneColor);

  // Main building
  g.rect(x - 30 * scale, y - 35 * scale, 60 * scale, 30 * scale).fill(woodColor);

  // A-frame roof
  g.poly([
    x - 35 * scale, y - 35 * scale,
    x, y - 60 * scale,
    x + 35 * scale, y - 35 * scale
  ]).fill(0x3e2723);

  // Trophy mount
  g.circle(x, y - 45 * scale, 6 * scale).fill(0xf5f5dc);
  g.beginPath();
  g.moveTo(x - 8 * scale, y - 50 * scale);
  g.lineTo(x - 15 * scale, y - 55 * scale);
  g.moveTo(x + 8 * scale, y - 50 * scale);
  g.lineTo(x + 15 * scale, y - 55 * scale);
  g.stroke({ color: 0xf5f5dc, width: 2 * scale });

  // Door
  g.rect(x - 8 * scale, y - 22 * scale, 16 * scale, 22 * scale).fill(0x3e2723);
};

// ==================== DESERT STRUCTURES ====================

const pyramid: StructureDrawFunction = (g, x, y, scale) => {
  const sandColor = 0xd4a853;
  const shadowColor = 0xb8923a;
  const darkColor = 0x1a1a1a;

  // Main pyramid
  g.poly([x, y - 70 * scale, x - 50 * scale, y, x + 50 * scale, y]).fill(sandColor);

  // Shadow side
  g.poly([x, y - 70 * scale, x + 50 * scale, y, x, y]).fill(shadowColor);

  // Entrance
  g.poly([x, y - 15 * scale, x - 10 * scale, y, x + 10 * scale, y]).fill(darkColor);
};

const oasis_tent: StructureDrawFunction = (g, x, y, scale) => {
  const fabricColor = 0xdeb887;
  const stripeColor = 0x8b4513;

  // Tent body
  g.poly([
    x - 30 * scale, y,
    x - 20 * scale, y - 35 * scale,
    x, y - 45 * scale,
    x + 20 * scale, y - 35 * scale,
    x + 30 * scale, y
  ]).fill(fabricColor);

  // Stripes
  g.beginPath();
  g.moveTo(x - 10 * scale, y - 40 * scale);
  g.lineTo(x - 15 * scale, y);
  g.moveTo(x + 10 * scale, y - 40 * scale);
  g.lineTo(x + 15 * scale, y);
  g.stroke({ color: stripeColor, width: 3 * scale });

  // Entrance opening
  g.poly([
    x - 8 * scale, y,
    x, y - 25 * scale,
    x + 8 * scale, y
  ]).fill(0x1a1a1a);

  // Palm tree nearby
  g.rect(x + 35 * scale, y - 30 * scale, 4 * scale, 30 * scale).fill(0x8b4513);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI - Math.PI / 2;
    g.beginPath();
    g.moveTo(x + 37 * scale, y - 30 * scale);
    g.quadraticCurveTo(
      x + 37 * scale + Math.cos(angle) * 15 * scale,
      y - 35 * scale + Math.sin(angle) * 10 * scale,
      x + 37 * scale + Math.cos(angle) * 20 * scale,
      y - 25 * scale + Math.sin(angle) * 15 * scale
    );
    g.stroke({ color: 0x228b22, width: 2 * scale });
  }
};

const sand_castle: StructureDrawFunction = (g, x, y, scale) => {
  const sandColor = 0xe8c97d;

  // Base wall
  g.rect(x - 30 * scale, y - 15 * scale, 60 * scale, 15 * scale).fill(sandColor);

  // Towers
  const towers = [
    { ox: -25, h: 35 },
    { ox: 0, h: 45 },
    { ox: 25, h: 35 }
  ];

  towers.forEach(t => {
    g.rect(x + t.ox * scale - 8 * scale, y - t.h * scale, 16 * scale, t.h * scale).fill(sandColor);
    // Crenellations
    for (let i = 0; i < 3; i++) {
      g.rect(x + t.ox * scale - 8 * scale + i * 6 * scale, y - t.h * scale - 4 * scale, 4 * scale, 4 * scale).fill(sandColor);
    }
  });

  // Flag on center tower
  g.beginPath();
  g.moveTo(x, y - 45 * scale);
  g.lineTo(x, y - 55 * scale);
  g.stroke({ color: 0x8b4513, width: 1.5 * scale });
  g.poly([x, y - 55 * scale, x + 8 * scale, y - 52 * scale, x, y - 49 * scale]).fill(0xff6347);
};

const buried_ruins: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x9e9e7e;
  const sandColor = 0xd4a853;

  // Half-buried columns
  g.rect(x - 25 * scale, y - 20 * scale, 8 * scale, 20 * scale).fill(stoneColor);
  g.rect(x + 17 * scale, y - 15 * scale, 8 * scale, 15 * scale).fill(stoneColor);

  // Broken arch
  g.beginPath();
  g.arc(x, y - 15 * scale, 20 * scale, Math.PI, 0);
  g.stroke({ color: stoneColor, width: 5 * scale });

  // Sand dune covering
  g.ellipse(x, y - 3 * scale, 35 * scale, 8 * scale).fill(sandColor);

  // Hieroglyphics hint
  g.rect(x - 5 * scale, y - 12 * scale, 10 * scale, 8 * scale).fill(0x8b7355);
};

// ==================== SNOW STRUCTURES ====================

const igloo: StructureDrawFunction = (g, x, y, scale) => {
  const snowColor = 0xffffff;
  const iceColor = 0xe0f0ff;

  // Main dome
  g.arc(x, y, 30 * scale, Math.PI, 0);
  g.closePath();
  g.fill(snowColor);

  // Ice block pattern
  for (let row = 0; row < 3; row++) {
    const rowY = y - 8 * scale - row * 8 * scale;
    const arcWidth = 25 * scale * (1 - row * 0.2);
    for (let i = 0; i < 4 - row; i++) {
      const blockX = x - arcWidth + i * arcWidth * 0.6;
      g.rect(blockX, rowY, arcWidth * 0.5, 6 * scale).stroke({ color: iceColor, width: 1 });
    }
  }

  // Entrance tunnel
  g.ellipse(x, y - 8 * scale, 10 * scale, 12 * scale).fill(snowColor);
  g.ellipse(x, y - 5 * scale, 6 * scale, 8 * scale).fill(0x4a6fa5);
};

const ice_tower: StructureDrawFunction = (g, x, y, scale) => {
  const iceColor = 0xadd8e6;
  const crystalColor = 0xe0ffff;

  // Main tower
  g.poly([
    x - 15 * scale, y,
    x - 10 * scale, y - 60 * scale,
    x + 10 * scale, y - 60 * scale,
    x + 15 * scale, y
  ]).fill(iceColor);

  // Crystal spire
  g.poly([
    x - 8 * scale, y - 60 * scale,
    x, y - 80 * scale,
    x + 8 * scale, y - 60 * scale
  ]).fill(crystalColor);

  // Ice facets
  g.beginPath();
  g.moveTo(x - 5 * scale, y - 60 * scale);
  g.lineTo(x, y - 75 * scale);
  g.lineTo(x + 5 * scale, y - 60 * scale);
  g.stroke({ color: 0xffffff, width: 1 * scale });

  // Window slits
  g.rect(x - 2 * scale, y - 45 * scale, 4 * scale, 10 * scale).fill(0x4a6fa5);
  g.rect(x - 2 * scale, y - 25 * scale, 4 * scale, 10 * scale).fill(0x4a6fa5);
};

const frozen_shrine: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x9bb5c4;
  const iceColor = 0xadd8e6;
  const glowColor = 0x00ffff;

  // Base platform
  g.ellipse(x, y - 3 * scale, 30 * scale, 10 * scale).fill(stoneColor);

  // Frozen pillars
  const pillars = [-20, 20];
  pillars.forEach(ox => {
    g.rect(x + ox * scale - 4 * scale, y - 35 * scale, 8 * scale, 32 * scale).fill(iceColor);
  });

  // Arch
  g.beginPath();
  g.arc(x, y - 35 * scale, 20 * scale, Math.PI, 0);
  g.stroke({ color: iceColor, width: 4 * scale });

  // Central crystal
  g.poly([x, y - 50 * scale, x - 8 * scale, y - 25 * scale, x + 8 * scale, y - 25 * scale]).fill(glowColor);
  g.circle(x, y - 35 * scale, 6 * scale).fill({ color: glowColor, alpha: 0.5 });
};

const nordic_hall: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x5d4037;
  const roofColor = 0x4a4a4a;
  const snowColor = 0xffffff;

  // Main structure
  g.rect(x - 40 * scale, y - 30 * scale, 80 * scale, 30 * scale).fill(woodColor);

  // Curved roof
  g.ellipse(x, y - 35 * scale, 45 * scale, 20 * scale).fill(roofColor);
  g.rect(x - 45 * scale, y - 35 * scale, 90 * scale, 20 * scale).fill(roofColor);

  // Snow on roof
  g.ellipse(x, y - 40 * scale, 40 * scale, 8 * scale).fill(snowColor);

  // Dragon head decorations
  g.poly([x - 40 * scale, y - 35 * scale, x - 50 * scale, y - 50 * scale, x - 35 * scale, y - 40 * scale]).fill(woodColor);
  g.poly([x + 40 * scale, y - 35 * scale, x + 50 * scale, y - 50 * scale, x + 35 * scale, y - 40 * scale]).fill(woodColor);

  // Door
  g.rect(x - 10 * scale, y - 25 * scale, 20 * scale, 25 * scale).fill(0x3e2723);
};

// ==================== SWAMP STRUCTURES ====================

const witch_hut: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x4a3728;
  const roofColor = 0x2a2a2a;
  const glowColor = 0x7cfc00;

  // Stilts
  g.rect(x - 20 * scale, y - 25 * scale, 4 * scale, 25 * scale).fill(woodColor);
  g.rect(x + 16 * scale, y - 25 * scale, 4 * scale, 25 * scale).fill(woodColor);

  // Crooked hut body
  g.poly([
    x - 25 * scale, y - 25 * scale,
    x - 22 * scale, y - 50 * scale,
    x + 25 * scale, y - 48 * scale,
    x + 22 * scale, y - 25 * scale
  ]).fill(woodColor);

  // Crooked roof
  g.poly([
    x - 28 * scale, y - 50 * scale,
    x + 5 * scale, y - 70 * scale,
    x + 30 * scale, y - 48 * scale
  ]).fill(roofColor);

  // Glowing window
  g.circle(x, y - 40 * scale, 5 * scale).fill(glowColor);

  // Smoke from chimney
  g.circle(x + 15 * scale, y - 65 * scale, 3 * scale).fill({ color: 0x808080, alpha: 0.5 });
  g.circle(x + 18 * scale, y - 72 * scale, 4 * scale).fill({ color: 0x808080, alpha: 0.3 });
};

const sunken_temple: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x556b2f;
  const waterColor = 0x3d5c5c;

  // Water around base
  g.ellipse(x, y - 3 * scale, 40 * scale, 12 * scale).fill(waterColor);

  // Partially submerged columns
  g.rect(x - 30 * scale, y - 25 * scale, 8 * scale, 22 * scale).fill(stoneColor);
  g.rect(x + 22 * scale, y - 20 * scale, 8 * scale, 17 * scale).fill(stoneColor);

  // Broken pediment
  g.poly([
    x - 35 * scale, y - 25 * scale,
    x - 5 * scale, y - 40 * scale,
    x + 10 * scale, y - 35 * scale
  ]).fill(stoneColor);

  // Vines
  g.beginPath();
  g.moveTo(x - 26 * scale, y - 25 * scale);
  g.quadraticCurveTo(x - 30 * scale, y - 15 * scale, x - 35 * scale, y - 10 * scale);
  g.stroke({ color: 0x228b22, width: 2 * scale });
};

const bog_bridge: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x5d4037;
  const waterColor = 0x3d5c5c;

  // Murky water
  g.ellipse(x, y - 2 * scale, 50 * scale, 8 * scale).fill(waterColor);

  // Bridge planks
  for (let i = 0; i < 8; i++) {
    const plankX = x - 35 * scale + i * 10 * scale;
    const wobble = (i % 2) * 2 - 1;
    g.rect(plankX, y - 8 * scale + wobble * scale, 8 * scale, 3 * scale).fill(woodColor);
  }

  // Support posts
  g.rect(x - 35 * scale, y - 15 * scale, 4 * scale, 15 * scale).fill(woodColor);
  g.rect(x + 31 * scale, y - 15 * scale, 4 * scale, 15 * scale).fill(woodColor);

  // Rope railings
  g.beginPath();
  g.moveTo(x - 33 * scale, y - 15 * scale);
  g.quadraticCurveTo(x, y - 10 * scale, x + 33 * scale, y - 15 * scale);
  g.stroke({ color: 0x8b7355, width: 1.5 * scale });
};

const spirit_shrine: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x4a5d4a;
  const glowColor = 0x00ff88;

  // Stone base
  g.ellipse(x, y - 3 * scale, 20 * scale, 8 * scale).fill(stoneColor);

  // Central obelisk
  g.poly([
    x - 6 * scale, y - 5 * scale,
    x - 4 * scale, y - 40 * scale,
    x + 4 * scale, y - 40 * scale,
    x + 6 * scale, y - 5 * scale
  ]).fill(stoneColor);

  // Spirit orbs
  const orbs = [
    { ox: -15, oy: -20 },
    { ox: 15, oy: -25 },
    { ox: 0, oy: -45 }
  ];
  orbs.forEach(o => {
    g.circle(x + o.ox * scale, y + o.oy * scale, 4 * scale).fill({ color: glowColor, alpha: 0.6 });
    g.circle(x + o.ox * scale, y + o.oy * scale, 2 * scale).fill(glowColor);
  });

  // Runes on obelisk
  g.beginPath();
  g.moveTo(x - 2 * scale, y - 15 * scale);
  g.lineTo(x + 2 * scale, y - 20 * scale);
  g.lineTo(x - 2 * scale, y - 25 * scale);
  g.stroke({ color: glowColor, width: 1 * scale });
};

// ==================== VOLCANIC STRUCTURES ====================

const forge: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x3a3a3a;
  const metalColor = 0x4a4a4a;
  const fireColor = 0xff4500;

  // Stone base
  g.rect(x - 30 * scale, y - 25 * scale, 60 * scale, 25 * scale).fill(stoneColor);

  // Chimney
  g.rect(x + 10 * scale, y - 50 * scale, 15 * scale, 50 * scale).fill(stoneColor);

  // Fire glow from furnace
  g.rect(x - 20 * scale, y - 20 * scale, 25 * scale, 15 * scale).fill(fireColor);
  g.rect(x - 18 * scale, y - 18 * scale, 21 * scale, 11 * scale).fill(0xff6600);

  // Anvil
  g.rect(x - 35 * scale, y - 12 * scale, 12 * scale, 12 * scale).fill(metalColor);
  g.rect(x - 38 * scale, y - 15 * scale, 18 * scale, 3 * scale).fill(metalColor);

  // Smoke
  g.circle(x + 17 * scale, y - 55 * scale, 4 * scale).fill({ color: 0x2a2a2a, alpha: 0.5 });
  g.circle(x + 20 * scale, y - 62 * scale, 5 * scale).fill({ color: 0x2a2a2a, alpha: 0.3 });
};

const lava_bridge: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x2a2a2a;
  const lavaColor = 0xff4500;

  // Lava flow below
  g.ellipse(x, y + 5 * scale, 50 * scale, 10 * scale).fill(lavaColor);
  g.ellipse(x, y + 5 * scale, 45 * scale, 8 * scale).fill(0xff6600);

  // Stone bridge arch
  g.arc(x, y + 5 * scale, 40 * scale, Math.PI, 0);
  g.lineTo(x + 45 * scale, y + 5 * scale);
  g.arc(x, y + 5 * scale, 45 * scale, 0, Math.PI, true);
  g.closePath();
  g.fill(stoneColor);

  // Bridge surface
  g.rect(x - 45 * scale, y - 38 * scale, 90 * scale, 5 * scale).fill(0x4a4a4a);

  // Pillars
  g.rect(x - 45 * scale, y - 38 * scale, 8 * scale, 43 * scale).fill(stoneColor);
  g.rect(x + 37 * scale, y - 38 * scale, 8 * scale, 43 * scale).fill(stoneColor);
};

const demon_gate: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x1a1a1a;
  const glowColor = 0xff0000;

  // Gate pillars
  g.rect(x - 30 * scale, y - 60 * scale, 12 * scale, 60 * scale).fill(stoneColor);
  g.rect(x + 18 * scale, y - 60 * scale, 12 * scale, 60 * scale).fill(stoneColor);

  // Arch with horns
  g.beginPath();
  g.arc(x, y - 60 * scale, 24 * scale, Math.PI, 0);
  g.stroke({ color: stoneColor, width: 8 * scale });

  // Horn decorations
  g.poly([x - 30 * scale, y - 60 * scale, x - 40 * scale, y - 80 * scale, x - 25 * scale, y - 65 * scale]).fill(stoneColor);
  g.poly([x + 30 * scale, y - 60 * scale, x + 40 * scale, y - 80 * scale, x + 25 * scale, y - 65 * scale]).fill(stoneColor);

  // Portal glow
  g.ellipse(x, y - 30 * scale, 18 * scale, 28 * scale).fill({ color: glowColor, alpha: 0.3 });
  g.ellipse(x, y - 30 * scale, 12 * scale, 20 * scale).fill({ color: 0xff4500, alpha: 0.5 });

  // Skull decoration
  g.ellipse(x, y - 70 * scale, 8 * scale, 6 * scale).fill(0x2a2a2a);
  g.circle(x - 3 * scale, y - 70 * scale, 2 * scale).fill(glowColor);
  g.circle(x + 3 * scale, y - 70 * scale, 2 * scale).fill(glowColor);
};

const fire_temple: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x2a1a1a;
  const fireColor = 0xff4500;

  // Base platform
  g.rect(x - 40 * scale, y - 10 * scale, 80 * scale, 10 * scale).fill(stoneColor);

  // Temple body
  g.poly([
    x - 35 * scale, y - 10 * scale,
    x - 25 * scale, y - 50 * scale,
    x + 25 * scale, y - 50 * scale,
    x + 35 * scale, y - 10 * scale
  ]).fill(stoneColor);

  // Peaked roof
  g.poly([
    x - 30 * scale, y - 50 * scale,
    x, y - 75 * scale,
    x + 30 * scale, y - 50 * scale
  ]).fill(0x4a2a2a);

  // Flame braziers
  const braziers = [-25, 25];
  braziers.forEach(ox => {
    g.rect(x + ox * scale - 4 * scale, y - 15 * scale, 8 * scale, 5 * scale).fill(0x4a4a4a);
    g.ellipse(x + ox * scale, y - 20 * scale, 5 * scale, 8 * scale).fill(fireColor);
    g.ellipse(x + ox * scale, y - 22 * scale, 3 * scale, 5 * scale).fill(0xffff00);
  });

  // Central fire symbol
  g.circle(x, y - 35 * scale, 8 * scale).fill({ color: fireColor, alpha: 0.5 });
  g.poly([x, y - 45 * scale, x - 5 * scale, y - 30 * scale, x + 5 * scale, y - 30 * scale]).fill(fireColor);
};

// ==================== NEW GRASSLAND STRUCTURES ====================

const chapel: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0xd4c4a8;
  const roofColor = 0x5d4037;
  const windowColor = 0x87ceeb;

  // Main building
  g.rect(x - 20 * scale, y - 35 * scale, 40 * scale, 35 * scale).fill(stoneColor);

  // Steeple
  g.rect(x - 8 * scale, y - 55 * scale, 16 * scale, 20 * scale).fill(stoneColor);
  g.poly([x - 10 * scale, y - 55 * scale, x, y - 75 * scale, x + 10 * scale, y - 55 * scale]).fill(roofColor);

  // Cross on top
  g.rect(x - 1.5 * scale, y - 82 * scale, 3 * scale, 10 * scale).fill(0xffd700);
  g.rect(x - 5 * scale, y - 80 * scale, 10 * scale, 3 * scale).fill(0xffd700);

  // Main roof
  g.poly([x - 25 * scale, y - 35 * scale, x, y - 50 * scale, x + 25 * scale, y - 35 * scale]).fill(roofColor);

  // Arched window
  g.arc(x, y - 20 * scale, 6 * scale, Math.PI, 0);
  g.rect(x - 6 * scale, y - 20 * scale, 12 * scale, 10 * scale).fill(windowColor);

  // Door
  g.arc(x, y - 10 * scale, 6 * scale, Math.PI, 0);
  g.rect(x - 6 * scale, y - 10 * scale, 12 * scale, 10 * scale).fill(0x5d4037);
};

const market_stall: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x8b4513;
  const canvasColor = 0xe74c3c;
  const stripeColor = 0xf5f5dc;

  // Counter
  g.rect(x - 30 * scale, y - 15 * scale, 60 * scale, 15 * scale).fill(woodColor);

  // Support poles
  g.rect(x - 28 * scale, y - 40 * scale, 4 * scale, 40 * scale).fill(woodColor);
  g.rect(x + 24 * scale, y - 40 * scale, 4 * scale, 40 * scale).fill(woodColor);

  // Awning
  g.poly([x - 35 * scale, y - 35 * scale, x, y - 48 * scale, x + 35 * scale, y - 35 * scale, x + 30 * scale, y - 25 * scale, x - 30 * scale, y - 25 * scale]).fill(canvasColor);

  // Stripes on awning
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(x - 25 * scale + i * 15 * scale, y - 42 * scale);
    g.lineTo(x - 20 * scale + i * 15 * scale, y - 28 * scale);
    g.stroke({ color: stripeColor, width: 3 * scale });
  }

  // Goods on counter
  g.circle(x - 15 * scale, y - 18 * scale, 4 * scale).fill(0xff6347);
  g.circle(x - 5 * scale, y - 18 * scale, 4 * scale).fill(0x32cd32);
  g.circle(x + 5 * scale, y - 18 * scale, 4 * scale).fill(0xffa500);
  g.rect(x + 12 * scale, y - 22 * scale, 8 * scale, 8 * scale).fill(0xdeb887);
};

// ==================== NEW FOREST STRUCTURES ====================

const moonwell: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0x6b7b8c;
  const waterColor = 0x4169e1;
  const glowColor = 0xadd8e6;

  // Outer stone ring
  g.circle(x, y - 5 * scale, 30 * scale).fill(stoneColor);
  g.circle(x, y - 5 * scale, 25 * scale).fill(0x5a6a7a);

  // Inner water pool with glow
  g.circle(x, y - 5 * scale, 22 * scale).fill({ color: glowColor, alpha: 0.3 });
  g.circle(x, y - 5 * scale, 18 * scale).fill(waterColor);

  // Moonlight reflection
  g.ellipse(x - 5 * scale, y - 8 * scale, 8 * scale, 4 * scale).fill({ color: 0xffffff, alpha: 0.6 });

  // Standing stones around
  const stones = [{ ox: -25, h: 20 }, { ox: 25, h: 25 }, { ox: 0, oy: -25, h: 22 }];
  stones.forEach(s => {
    const sy = s.oy || 0;
    g.poly([x + s.ox * scale - 4 * scale, y - 5 * scale + sy * scale, x + s.ox * scale, y - 5 * scale - s.h * scale + sy * scale, x + s.ox * scale + 4 * scale, y - 5 * scale + sy * scale]).fill(stoneColor);
  });

  // Magical particles
  g.circle(x + 8 * scale, y - 15 * scale, 2 * scale).fill({ color: glowColor, alpha: 0.8 });
  g.circle(x - 10 * scale, y - 20 * scale, 1.5 * scale).fill({ color: glowColor, alpha: 0.6 });
};

const archer_tower: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x6d4c41;
  const darkWood = 0x4e342e;

  // Platform supports (X-bracing)
  g.beginPath();
  g.moveTo(x - 15 * scale, y);
  g.lineTo(x - 5 * scale, y - 40 * scale);
  g.moveTo(x + 15 * scale, y);
  g.lineTo(x + 5 * scale, y - 40 * scale);
  g.moveTo(x - 15 * scale, y);
  g.lineTo(x + 5 * scale, y - 40 * scale);
  g.moveTo(x + 15 * scale, y);
  g.lineTo(x - 5 * scale, y - 40 * scale);
  g.stroke({ color: woodColor, width: 3 * scale });

  // Platform
  g.rect(x - 18 * scale, y - 45 * scale, 36 * scale, 5 * scale).fill(woodColor);

  // Railing posts
  g.rect(x - 16 * scale, y - 55 * scale, 3 * scale, 10 * scale).fill(darkWood);
  g.rect(x + 13 * scale, y - 55 * scale, 3 * scale, 10 * scale).fill(darkWood);

  // Roof
  g.poly([x - 22 * scale, y - 55 * scale, x, y - 70 * scale, x + 22 * scale, y - 55 * scale]).fill(darkWood);

  // Ladder
  g.rect(x - 2 * scale, y - 40 * scale, 4 * scale, 40 * scale).fill(woodColor);
  for (let i = 0; i < 6; i++) {
    g.rect(x - 5 * scale, y - 8 * scale - i * 7 * scale, 10 * scale, 2 * scale).fill(woodColor);
  }
};

// ==================== NEW DESERT STRUCTURES ====================

const sphinx: StructureDrawFunction = (g, x, y, scale) => {
  const stoneColor = 0xd4a853;
  const shadowColor = 0xb8923a;

  // Body (lion shape)
  g.ellipse(x, y - 10 * scale, 40 * scale, 15 * scale).fill(stoneColor);

  // Front paws
  g.rect(x + 25 * scale, y - 12 * scale, 20 * scale, 12 * scale).fill(stoneColor);

  // Head
  g.circle(x + 35 * scale, y - 30 * scale, 15 * scale).fill(stoneColor);

  // Headdress (nemes)
  g.poly([x + 20 * scale, y - 35 * scale, x + 35 * scale, y - 50 * scale, x + 50 * scale, y - 35 * scale]).fill(shadowColor);
  g.rect(x + 22 * scale, y - 35 * scale, 8 * scale, 25 * scale).fill(shadowColor);
  g.rect(x + 42 * scale, y - 35 * scale, 8 * scale, 25 * scale).fill(shadowColor);

  // Face details
  g.ellipse(x + 35 * scale, y - 28 * scale, 3 * scale, 2 * scale).fill(0x1a1a1a);
  g.beginPath();
  g.moveTo(x + 32 * scale, y - 22 * scale);
  g.lineTo(x + 38 * scale, y - 22 * scale);
  g.stroke({ color: 0x1a1a1a, width: 1.5 * scale });
};

const merchant_caravan: StructureDrawFunction = (g, x, y, scale) => {
  const tentColor = 0xdeb887;
  const carpetColor = 0x8b0000;

  // Main tent
  g.poly([x - 30 * scale, y, x - 20 * scale, y - 30 * scale, x + 20 * scale, y - 30 * scale, x + 30 * scale, y]).fill(tentColor);

  // Tent opening
  g.poly([x - 5 * scale, y, x, y - 20 * scale, x + 5 * scale, y]).fill(0x1a1a1a);

  // Carpet in front
  g.ellipse(x, y + 5 * scale, 25 * scale, 8 * scale).fill(carpetColor);

  // Goods/crates
  g.rect(x - 40 * scale, y - 10 * scale, 12 * scale, 10 * scale).fill(0x8b4513);
  g.rect(x + 35 * scale, y - 8 * scale, 10 * scale, 8 * scale).fill(0x8b4513);

  // Camel silhouette
  g.ellipse(x + 50 * scale, y - 15 * scale, 12 * scale, 8 * scale).fill(0xc9923a);
  g.circle(x + 60 * scale, y - 28 * scale, 6 * scale).fill(0xc9923a);
  g.rect(x + 45 * scale, y - 10 * scale, 4 * scale, 10 * scale).fill(0xc9923a);
  g.rect(x + 52 * scale, y - 10 * scale, 4 * scale, 10 * scale).fill(0xc9923a);
};

// ==================== NEW SNOW STRUCTURES ====================

const frost_giant_bones: StructureDrawFunction = (g, x, y, scale) => {
  const boneColor = 0xf5f5dc;
  const iceColor = 0xadd8e6;

  // Massive ribcage
  for (let i = 0; i < 5; i++) {
    const ribAngle = -0.3 + i * 0.15;
    g.beginPath();
    g.arc(x + i * 12 * scale - 24 * scale, y - 10 * scale, 35 * scale, Math.PI + ribAngle, -ribAngle);
    g.stroke({ color: boneColor, width: 4 * scale });
  }

  // Spine
  g.rect(x - 30 * scale, y - 15 * scale, 60 * scale, 8 * scale).fill(boneColor);

  // Skull
  g.ellipse(x - 45 * scale, y - 20 * scale, 20 * scale, 15 * scale).fill(boneColor);
  g.circle(x - 50 * scale, y - 22 * scale, 4 * scale).fill(iceColor);
  g.circle(x - 40 * scale, y - 22 * scale, 4 * scale).fill(iceColor);

  // Ice formations on bones
  g.poly([x, y - 45 * scale, x - 5 * scale, y - 30 * scale, x + 5 * scale, y - 30 * scale]).fill(iceColor);
  g.poly([x + 20 * scale, y - 40 * scale, x + 17 * scale, y - 28 * scale, x + 23 * scale, y - 28 * scale]).fill(iceColor);
};

const ski_lodge: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x8b4513;
  const snowColor = 0xffffff;
  const windowColor = 0xffd700;

  // Main building
  g.rect(x - 35 * scale, y - 35 * scale, 70 * scale, 35 * scale).fill(woodColor);

  // A-frame roof
  g.poly([x - 40 * scale, y - 35 * scale, x, y - 65 * scale, x + 40 * scale, y - 35 * scale]).fill(0x5d4037);

  // Snow on roof
  g.poly([x - 38 * scale, y - 37 * scale, x, y - 62 * scale, x + 38 * scale, y - 37 * scale]).fill(snowColor);

  // Large windows
  g.rect(x - 25 * scale, y - 28 * scale, 15 * scale, 12 * scale).fill(windowColor);
  g.rect(x + 10 * scale, y - 28 * scale, 15 * scale, 12 * scale).fill(windowColor);

  // Door
  g.rect(x - 6 * scale, y - 22 * scale, 12 * scale, 22 * scale).fill(0x3e2723);

  // Smoke from chimney
  g.rect(x + 20 * scale, y - 55 * scale, 8 * scale, 15 * scale).fill(0x696969);
  g.circle(x + 24 * scale, y - 60 * scale, 4 * scale).fill({ color: 0x808080, alpha: 0.4 });

  // Skis leaning on wall
  g.beginPath();
  g.moveTo(x + 32 * scale, y);
  g.lineTo(x + 34 * scale, y - 30 * scale);
  g.moveTo(x + 36 * scale, y);
  g.lineTo(x + 38 * scale, y - 30 * scale);
  g.stroke({ color: 0x4169e1, width: 2 * scale });
};

// ==================== NEW SWAMP STRUCTURES ====================

const fisherman_dock: StructureDrawFunction = (g, x, y, scale) => {
  const woodColor = 0x5d4037;
  const waterColor = 0x3d5c5c;

  // Murky water
  g.ellipse(x, y + 5 * scale, 45 * scale, 12 * scale).fill(waterColor);

  // Dock planks
  g.rect(x - 8 * scale, y - 5 * scale, 50 * scale, 10 * scale).fill(woodColor);

  // Support posts
  g.rect(x - 5 * scale, y - 5 * scale, 4 * scale, 15 * scale).fill(0x4e342e);
  g.rect(x + 30 * scale, y - 5 * scale, 4 * scale, 15 * scale).fill(0x4e342e);

  // Fishing pole
  g.beginPath();
  g.moveTo(x + 35 * scale, y - 5 * scale);
  g.lineTo(x + 50 * scale, y - 25 * scale);
  g.lineTo(x + 55 * scale, y + 5 * scale);
  g.stroke({ color: 0x8b7355, width: 1.5 * scale });

  // Small boat
  g.ellipse(x - 25 * scale, y + 3 * scale, 15 * scale, 5 * scale).fill(0x6d4c41);

  // Lantern post
  g.rect(x + 38 * scale, y - 25 * scale, 3 * scale, 20 * scale).fill(woodColor);
  g.circle(x + 39.5 * scale, y - 28 * scale, 4 * scale).fill(0xffa500);
};

const hermit_cave: StructureDrawFunction = (g, x, y, scale) => {
  const rockColor = 0x4a5d4a;
  const darkColor = 0x1a1a1a;
  const mossColor = 0x228b22;

  // Cave mound
  g.ellipse(x, y - 15 * scale, 40 * scale, 25 * scale).fill(rockColor);

  // Cave entrance
  g.ellipse(x - 5 * scale, y - 8 * scale, 15 * scale, 18 * scale).fill(darkColor);

  // Moss and vines
  g.beginPath();
  g.arc(x - 20 * scale, y - 25 * scale, 12 * scale, 0, Math.PI);
  g.stroke({ color: mossColor, width: 3 * scale });
  g.beginPath();
  g.moveTo(x + 15 * scale, y - 30 * scale);
  g.quadraticCurveTo(x + 20 * scale, y - 15 * scale, x + 18 * scale, y);
  g.stroke({ color: mossColor, width: 2 * scale });

  // Hanging lantern at entrance
  g.circle(x - 18 * scale, y - 10 * scale, 3 * scale).fill(0xffa500);

  // Smoke wisps
  g.circle(x - 5 * scale, y - 35 * scale, 3 * scale).fill({ color: 0x808080, alpha: 0.4 });
  g.circle(x - 8 * scale, y - 42 * scale, 4 * scale).fill({ color: 0x808080, alpha: 0.3 });
};

// ==================== NEW VOLCANIC STRUCTURES ====================

const obsidian_throne: StructureDrawFunction = (g, x, y, scale) => {
  const obsidianColor = 0x1a1a2e;
  const glowColor = 0xff4500;

  // Base platform
  g.rect(x - 30 * scale, y - 10 * scale, 60 * scale, 10 * scale).fill(obsidianColor);

  // Seat
  g.rect(x - 20 * scale, y - 30 * scale, 40 * scale, 20 * scale).fill(obsidianColor);

  // Back rest (tall, jagged)
  g.poly([
    x - 22 * scale, y - 30 * scale,
    x - 25 * scale, y - 70 * scale,
    x - 10 * scale, y - 55 * scale,
    x, y - 75 * scale,
    x + 10 * scale, y - 55 * scale,
    x + 25 * scale, y - 70 * scale,
    x + 22 * scale, y - 30 * scale
  ]).fill(obsidianColor);

  // Glowing runes
  g.circle(x - 15 * scale, y - 50 * scale, 3 * scale).fill(glowColor);
  g.circle(x + 15 * scale, y - 50 * scale, 3 * scale).fill(glowColor);
  g.circle(x, y - 60 * scale, 4 * scale).fill(glowColor);

  // Armrests
  g.rect(x - 25 * scale, y - 35 * scale, 8 * scale, 5 * scale).fill(obsidianColor);
  g.rect(x + 17 * scale, y - 35 * scale, 8 * scale, 5 * scale).fill(obsidianColor);
};

const lava_waterfall: StructureDrawFunction = (g, x, y, scale) => {
  const rockColor = 0x2a2a2a;
  const lavaColor = 0xff4500;
  const glowColor = 0xffff00;

  // Cliff face
  g.poly([
    x - 30 * scale, y,
    x - 35 * scale, y - 60 * scale,
    x + 35 * scale, y - 60 * scale,
    x + 30 * scale, y
  ]).fill(rockColor);

  // Lava flow
  g.poly([
    x - 8 * scale, y - 60 * scale,
    x - 12 * scale, y - 30 * scale,
    x - 5 * scale, y,
    x + 5 * scale, y,
    x + 12 * scale, y - 30 * scale,
    x + 8 * scale, y - 60 * scale
  ]).fill(lavaColor);

  // Hot center glow
  g.poly([
    x - 3 * scale, y - 55 * scale,
    x - 5 * scale, y - 25 * scale,
    x - 2 * scale, y,
    x + 2 * scale, y,
    x + 5 * scale, y - 25 * scale,
    x + 3 * scale, y - 55 * scale
  ]).fill(glowColor);

  // Lava pool at bottom
  g.ellipse(x, y + 5 * scale, 20 * scale, 8 * scale).fill(lavaColor);
  g.ellipse(x, y + 5 * scale, 12 * scale, 5 * scale).fill(glowColor);

  // Steam/smoke
  g.circle(x - 15 * scale, y - 5 * scale, 5 * scale).fill({ color: 0x808080, alpha: 0.4 });
  g.circle(x + 18 * scale, y - 8 * scale, 6 * scale).fill({ color: 0x808080, alpha: 0.3 });
};

// ==================== PATTERN REGISTRY ====================

export const STRUCTURE_PATTERNS: Record<StructureType, StructureDrawFunction> = {
  // Grassland
  cottage,
  windmill,
  well,
  barn,
  chapel,
  market_stall,
  // Forest
  treehouse,
  ranger_cabin,
  druid_circle,
  hunting_lodge,
  moonwell,
  archer_tower,
  // Desert
  pyramid,
  oasis_tent,
  sand_castle,
  buried_ruins,
  sphinx,
  merchant_caravan,
  // Snow
  igloo,
  ice_tower,
  frozen_shrine,
  nordic_hall,
  frost_giant_bones,
  ski_lodge,
  // Swamp
  witch_hut,
  sunken_temple,
  bog_bridge,
  spirit_shrine,
  fisherman_dock,
  hermit_cave,
  // Volcanic
  forge,
  lava_bridge,
  demon_gate,
  fire_temple,
  obsidian_throne,
  lava_waterfall,
};

/**
 * Draw a structure at the specified position
 */
export function drawStructure(
  graphics: Graphics,
  type: StructureType,
  x: number,
  y: number,
  scale: number = 1
): void {
  const pattern = STRUCTURE_PATTERNS[type];
  if (pattern) {
    pattern(graphics, x, y, scale);
  }
}
