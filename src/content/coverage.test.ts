/**
 * Exercises EVERY card and EVERY Precedent against the real content DB to guarantee no
 * declared effect throws and all produce sane results. This is the per-card / per-Precedent
 * effect coverage required by the Definition of Done.
 */

import { describe, it, expect } from 'vitest';
import { DB } from './index';
import {
  Rng,
  effectiveCard,
  makeCardInstance,
  resolveEffects,
  runPrecedentHooks,
  scoreArgument,
} from '../engine';
import type { EffectContext, HookPhase } from '../engine';
import { makeEncounter } from '../test/engineKit';

const FILLER = ['neutral.assertion', 'neutral.exhibit', 'neutral.flourish'];

function richEncounter(precedents: string[] = []) {
  const enc = makeEncounter({ precedents });
  enc.player.evidence = 8;
  enc.player.composure = 50;
  enc.player.maxComposure = 50;
  enc.player.focus = 5;
  enc.player.maxFocus = 5;
  enc.player.statuses = { sustained: 4, leading: 1 };
  enc.player.hand = FILLER.map((id) => makeCardInstance(id));
  enc.player.drawPile = FILLER.map((id) => makeCardInstance(id));
  enc.player.discardPile = [makeCardInstance('neutral.assertion')];
  enc.prosecution.conviction = 10;
  return enc;
}

describe('card effect coverage', () => {
  for (const card of DB.allCards()) {
    for (const up of card.upgrade ? [0, 1] : [0]) {
      it(`scores/plays ${card.id}${up ? '+' : ''} without error`, () => {
        const eff = effectiveCard(card, up);
        if (card.kind === 'argument') {
          const enc = richEncounter();
          enc.player.argument = [makeCardInstance(card.id, up), makeCardInstance(card.id, up)];
          const res = scoreArgument(enc, DB, new Rng(7));
          expect(Number.isFinite(res.doubt)).toBe(true);
          expect(res.doubt).toBeGreaterThanOrEqual(0);
        } else {
          const enc = richEncounter();
          const ctx: EffectContext = {
            rng: new Rng(7),
            content: DB,
            enc,
            scoring: null,
            card: makeCardInstance(card.id, up),
            source: { kind: 'card', id: card.id, label: eff.name },
            retriggerRequested: 0,
          };
          expect(() => resolveEffects(ctx, eff.onPlay)).not.toThrow();
          expect(enc.player.evidence).toBeGreaterThanOrEqual(0);
        }
      });
    }
  }
});

const ALL_PHASES: HookPhase[] = [
  'onTrialStart',
  'onRoundStart',
  'onPlayCard',
  'onDiscard',
  'onRoundEnd',
  'onAcquit',
];

describe('precedent hook coverage', () => {
  for (const prec of DB.allPrecedents()) {
    it(`runs all hooks of ${prec.id} without error`, () => {
      const enc = richEncounter([prec.id]);
      enc.player.argument = [
        makeCardInstance('neutral.exhibit'),
        makeCardInstance('neutral.assertion'),
        makeCardInstance('neutral.flourish'),
      ];
      // Scoring phases (onArgumentStart / onCardScored / onArgumentTally / onArgumentEnd).
      expect(() => scoreArgument(enc, DB, new Rng(11))).not.toThrow();
      // Non-scoring phases.
      const ctx: EffectContext = {
        rng: new Rng(12),
        content: DB,
        enc,
        scoring: null,
        card: makeCardInstance('neutral.exhibit'),
        source: { kind: 'status', label: prec.name },
        retriggerRequested: 0,
      };
      for (const phase of ALL_PHASES) {
        expect(() => runPrecedentHooks(ctx, phase)).not.toThrow();
      }
      expect(enc.doubt).toBeGreaterThanOrEqual(0);
      expect(enc.retainerEarned).toBeGreaterThanOrEqual(0);
    });
  }
});
