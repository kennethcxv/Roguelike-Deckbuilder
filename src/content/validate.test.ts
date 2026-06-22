import { describe, it, expect } from 'vitest';
import { validateContent } from './schema';
import {
  ALL_CARDS,
  ALL_PRECEDENTS,
  ALL_ENEMIES,
  ALL_CHARACTERS,
  ALL_EVENTS,
  ALL_MOTIONS,
  KEYWORDS,
  DB,
} from './index';

const bundle = {
  cards: ALL_CARDS,
  precedents: ALL_PRECEDENTS,
  enemies: ALL_ENEMIES,
  characters: ALL_CHARACTERS,
  keywords: KEYWORDS,
  events: ALL_EVENTS,
  motions: ALL_MOTIONS,
};

describe('content validation', () => {
  it('produces no validation errors', () => {
    const errors = validateContent(bundle).filter((i) => i.kind === 'error');
    expect(errors).toEqual([]);
  });

  it('resolves every card referenced by a starting deck', () => {
    for (const c of ALL_CHARACTERS) {
      for (const sc of c.startingDeck) {
        expect(DB.getCardOrNull(sc.cardId)).toBeDefined();
      }
      for (const pid of c.startingPrecedents) {
        expect(DB.getPrecedentOrNull(pid)).toBeDefined();
      }
    }
  });

  it('has at least one boss per act', () => {
    for (const act of [1, 2, 3]) {
      expect(DB.boss(act)).toBeDefined();
    }
  });

  it('meets the content targets', () => {
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(70);
    expect(ALL_PRECEDENTS.length).toBeGreaterThanOrEqual(45);
    expect(ALL_CHARACTERS.length).toBeGreaterThanOrEqual(3);
    expect(ALL_EVENTS.length).toBeGreaterThanOrEqual(15);
    const eliteBoss = ALL_ENEMIES.filter((e) => e.kind === 'elite' || e.kind === 'boss');
    expect(eliteBoss.length).toBeGreaterThanOrEqual(12);
    expect(ALL_MOTIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('every card belongs to a known character or neutral', () => {
    const charIds = new Set(ALL_CHARACTERS.map((c) => c.id));
    for (const c of ALL_CARDS) {
      expect(c.character === 'neutral' || charIds.has(c.character)).toBe(true);
    }
  });
});
