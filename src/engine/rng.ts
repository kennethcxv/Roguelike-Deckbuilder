/**
 * Deterministic, seedable PRNG. ALL randomness in the game flows through this so a
 * seed reproduces a run exactly. State is a single uint32 so it serializes trivially
 * for mid-run save/resume.
 *
 * Algorithm: mulberry32 (fast, good distribution for game use). Stream derivation uses
 * a cyrb53-style string hash so independent, reproducible sub-streams can be created
 * from a master seed + label regardless of call order.
 */

/** Hash a string into a uint32 seed, optionally salted with a numeric seed. */
export function hashSeed(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) >>> 0;
}

/** Convert any seed string (e.g. a daily date or a custom seed) into a master seed. */
export function seedFromString(input: string): number {
  return hashSeed(input.trim().toLowerCase() || 'reasonable-doubt');
}

/** Derive an independent child seed from a parent seed + label. */
export function deriveSeed(seed: number, label: string): number {
  return hashSeed(label, seed >>> 0) >>> 0;
}

export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  /** Reconstruct an Rng from a previously serialized state. */
  static fromState(state: number): Rng {
    return new Rng(state);
  }

  /** Create an independent named stream from a master seed. */
  static stream(masterSeed: number, label: string): Rng {
    return new Rng(deriveSeed(masterSeed, label));
  }

  /** Current serializable internal state. */
  get state(): number {
    return this.s >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  /** Integer in [minInclusive, maxInclusive]. */
  range(minInclusive: number, maxInclusive: number): number {
    if (maxInclusive < minInclusive) return minInclusive;
    return minInclusive + this.int(maxInclusive - minInclusive + 1);
  }

  /** Coin flip with the given probability of true. */
  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /** Pick a uniformly random element. Throws on empty input. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick: empty array');
    const item = arr[this.int(arr.length)];
    return item as T;
  }

  /** Return a new array shuffled with Fisher–Yates (does not mutate input). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const a = out[i] as T;
      const b = out[j] as T;
      out[i] = b;
      out[j] = a;
    }
    return out;
  }

  /** Pick from weighted entries. Throws on empty / non-positive total weight. */
  weighted<T>(entries: ReadonlyArray<{ value: T; weight: number }>): T {
    let total = 0;
    for (const e of entries) total += Math.max(0, e.weight);
    if (total <= 0) throw new Error('Rng.weighted: total weight must be positive');
    let roll = this.next() * total;
    for (const e of entries) {
      roll -= Math.max(0, e.weight);
      if (roll < 0) return e.value;
    }
    return entries[entries.length - 1]!.value;
  }

  /** Sample up to n distinct elements without replacement (new array). */
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, Math.max(0, Math.min(n, arr.length)));
  }

  /** Derive an independent child stream from this generator's current state. */
  fork(label: string): Rng {
    return new Rng(deriveSeed(this.s, label));
  }
}
