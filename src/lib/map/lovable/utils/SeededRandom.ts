/**
 * Seeded Random Number Generator
 * Creates deterministic random numbers based on a seed value
 * Ensures the same world coordinates always generate the same content
 */

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   * Uses Mulberry32 algorithm for good distribution
   */
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Get random integer in range [min, max]
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Get random float in range [min, max]
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Get random boolean with given probability
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Pick random element from array
   */
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  /**
   * Shuffle array in place (Fisher-Yates)
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

/**
 * Create a seeded RNG from world coordinates
 */
export function createSeededRandom(x: number, y: number, salt: number = 0): SeededRandom {
  const seed = hashCoords(x, y, salt);
  return new SeededRandom(seed);
}

/**
 * Hash two coordinates into a single seed value
 * Uses modified FNV-1a hash for good distribution
 */
export function hashCoords(x: number, y: number, salt: number = 0): number {
  let hash = 2166136261 ^ salt;
  
  // Mix in x coordinate
  hash ^= Math.floor(x) & 0xffffffff;
  hash = Math.imul(hash, 16777619);
  
  // Mix in y coordinate
  hash ^= Math.floor(y) & 0xffffffff;
  hash = Math.imul(hash, 16777619);
  
  // Final mixing
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  
  return hash >>> 0; // Ensure positive
}

/**
 * Quick hash for a single value
 */
export function hash(value: number): number {
  let h = value ^ 0x85ebca6b;
  h = Math.imul(h, 0xcc9e2d51);
  h = Math.imul((h << 15) | (h >>> 17), 0x1b873593);
  return h >>> 0;
}
