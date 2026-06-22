import { describe, it, expect } from 'vitest';
import { Rng } from './rng';
import { resolveEffects, runPrecedentHooks, drawCards } from './effects';
import { makeCardInstance, getStatus } from './state';
import type { Effect, EffectContext, PrecedentDef, ScoringState } from './types';
import {
  makeContent,
  makeEncounter,
  stageArgument,
} from '../test/engineKit';

function ctxWith(opts: { scoring?: boolean; evidence?: number } = {}): EffectContext {
  const content = makeContent([]);
  const enc = makeEncounter();
  if (opts.evidence !== undefined) enc.player.evidence = opts.evidence;
  const scoring: ScoringState | null =
    opts.scoring === false ? null : { base: 0, mult: 1, steps: [], cardIndex: 0, scoredUids: [] };
  return {
    rng: new Rng(1),
    content,
    enc,
    scoring,
    card: null,
    source: { kind: 'card', label: 'Test' },
    retriggerRequested: 0,
  };
}

function run(ctx: EffectContext, ...effects: Effect[]): void {
  resolveEffects(ctx, effects);
}

describe('scoring effect ops', () => {
  it('addBase / addMult / mulMult mutate scoring and record steps', () => {
    const ctx = ctxWith();
    run(ctx, { op: 'addBase', amount: 10 }, { op: 'addMult', amount: 3 }, { op: 'mulMult', factor: 2 });
    expect(ctx.scoring!.base).toBe(10);
    expect(ctx.scoring!.mult).toBe(8); // (1 + 3) * 2
    expect(ctx.scoring!.steps).toHaveLength(3);
    expect(ctx.scoring!.steps[2]!.multFactor).toBe(2);
  });

  it('addBasePer / addMultPer scale on a source', () => {
    const ctx = ctxWith({ evidence: 4 });
    run(
      ctx,
      { op: 'addBasePer', per: 2, source: { kind: 'evidence' } },
      { op: 'addMultPer', per: 1, source: { kind: 'evidence' } },
    );
    expect(ctx.scoring!.base).toBe(8);
    expect(ctx.scoring!.mult).toBe(5); // 1 + 4
  });

  it('does nothing for base/mult ops outside the cascade', () => {
    const ctx = ctxWith({ scoring: false });
    run(ctx, { op: 'addBase', amount: 10 });
    expect(ctx.scoring).toBeNull();
  });
});

describe('resource effect ops', () => {
  it('evidence gain/spend clamps at zero', () => {
    const ctx = ctxWith();
    run(ctx, { op: 'gainEvidence', amount: 3 });
    expect(ctx.enc.player.evidence).toBe(3);
    run(ctx, { op: 'spendEvidence', amount: 10 });
    expect(ctx.enc.player.evidence).toBe(0);
  });

  it('composure gain clamps to max; loss clamps to zero', () => {
    const ctx = ctxWith();
    ctx.enc.player.composure = 25;
    ctx.enc.player.maxComposure = 30;
    run(ctx, { op: 'gainComposure', amount: 100 });
    expect(ctx.enc.player.composure).toBe(30);
    run(ctx, { op: 'loseComposure', amount: 100 });
    expect(ctx.enc.player.composure).toBe(0);
  });

  it('focus and retainer and conviction reduction', () => {
    const ctx = ctxWith();
    ctx.enc.prosecution.conviction = 10;
    run(
      ctx,
      { op: 'gainFocus', amount: 2 },
      { op: 'gainRetainer', amount: 7 },
      { op: 'reduceConviction', amount: 4 },
    );
    expect(ctx.enc.player.focus).toBe(5);
    expect(ctx.enc.retainerEarned).toBe(7);
    expect(ctx.enc.prosecution.conviction).toBe(6);
  });

  it('addConviction / raiseTarget / raiseDoubt', () => {
    const ctx = ctxWith({ scoring: false });
    ctx.enc.doubt = 5;
    run(
      ctx,
      { op: 'addConviction', amount: 8 },
      { op: 'raiseTarget', amount: 20 },
      { op: 'raiseDoubt', amount: 6 },
    );
    expect(ctx.enc.prosecution.conviction).toBe(8);
    expect(ctx.enc.doubtTarget).toBe(120);
    expect(ctx.enc.doubt).toBe(11);
  });
});

