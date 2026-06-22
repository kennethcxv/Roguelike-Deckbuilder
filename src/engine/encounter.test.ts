import { describe, it, expect } from 'vitest';
import { Rng } from './rng';
import {
  createEncounter,
  toggleArgumentCard,
  presentArgument,
  playActionCard,
  endTurn,
} from './encounter';
import { makeCardInstance } from './state';
import type { CardDef, EnemyDef } from './types';
import { makeContent } from '../test/engineKit';

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
  card({ id: 'big', base: 50 }),
  card({ id: 'small', base: 10 }),
  card({ id: 'obj', kind: 'action', category: 'Objection', onPlay: [{ op: 'reduceConviction', amount: 30 }] }),
];

function enemy(over: Partial<EnemyDef> & { id: string }): EnemyDef {
  return {
    name: over.id,
    kind: 'trial',
    act: 1,
    baseDoubtTarget: 40,
    targetRampPerRound: 0,
    maxRounds: 5,
    baseConvictionPerRound: 5,
    intents: [{ weight: 1, kind: 'conviction', label: 'Press', value: 5 }],
    ...over,
  };
}

function deckOf(ids: string[]) {
  return ids.map((id) => makeCardInstance(id));
}

describe('createEncounter', () => {
  it('sets up piles, draws a hand, and telegraphs an intent', () => {
    const content = makeContent(CARDS, [], undefined, undefined, [enemy({ id: 'e' })]);
    const enc = createEncounter({
      content,
      rng: new Rng(1),
      enemy: content.getEnemy('e'),
      deck: deckOf(['big', 'small', 'small', 'small', 'small']),
      precedents: [],
      composure: 30,
    });
    expect(enc.round).toBe(1);
    expect(enc.phase).toBe('player');
    expect(enc.player.hand.length).toBeGreaterThan(0);
    expect(enc.prosecution.currentIntent).not.toBeNull();
    expect(enc.doubtTarget).toBe(40);
  });
});

describe('winning a trial', () => {
  it('reaches the target and is marked won', () => {
    const content = makeContent(CARDS, [], undefined, undefined, [enemy({ id: 'e' })]);
    const enc = createEncounter({
      content,
      rng: new Rng(2),
      enemy: content.getEnemy('e'),
      deck: deckOf(['big', 'big', 'big', 'big', 'big']),
      precedents: [],
      composure: 30,
    });
    const big = enc.player.hand[0]!;
    toggleArgumentCard(enc, content, big.uid);
    const res = presentArgument(enc, content, new Rng(2));
    expect(res?.doubt).toBe(50);
    expect(enc.result).toBe('win');
    expect(enc.phase).toBe('won');
  });
});

describe('losing a trial', () => {
  it('loses when conviction reaches composure', () => {
    const content = makeContent(CARDS, [], undefined, undefined, [
      enemy({ id: 'tough', baseDoubtTarget: 9999, baseConvictionPerRound: 20 }),
    ]);
    const enc = createEncounter({
      content,
      rng: new Rng(3),
      enemy: content.getEnemy('tough'),
      deck: deckOf(['small', 'small', 'small', 'small', 'small']),
      precedents: [],
      composure: 12,
    });
    endTurn(enc, content, new Rng(3));
    expect(enc.result).toBe('loss');
    expect(enc.phase).toBe('lost');
  });

  it('an Objection card reduces accrued Conviction to stave off a loss', () => {
    const content = makeContent(CARDS, [], undefined, undefined, [
      // 25 Conviction/round (20 base + 5 intent); composure 30 survives one round, not two.
      enemy({ id: 'tough', baseDoubtTarget: 9999, baseConvictionPerRound: 20 }),
    ]);
    const enc = createEncounter({
      content,
      rng: new Rng(3),
      enemy: content.getEnemy('tough'),
      deck: deckOf(['obj', 'obj', 'obj', 'obj', 'obj']),
      precedents: [],
      composure: 30,
    });
    endTurn(enc, content, new Rng(3)); // round 1: conviction -> 25, survives (25 < 30)
    expect(enc.result).toBeNull();
    expect(enc.prosecution.conviction).toBe(25);

    // Round 2: Object to wipe the accrued Conviction, then survive the next wave.
    const obj = enc.player.hand.find((c) => c.defId === 'obj')!;
    playActionCard(enc, content, new Rng(3), obj.uid);
    expect(enc.prosecution.conviction).toBe(0);
    endTurn(enc, content, new Rng(3)); // +25 -> 25 < 30, survives thanks to the Objection
    expect(enc.result).toBeNull();
  });
});

describe('determinism', () => {
  it('identical seeds and actions produce identical state', () => {
    const run = () => {
      const content = makeContent(CARDS, [], undefined, undefined, [enemy({ id: 'e' })]);
      const enc = createEncounter({
        content,
        rng: new Rng(7),
        enemy: content.getEnemy('e'),
        deck: deckOf(['small', 'small', 'small', 'small', 'big', 'big']),
        precedents: [],
        composure: 30,
      });
      endTurn(enc, content, new Rng(7));
      return { doubt: enc.doubt, conv: enc.prosecution.conviction, round: enc.round };
    };
    expect(run()).toEqual(run());
  });
});
