import { describe, it, expect } from 'vitest';
import { simulateTrial } from './runTrial';
import { GreedyStrategy } from './strategy';
import { deckFromStarting } from './util';
import { computeTrialReport } from './report';
import { DB } from '../content';

function trial(seed: number, enemyId: string, characterId = 'litigator') {
  const ch = DB.getCharacter(characterId);
  return simulateTrial({
    content: DB,
    enemy: DB.getEnemy(enemyId),
    deck: deckFromStarting(ch),
    precedents: ch.startingPrecedents,
    composure: ch.startingComposure,
    seed,
    strategy: new GreedyStrategy(),
  });
}

describe('balance sim', () => {
  it('is deterministic for a fixed seed', () => {
    const a = trial(999, 'a1.shoplifting');
    const b = trial(999, 'a1.shoplifting');
    expect(a).toEqual(b);
  });

  it('the Litigator wins some act-1 trials with the starting deck', () => {
    let wins = 0;
    for (let i = 0; i < 40; i++) if (trial(i + 1, 'a1.shoplifting').win) wins += 1;
    expect(wins).toBeGreaterThan(0);
  });

  it('produces a structured report for every character', () => {
    const report = computeTrialReport({ runs: 8, seed: 5 });
    expect(report.characters).toHaveLength(DB.allCharacters().length);
    for (const c of report.characters) {
      expect(c.results.length).toBe(DB.allEnemies().length);
      expect(c.act1WinRate).toBeGreaterThanOrEqual(0);
      expect(c.act1WinRate).toBeLessThanOrEqual(1);
    }
  });
});
