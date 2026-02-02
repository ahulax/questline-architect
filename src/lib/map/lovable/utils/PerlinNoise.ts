/**
 * Perlin Noise Generator
 * Generates organic noise patterns for biome blending
 */

export class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = Math.random() * 10000) {
    this.permutation = this.generatePermutation(seed);
    this.p = [...this.permutation, ...this.permutation];
  }

  private generatePermutation(seed: number): number[] {
    const perm: number[] = [];
    for (let i = 0; i < 256; i++) {
      perm[i] = i;
    }
    
    // Fisher-Yates shuffle with seed
    let random = seed;
    for (let i = 255; i > 0; i--) {
      random = (random * 16807) % 2147483647;
      const j = random % (i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }
    
    return perm;
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = this.fade(xf);
    const v = this.fade(yf);

    const aa = this.p[this.p[X] + Y];
    const ab = this.p[this.p[X] + Y + 1];
    const ba = this.p[this.p[X + 1] + Y];
    const bb = this.p[this.p[X + 1] + Y + 1];

    const x1 = this.lerp(u, this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf));
    const x2 = this.lerp(u, this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1));

    return (this.lerp(v, x1, x2) + 1) / 2; // Normalize to 0-1
  }

  /**
   * Fractal Brownian Motion - layered noise for more organic patterns
   */
  public fbm(x: number, y: number, octaves: number = 4, lacunarity: number = 2, persistence: number = 0.5): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }
}

/**
 * Generate a noise texture as canvas for shader use
 */
export function generateNoiseCanvas(
  width: number = 512,
  height: number = 512,
  scale: number = 0.02,
  seed?: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const noise = new PerlinNoise(seed);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = noise.fbm(x * scale, y * scale, 4);
      const color = Math.floor(value * 255);
      const idx = (y * width + x) * 4;
      imageData.data[idx] = color;
      imageData.data[idx + 1] = color;
      imageData.data[idx + 2] = color;
      imageData.data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}
