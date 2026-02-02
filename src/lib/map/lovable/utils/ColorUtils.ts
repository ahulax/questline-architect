/**
 * Color Utilities for Procedural Generation
 * Handles color interpolation and conversion
 */

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Convert hex color number to RGB
 */
export function hexToRgb(hex: number): RGB {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

/**
 * Convert RGB to hex color number
 */
export function rgbToHex(rgb: RGB): number {
  return ((rgb.r & 0xff) << 16) | ((rgb.g & 0xff) << 8) | (rgb.b & 0xff);
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;
  const hNorm = h / 360;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between two hex colors using HSL space for natural gradients
 */
export function lerpColorHSL(color1: number, color2: number, t: number): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  const hsl1 = rgbToHsl(rgb1);
  const hsl2 = rgbToHsl(rgb2);

  // Handle hue wrapping for shortest path
  let h1 = hsl1.h;
  let h2 = hsl2.h;
  const hDiff = h2 - h1;
  if (Math.abs(hDiff) > 180) {
    if (hDiff > 0) {
      h1 += 360;
    } else {
      h2 += 360;
    }
  }

  const result: HSL = {
    h: ((lerp(h1, h2, t) % 360) + 360) % 360,
    s: lerp(hsl1.s, hsl2.s, t),
    l: lerp(hsl1.l, hsl2.l, t),
  };

  return rgbToHex(hslToRgb(result));
}

/**
 * Simple RGB interpolation (faster but less natural)
 */
export function lerpColorRGB(color1: number, color2: number, t: number): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  return rgbToHex({
    r: Math.round(lerp(rgb1.r, rgb2.r, t)),
    g: Math.round(lerp(rgb1.g, rgb2.g, t)),
    b: Math.round(lerp(rgb1.b, rgb2.b, t)),
  });
}

/**
 * Darken a color by a factor (0-1)
 */
export function darkenColor(color: number, factor: number): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.max(0, hsl.l * (1 - factor));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Lighten a color by a factor (0-1)
 */
export function lightenColor(color: number, factor: number): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  hsl.l = Math.min(1, hsl.l + (1 - hsl.l) * factor);
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Adjust saturation of a color
 */
export function saturateColor(color: number, factor: number): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  hsl.s = Math.min(1, Math.max(0, hsl.s * factor));
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Add noise variation to a color
 */
export function varyColor(color: number, noiseValue: number, variance: number = 0.1): number {
  const rgb = hexToRgb(color);
  const hsl = rgbToHsl(rgb);
  
  // Vary lightness based on noise
  const lVariance = (noiseValue - 0.5) * 2 * variance;
  hsl.l = Math.min(1, Math.max(0, hsl.l + lVariance));
  
  // Slight saturation variation
  const sVariance = (noiseValue - 0.5) * variance * 0.5;
  hsl.s = Math.min(1, Math.max(0, hsl.s + sVariance));
  
  return rgbToHex(hslToRgb(hsl));
}
