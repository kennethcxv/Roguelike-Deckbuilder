import { describe, it, expect } from 'vitest';
import { DB } from '../content';
import { generateMap, createRun } from '../engine';
import { simulateRun } from './autoRun';

describe('map generation', () => {
  it('is deterministic for a seed', () => {
    const a = generateMap(12345, DB);
    const b = generateMap(12345, DB);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('has three acts each with a boss and connected start nodes', () => {
    const map = generateMap(777, DB);
    expect(map.acts).toHaveLength(3);
    for (const act of map.acts) {
      const boss = act.nodes.find((n) => n.id === act.bossNodeId);
      expect(boss?.type).toBe('boss');
      expect(act.startNodeIds.length).toBeGreaterThan(0);
      // Every start node can reach the boss by following `next`.
      for (const startId of act.startNodeIds) {
        expect(reaches(act.nodes, startId, act.bossNodeId)).toBe(true);
      }
      // Every trial/elite node has an enemy assigned.
      for (const n of act.nodes) {
        if (n.type === 'trial' || n.type === 'elite' || n.type === 'boss') {
          expect(n.enemyId).toBeDefined();
        }
      }
    }
  });
});

function reaches(nodes: { id: string; next: string[] }[], from: string, to: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === to) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = byId.get(id);
    if (n) stack.push(...n.next);
  }
  return false;
}

describe('run lifecycle', () => {
  it('createRun is deterministic for a seed label', () => {
    const a = createRun({ content: DB, seedLabel: 'hello', mode: 'standard', characterId: 'litigator', appeal: 0 });
    const b = createRun({ content: DB, seedLabel: 'hello', mode: 'standard', characterId: 'litigator', appeal: 0 });
    expect(a.seed).toBe(b.seed);
    expect(a.deck.map((c) => c.defId)).toEqual(b.deck.map((c) => c.defId));
    expect(JSON.stringify(a.map)).toBe(JSON.stringify(b.map));
  });

  it('a full auto-run terminates with a definite result', () => {
    const r = simulateRun({ content: DB, characterId: 'litigator', appeal: 0, seedLabel: 'run-1' });
    expect(typeof r.win).toBe('boolean');
    expect(r.actReached).toBeGreaterThanOrEqual(1);
  });

  it('the same seed label produces an identical run outcome', () => {
    const a = simulateRun({ content: DB, characterId: 'fixer', appeal: 0, seedLabel: 'determinism' });
    const b = simulateRun({ content: DB, characterId: 'fixer', appeal: 0, seedLabel: 'determinism' });
    expect(a).toEqual(b);
  });

  it('the Litigator wins some full runs at Appeal 0', () => {
    let wins = 0;
    for (let i = 0; i < 24; i++) {
      const r = simulateRun({
        content: DB,
        characterId: 'litigator',
        appeal: 0,
        seedLabel: `win-check-${i}`,
      });
      if (r.win) wins += 1;
    }
    expect(wins).toBeGreaterThan(0);
  });
});
