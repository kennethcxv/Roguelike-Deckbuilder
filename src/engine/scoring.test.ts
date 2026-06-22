import { describe, it, expect } from 'vitest';
import { Rng } from './rng';
import { scoreArgument } from './scoring';
import { getStatus } from './state';
import { KW } from './keywords';
import type { CardDef, PrecedentDef } from './types';
import { makeContent, makeEncounter, stageArgument } from '../test/engineKit';

function card(over: Partial<CardDef> & { id: string }): CardDef {
  return {
    name: over.id,
    kind: 'argument',
    category: 'Statement',
    rarity: 'common',
    character: 'neutral',
    focusCost: 1,
    base: 0,
    mult: 0,
    keywords: [],
    tags: [],
    text: '',
    ...over,
  };
}

const CARDS: CardDef[] = [
  card({ id: 'stmt', base: 10 }),
  card({ id: 'rhet', category: 'Rhetoric', mult: 2 }),
  card({ id: 'hearsay', base: 20, keywords: [KW.Hearsay] }),
  card({ id: 'lead', base: 5, keywords: [KW.Leading] }),
  card({ id: 'retrig', base: 4, onScore: [{ op: 'retrigger', times: 1 }] }),
  card({ id: 'evcard', base: 0, onScore: [{ op: 'gainEvidence', amount: 2 }] }),
];

describe('scoreArgument basics', () => {
  it('computes round(base × mult) and adds it to the encounter', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter();
    stageArgument(enc, ['stmt', 'rhet']);
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.base).toBe(10);
    expect(res.mult).toBe(3); // 1 + 2
    expect(res.doubt).toBe(30);
    expect(enc.doubt).toBe(30);
    expect(res.steps[0]!.kind).toBe('start');
    expect(res.steps.at(-1)!.kind).toBe('final');
  });

  it('is deterministic for the same inputs', () => {
    const content = makeContent(CARDS);
    const make = () => {
      const enc = makeEncounter();
      stageArgument(enc, ['stmt', 'rhet', 'retrig']);
      return scoreArgument(enc, content, new Rng(99));
    };
    expect(make().doubt).toBe(make().doubt);
  });
});

describe('keyword interactions during scoring', () => {
  it('Sustained adds mult at argument start and is consumed', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter();
    enc.player.statuses[KW.Sustained] = 2;
    stageArgument(enc, ['stmt']);
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.mult).toBe(3); // 1 + 2 sustained
    expect(res.doubt).toBe(30);
    expect(getStatus(enc.player.statuses, KW.Sustained)).toBe(0);
  });

  it('Hearsay scores no base without Evidence, full base with it', () => {
    const content = makeContent(CARDS);
    const dry = makeEncounter();
    stageArgument(dry, ['hearsay']);
    expect(scoreArgument(dry, content, new Rng(1)).doubt).toBe(0);

    const wet = makeEncounter();
    wet.player.evidence = 1;
    stageArgument(wet, ['hearsay']);
    expect(scoreArgument(wet, content, new Rng(1)).doubt).toBe(20);
  });

  it('Leading grants base to the next scored card', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter();
    stageArgument(enc, ['lead', 'stmt']);
    const res = scoreArgument(enc, content, new Rng(1));
    // lead 5 + leading bonus 3 + stmt 10 = 18
    expect(res.base).toBe(18);
    expect(res.doubt).toBe(18);
  });

  it('retrigger re-scores a card', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter();
    stageArgument(enc, ['retrig']);
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.base).toBe(8); // 4 scored twice
  });

  it('an Evidence-granting card enables a later Hearsay card', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter();
    stageArgument(enc, ['evcard', 'hearsay']);
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.base).toBe(20); // evcard grants 2 Evidence, hearsay then counts
  });
});

describe('boss mult cap', () => {
  it('caps mult and records a cap step', () => {
    const content = makeContent(CARDS);
    const enc = makeEncounter({ rules: { multCap: 4 } });
    stageArgument(enc, ['stmt', 'rhet', 'rhet', 'rhet']); // mult would be 7
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.mult).toBe(4);
    expect(res.doubt).toBe(40);
    expect(res.steps.some((s) => s.kind === 'cap')).toBe(true);
  });
});

describe('precedent hooks during scoring', () => {
  it('onCardScored fires per scored card', () => {
    const prec: PrecedentDef = {
      id: 'scholar',
      name: 'Scholarly Citation',
      rarity: 'common',
      text: '+1 base per card scored',
      hooks: { onCardScored: { effects: [{ op: 'addBase', amount: 1 }] } },
    };
    const content = makeContent(CARDS, [prec]);
    const enc = makeEncounter({ precedents: ['scholar'] });
    stageArgument(enc, ['stmt', 'stmt', 'stmt']);
    const res = scoreArgument(enc, content, new Rng(1));
    expect(res.base).toBe(33); // 30 intrinsic + 3 from precedent
  });

  it('onArgumentEnd reactions run after the verdict (e.g. gain Retainer)', () => {
    const prec: PrecedentDef = {
      id: 'contingency',
      name: 'Contingency Fee',
      rarity: 'common',
      text: 'Gain 5 Retainer after each argument',
      hooks: { onArgumentEnd: { effects: [{ op: 'gainRetainer', amount: 5 }] } },
    };
    const content = makeContent(CARDS, [prec]);
    const enc = makeEncounter({ precedents: ['contingency'] });
    stageArgument(enc, ['stmt']);
    scoreArgument(enc, content, new Rng(1));
    expect(enc.retainerEarned).toBe(5);
  });
});
