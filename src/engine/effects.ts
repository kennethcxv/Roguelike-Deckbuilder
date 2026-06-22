/**
 * Effect resolution. Effects are plain data (the `Effect` union); this module is the
 * interpreter. Handlers mutate the working `EffectContext` (the engine clones state at
 * reducer boundaries, so the public API stays pure). Base/mult changes also record a
 * `ScoreStep` for the UI cascade, attributed to `ctx.source`.
 */

import { evalCondition, evalSource } from './query';
import { addStatus, bagForTarget, clamp, setStatus } from './state';
import type {
  Effect,
  EffectContext,
  HookPhase,
  ScoreStepKind,
} from './types';

interface StepOpts {
  baseDelta?: number;
  multDelta?: number;
  multFactor?: number;
  detail?: string;
  kind?: ScoreStepKind;
  label?: string;
}

/** Record a trace step (no-op outside the scoring cascade). */
export function pushStep(ctx: EffectContext, opts: StepOpts): void {
  const s = ctx.scoring;
  if (!s) return;
  s.steps.push({
    kind: opts.kind ?? ctx.source.kind,
    sourceId: ctx.source.id,
    label: opts.label ?? ctx.source.label,
    detail: opts.detail,
    baseDelta: opts.baseDelta ?? 0,
    multDelta: opts.multDelta ?? 0,
    multFactor: opts.multFactor,
    baseAfter: s.base,
    multAfter: s.mult,
  });
}

/** Move `n` cards from draw pile to hand, reshuffling the discard pile when empty. */
export function drawCards(ctx: EffectContext, n: number): number {
  const p = ctx.enc.player;
  let drawn = 0;
  for (let i = 0; i < n; i++) {
    if (p.drawPile.length === 0) {
      if (p.discardPile.length === 0) break;
      p.drawPile = ctx.rng.shuffle(p.discardPile);
      p.discardPile = [];
    }
    const card = p.drawPile.shift();
    if (!card) break;
    p.hand.push(card);
    drawn += 1;
  }
  return drawn;
}

export function resolveEffects(ctx: EffectContext, effects: readonly Effect[] | undefined): void {
  if (!effects) return;
  for (const effect of effects) applyEffect(ctx, effect);
}

function applyEffect(ctx: EffectContext, effect: Effect): void {
  const s = ctx.scoring;
  const p = ctx.enc.player;
  switch (effect.op) {
    case 'addBase': {
      if (s) {
        s.base += effect.amount;
        pushStep(ctx, { baseDelta: effect.amount });
      }
      return;
    }
    case 'addMult': {
      if (s) {
        s.mult += effect.amount;
        pushStep(ctx, { multDelta: effect.amount });
      }
      return;
    }
    case 'mulMult': {
      if (s) {
        const before = s.mult;
        s.mult *= effect.factor;
        pushStep(ctx, { multDelta: s.mult - before, multFactor: effect.factor });
      }
      return;
    }
    case 'addBasePer': {
      if (s) {
        const amount = effect.per * evalSource(ctx, effect.source);
        s.base += amount;
        pushStep(ctx, { baseDelta: amount });
      }
      return;
    }
    case 'addMultPer': {
      if (s) {
        const amount = effect.per * evalSource(ctx, effect.source);
        s.mult += amount;
        pushStep(ctx, { multDelta: amount });
      }
      return;
    }
    case 'raiseDoubt': {
      ctx.enc.doubt = Math.max(0, ctx.enc.doubt + effect.amount);
      return;
    }
    case 'gainEvidence': {
      p.evidence = Math.max(0, p.evidence + effect.amount);
      return;
    }
    case 'spendEvidence': {
      p.evidence = Math.max(0, p.evidence - effect.amount);
      return;
    }
    case 'gainComposure': {
      p.composure = clamp(p.composure + effect.amount, 0, p.maxComposure);
      return;
    }
    case 'loseComposure': {
      p.composure = Math.max(0, p.composure - effect.amount);
      return;
    }
    case 'gainFocus': {
      p.focus = Math.max(0, p.focus + effect.amount);
      return;
    }
    case 'gainRetainer': {
      ctx.enc.retainerEarned += effect.amount;
      return;
    }
    case 'reduceConviction': {
      ctx.enc.prosecution.conviction = Math.max(0, ctx.enc.prosecution.conviction - effect.amount);
      return;
    }
    case 'drawCards': {
      drawCards(ctx, effect.amount);
      return;
    }
    case 'retrigger': {
      if (!ctx.suppressRetrigger) ctx.retriggerRequested += effect.times;
      return;
    }
    case 'strikeSelf': {
      if (ctx.card) ctx.card.stricken = true;
      return;
    }
    case 'applyStatus': {
      const bag = bagForTarget(ctx.enc, effect.target);
      if (bag) addStatus(bag, effect.status, effect.amount);
      return;
    }
    case 'removeStatus': {
      const bag = bagForTarget(ctx.enc, effect.target);
      if (bag) setStatus(bag, effect.status, 0);
      return;
    }
    case 'addConviction': {
      ctx.enc.prosecution.conviction += effect.amount;
      return;
    }
    case 'raiseTarget': {
      ctx.enc.doubtTarget += effect.amount;
      return;
    }
    case 'conditional': {
      if (evalCondition(ctx, effect.condition)) resolveEffects(ctx, effect.then);
      else resolveEffects(ctx, effect.else);
      return;
    }
    case 'repeat': {
      for (let i = 0; i < effect.count; i++) resolveEffects(ctx, effect.effects);
      return;
    }
    case 'forEachInArgument': {
      const saved = ctx.card;
      for (const card of ctx.enc.player.argument) {
        ctx.card = card;
        resolveEffects(ctx, effect.effects);
      }
      ctx.card = saved;
      return;
    }
    default: {
      // Compile-time guarantee that every declared Effect op has a handler.
      const _exhaustive: never = effect;
      return _exhaustive;
    }
  }
}

/** Run all active precedents' hooks for a phase (condition + everyN gating, in order). */
export function runPrecedentHooks(ctx: EffectContext, phase: HookPhase): void {
  for (const pid of ctx.enc.precedents) {
    const def = ctx.content.getPrecedentOrNull(pid);
    if (!def) continue;
    const hook = def.hooks[phase];
    if (!hook) continue;

    const prevSource = ctx.source;
    ctx.source = { kind: 'precedent', id: pid, label: def.name };

    if (!hook.condition || evalCondition(ctx, hook.condition)) {
      let fire = true;
      if (hook.everyN && hook.everyN > 1) {
        const key = `${pid}:${phase}`;
        const c = (ctx.enc.precedentCounters[key] ?? 0) + 1;
        ctx.enc.precedentCounters[key] = c;
        fire = c % hook.everyN === 0;
      }
      if (fire) resolveEffects(ctx, hook.effects);
    }

    ctx.source = prevSource;
  }
}
