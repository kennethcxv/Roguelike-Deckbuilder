import { describe, it, expect } from 'vitest';
import { applyRoundStartKeywords, tickEndOfRound, KW } from './keywords';
import { getStatus } from './state';
import type { KeywordDef } from './types';
import { makeContent, makeEncounter, CANONICAL_KEYWORDS } from '../test/engineKit';

describe('applyRoundStartKeywords', () => {
  it('Rattled saps Focus down to zero', () => {
    const enc = makeEncounter();
    enc.player.focus = 3;
    enc.player.statuses[KW.Rattled] = 2;
    applyRoundStartKeywords(enc);
    expect(enc.player.focus).toBe(1);
  });

  it('Contempt feeds the prosecution Conviction', () => {
    const enc = makeEncounter();
    enc.player.statuses[KW.Contempt] = 3;
    applyRoundStartKeywords(enc);
    expect(enc.prosecution.conviction).toBe(3);
  });
});

describe('tickEndOfRound', () => {
  it('decays decaying statuses and leaves persistent ones', () => {
    const content = makeContent([], []);
    const bag = { [KW.Rattled]: 2, [KW.Sustained]: 3 };
    tickEndOfRound(bag, content);
    expect(getStatus(bag, KW.Rattled)).toBe(1);
    expect(getStatus(bag, KW.Sustained)).toBe(3); // does not decay
  });

  it('clears clears-end-of-round statuses entirely', () => {
    const custom: KeywordDef[] = [
      ...CANONICAL_KEYWORDS,
      { id: 'flash', name: 'Flash', description: '', tone: 'good', clearsEndOfRound: true },
    ];
    const content = makeContent([], [], custom);
    const bag = { flash: 5 };
    tickEndOfRound(bag, content);
    expect(getStatus(bag, 'flash')).toBe(0);
  });
});
