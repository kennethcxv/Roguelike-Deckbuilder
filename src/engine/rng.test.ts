import { describe, it, expect } from 'vitest';
import { Rng, hashSeed, seedFromString, deriveSeed } from './rng';

describe('Rng determinism', () => {
  it('produces identical sequences for the same seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 20 }, (_, i) => new Rng(1).next() + i);
    const r1 = new Rng(1);
    const r2 = new Rng(2);
    const s1 = Array.from({ length: 20 }, () => r1.next());
    const s2 = Array.from({ length: 20 }, () => r2.next());
    expect(s1).not.toEqual(s2);
    expect(a.length).toBe(20);
  });

  it('serializes and restores state exactly', () => {
    const r = new Rng(999);
    for (let i = 0; i < 7; i++) r.next();
    const saved = r.state;
    const expected = Array.from({ length: 10 }, () => r.next());
    const restored = Rng.fromState(saved);
    const actual = Array.from({ length: 10 }, () => restored.next());
    expect(actual).toEqual(expected);
  });

  it('stays within bounds for int/range', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const n = r.int(6);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(6);
      const m = r.range(3, 9);
      expect(m).toBeGreaterThanOrEqual(3);
      expect(m).toBeLessThanOrEqual(9);
    }
  });

  it('int(0) and range with inverted bounds are safe', () => {
    const r = new Rng(3);
    expect(r.int(0)).toBe(0);
    expect(r.range(5, 2)).toBe(5);
  });
});

describe('Rng.shuffle', () => {
  it('is a permutation and is deterministic', () => {
    const src = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const a = new Rng(42).shuffle(src);
    const b = new Rng(42).shuffle(src);
    expect(a).toEqual(b);
    expect([...a].sort((x, y) => x - y)).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // input not mutated
  });
});

describe('Rng.weighted', () => {
  it('respects weights statistically', () => {
    const r = new Rng(101);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 4000; i++) {
      const v = r.weighted([
        { value: 'a' as const, weight: 3 },
        { value: 'b' as const, weight: 1 },
      ]);
      counts[v]++;
    }
    // ~75/25 split; allow generous tolerance
    expect(counts.a).toBeGreaterThan(counts.b * 2);
  });

  it('throws on non-positive total weight', () => {
    const r = new Rng(1);
    expect(() => r.weighted([{ value: 'x', weight: 0 }])).toThrow();
    expect(() => r.weighted([])).toThrow();
  });
});

describe('Rng.pick / sample', () => {
  it('pick throws on empty and returns a member otherwise', () => {
    const r = new Rng(5);
    expect(() => r.pick([])).toThrow();
    const arr = ['x', 'y', 'z'];
    for (let i = 0; i < 50; i++) expect(arr).toContain(r.pick(arr));
  });

  it('sample returns distinct elements, capped at array length', () => {
    const r = new Rng(8);
    const arr = [1, 2, 3, 4, 5];
    const s = r.sample(arr, 3);
    expect(s).toHaveLength(3);
    expect(new Set(s).size).toBe(3);
    expect(r.sample(arr, 99)).toHaveLength(5);
  });
});

describe('seed helpers', () => {
  it('hashSeed is stable and salt-sensitive', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'));
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
    expect(hashSeed('abc', 1)).not.toBe(hashSeed('abc', 2));
  });

  it('seedFromString normalizes whitespace/case', () => {
    expect(seedFromString('  Hello ')).toBe(seedFromString('hello'));
  });

  it('derived streams are independent and reproducible', () => {
    const master = seedFromString('run-seed');
    const map1 = Rng.stream(master, 'map');
    const map2 = Rng.stream(master, 'map');
    const combat = Rng.stream(master, 'combat:node-3');
    expect(map1.next()).toBe(map2.next());
    const m = Rng.stream(master, 'map').next();
    const c = Rng.stream(master, 'combat:node-3').next();
    expect(m).not.toBe(c);
    expect(deriveSeed(master, 'map')).not.toBe(deriveSeed(master, 'combat:node-3'));
    expect(combat.state).toBeTypeOf('number');
  });
});