describe('status effect ops', () => {
  it('applies and removes statuses on self and prosecution', () => {
    const ctx = ctxWith();
    run(
      ctx,
      { op: 'applyStatus', target: 'self', status: 'sustained', amount: 3 },
      { op: 'applyStatus', target: 'prosecution', status: 'rattled', amount: 2 },
    );
    expect(getStatus(ctx.enc.player.statuses, 'sustained')).toBe(3);
    expect(getStatus(ctx.enc.prosecution.statuses, 'rattled')).toBe(2);
    run(ctx, { op: 'removeStatus', target: 'self', status: 'sustained' });
    expect(getStatus(ctx.enc.player.statuses, 'sustained')).toBe(0);
  });

  it('strikeSelf flags the current card', () => {
    const ctx = ctxWith();
    ctx.card = makeCardInstance('x');
    run(ctx, { op: 'strikeSelf' });
    expect(ctx.card.stricken).toBe(true);
  });

  it('retrigger accumulates requests', () => {
    const ctx = ctxWith();
    run(ctx, { op: 'retrigger', times: 2 });
    expect(ctx.retriggerRequested).toBe(2);
  });
});

describe('control-flow ops', () => {
  it('conditional picks the right branch', () => {
    const ctx = ctxWith({ evidence: 5 });
    run(ctx, {
      op: 'conditional',
      condition: { kind: 'sourceAtLeast', source: { kind: 'evidence' }, amount: 3 },
      then: [{ op: 'addBase', amount: 100 }],
      else: [{ op: 'addBase', amount: 1 }],
    });
    expect(ctx.scoring!.base).toBe(100);
  });

  it('repeat runs effects N times', () => {
    const ctx = ctxWith();
    run(ctx, { op: 'repeat', count: 4, effects: [{ op: 'addBase', amount: 2 }] });
    expect(ctx.scoring!.base).toBe(8);
  });

  it('forEachInArgument iterates the staged argument', () => {
    const ctx = ctxWith();
    stageArgument(ctx.enc, ['a', 'b', 'c']);
    run(ctx, { op: 'forEachInArgument', effects: [{ op: 'addBase', amount: 1 }] });
    expect(ctx.scoring!.base).toBe(3);
  });
});

describe('drawCards', () => {
  it('draws from the draw pile', () => {
    const ctx = ctxWith();
    ctx.enc.player.drawPile = [makeCardInstance('a'), makeCardInstance('b'), makeCardInstance('c')];
    const n = drawCards(ctx, 2);
    expect(n).toBe(2);
    expect(ctx.enc.player.hand).toHaveLength(2);
    expect(ctx.enc.player.drawPile).toHaveLength(1);
  });

  it('reshuffles the discard pile when the draw pile is empty', () => {
    const ctx = ctxWith();
    ctx.enc.player.drawPile = [];
    ctx.enc.player.discardPile = [makeCardInstance('a'), makeCardInstance('b')];
    const n = drawCards(ctx, 2);
    expect(n).toBe(2);
    expect(ctx.enc.player.hand).toHaveLength(2);
    expect(ctx.enc.player.discardPile).toHaveLength(0);
  });

  it('stops when no cards remain anywhere', () => {
    const ctx = ctxWith();
    const n = drawCards(ctx, 5);
    expect(n).toBe(0);
  });
});

describe('runPrecedentHooks', () => {
  const prec = (over: Partial<PrecedentDef> = {}): PrecedentDef => ({
    id: 'p1',
    name: 'Test Precedent',
    rarity: 'common',
    text: '',
    hooks: {},
    ...over,
  });

  it('fires hook effects with condition gating', () => {
    const p = prec({ hooks: { onArgumentStart: { effects: [{ op: 'addMult', amount: 5 }] } } });
    const content = makeContent([], [p]);
    const enc = makeEncounter({ precedents: ['p1'] });
    const ctx: EffectContext = {
      rng: new Rng(1),
      content,
      enc,
      scoring: { base: 0, mult: 1, steps: [], cardIndex: 0, scoredUids: [] },
      card: null,
      source: { kind: 'start', label: '' },
      retriggerRequested: 0,
    };
    runPrecedentHooks(ctx, 'onArgumentStart');
    expect(ctx.scoring!.mult).toBe(6);
  });

  it('respects everyN gating', () => {
    const p = prec({
      hooks: { onCardScored: { everyN: 3, effects: [{ op: 'addBase', amount: 10 }] } },
    });
    const content = makeContent([], [p]);
    const enc = makeEncounter({ precedents: ['p1'] });
    const ctx: EffectContext = {
      rng: new Rng(1),
      content,
      enc,
      scoring: { base: 0, mult: 1, steps: [], cardIndex: 0, scoredUids: [] },
      card: null,
      source: { kind: 'card', label: '' },
      retriggerRequested: 0,
    };
    for (let i = 0; i < 6; i++) runPrecedentHooks(ctx, 'onCardScored');
    // Fires on the 3rd and 6th trigger only → +20 base.
    expect(ctx.scoring!.base).toBe(20);
  });
});
