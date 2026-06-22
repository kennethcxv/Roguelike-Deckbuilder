/**
 * The scoring cascade: turns a staged argument into Doubt through one ordered,
 * deterministic pipeline, recording a step-by-step trace for the UI animation.
 *
 *   ARGUMENT_START  → Sustained mult, precedent onArgumentStart hooks
 *   per scored card → Leading bonus, intrinsic base/mult, onScore effects,
 *                     precedent onCardScored hooks, retriggers
 *   ARGUMENT_TALLY  → precedent onArgumentTally hooks
 *   cap             → boss mult cap
 *   final           → Doubt = round(base × mult), added to the encounter
 *   ARGUMENT_END    → precedent onArgumentEnd hooks (post-score reactions)
 */

import { pushStep, resolveEffects, runPrecedentHooks } from './effects';
import { KEYWORD_TUNING, KW } from './keywords';
import { effectiveCard, getStatus, setStatus } from './state';
import type {
  ContentLookup,
  EffectContext,
  EncounterState,
  ScoringResult,
} from './types';
import type { Rng } from './rng';

const MAX_RETRIGGERS_PER_CARD = 50;

export function scoreArgument(
  enc: EncounterState,
  content: ContentLookup,
  rng: Rng,
): ScoringResult {
  const ctx: EffectContext = {
    rng,
    content,
    enc,
    scoring: { base: 0, mult: 1, steps: [], cardIndex: 0, scoredUids: [] },
    card: null,
    source: { kind: 'start', label: 'Opening Statement' },
    retriggerRequested: 0,
  };
  const s = ctx.scoring!;

  // ── ARGUMENT_START ──
  s.steps.push({
    kind: 'start',
    label: 'Opening Statement',
    baseDelta: 0,
    multDelta: 0,
    baseAfter: s.base,
    multAfter: s.mult,
  });
  applySustained(ctx);
  runPrecedentHooks(ctx, 'onArgumentStart');

  // ── per scored card ──
  let leadingPending = 0;
  const argument = enc.player.argument;
  for (let i = 0; i < argument.length; i++) {
    const card = argument[i]!;
    s.cardIndex = i;
    ctx.card = card;
    const def = content.getCard(card.defId);
    const eff = effectiveCard(def, card.upgraded);
    ctx.source = { kind: 'card', id: def.id, label: eff.name };

    if (card.stricken || card.overruledTurns > 0 || eff.unplayable) {
      s.steps.push({
        kind: 'skip',
        sourceId: def.id,
        label: eff.name,
        detail: card.overruledTurns > 0 ? 'Overruled' : 'Disabled',
        baseDelta: 0,
        multDelta: 0,
        baseAfter: s.base,
        multAfter: s.mult,
      });
      continue;
    }

    // Leading bonus from a previously scored Leading card.
    if (leadingPending > 0) {
      s.base += leadingPending;
      s.steps.push({
        kind: 'status',
        label: 'Leading',
        detail: `+${leadingPending} base`,
        baseDelta: leadingPending,
        multDelta: 0,
        baseAfter: s.base,
        multAfter: s.mult,
      });
      leadingPending = 0;
    }

    const hearsayBlocked =
      eff.keywords.includes(KW.Hearsay) && enc.player.evidence < 1;

    const scoreOnce = (): void => {
      const intrinsicBase = hearsayBlocked ? 0 : eff.base + card.tempBase;
      const intrinsicMult = eff.mult + card.tempMult;
      s.base += intrinsicBase;
      s.mult += intrinsicMult;
      s.steps.push({
        kind: 'card',
        sourceId: def.id,
        label: eff.name,
        detail: hearsayBlocked ? 'Hearsay — no Evidence' : undefined,
        baseDelta: intrinsicBase,
        multDelta: intrinsicMult,
        baseAfter: s.base,
        multAfter: s.mult,
      });
      ctx.source = { kind: 'card', id: def.id, label: eff.name };
      resolveEffects(ctx, eff.onScore);
      runPrecedentHooks(ctx, 'onCardScored');
    };

    ctx.retriggerRequested = 0;
    ctx.suppressRetrigger = false;
    scoreOnce();
    ctx.suppressRetrigger = true;
    let safety = 0;
    while (ctx.retriggerRequested > 0 && safety < MAX_RETRIGGERS_PER_CARD) {
      ctx.retriggerRequested -= 1;
      safety += 1;
      scoreOnce();
    }
    ctx.suppressRetrigger = false;

    s.scoredUids.push(card.uid);
    if (eff.keywords.includes(KW.Leading)) {
      leadingPending += KEYWORD_TUNING.leadingBaseBonus;
    }
  }

  ctx.card = null;

  // ── ARGUMENT_TALLY ──
  ctx.source = { kind: 'tally', label: 'Summation' };
  runPrecedentHooks(ctx, 'onArgumentTally');

  // ── cap (boss biased judge) ──
  const cap = enc.rules.multCap;
  if (cap !== undefined && cap > 0 && s.mult > cap) {
    s.steps.push({
      kind: 'cap',
      label: 'Biased Judge',
      detail: `mult capped at ${cap}`,
      baseDelta: 0,
      multDelta: cap - s.mult,
      baseAfter: s.base,
      multAfter: cap,
    });
    s.mult = cap;
  }

  // ── final ──
  const base = Math.max(0, s.base);
  const mult = Math.max(0, s.mult);
  const doubt = Math.round(base * mult);
  s.base = base;
  s.mult = mult;
  s.steps.push({
    kind: 'final',
    label: 'Verdict',
    detail: `${round1(base)} × ${round1(mult)} = ${doubt}`,
    baseDelta: 0,
    multDelta: 0,
    baseAfter: base,
    multAfter: mult,
  });

  enc.doubt += doubt;

  // ── ARGUMENT_END (post-score reactions) ──
  ctx.source = { kind: 'final', label: 'After the Verdict' };
  runPrecedentHooks(ctx, 'onArgumentEnd');

  return { steps: s.steps, base, mult, doubt };
}

function applySustained(ctx: EffectContext): void {
  const bag = ctx.enc.player.statuses;
  const stacks = getStatus(bag, KW.Sustained);
  if (stacks <= 0) return;
  const delta = stacks * KEYWORD_TUNING.sustainedMultPerStack;
  const s = ctx.scoring!;
  s.mult += delta;
  pushStep(ctx, {
    kind: 'status',
    label: 'Sustained',
    detail: `+${delta} mult`,
    multDelta: delta,
  });
  setStatus(bag, KW.Sustained, 0); // consumed by this argument
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
