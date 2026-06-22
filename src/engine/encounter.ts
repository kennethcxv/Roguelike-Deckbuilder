/**
 * The trial (encounter) loop. Win at `doubt >= doubtTarget`; lose when the prosecution's
 * Conviction reaches your Composure, or when the rounds run out. The prosecution is an
 * active opponent driven by `ai.ts`.
 *
 * Public reducers (each mutates the passed encounter, which the store/sim clones first):
 *   createEncounter · toggleArgumentCard · playActionCard · discardSelected ·
 *   presentArgument · endTurn
 */

import { selectIntent, resolveIntent } from './ai';
import { drawCards, resolveEffects, runPrecedentHooks } from './effects';
import { applyRoundStartKeywords, tickEndOfRound } from './keywords';
import { scoreArgument } from './scoring';
import { effectiveCard } from './state';
import type {
  CardInstance,
  ContentLookup,
  EffectContext,
  EncounterState,
  EnemyDef,
  PrecedentId,
  ScoringResult,
} from './types';
import { Rng } from './rng';

export interface CreateEncounterOpts {
  content: ContentLookup;
  rng: Rng;
  enemy: EnemyDef;
  deck: CardInstance[];
  precedents: PrecedentId[];
  composure: number;
  /** Difficulty multiplier on the Doubt target (ascension/act scaling). */
  targetMul?: number;
}

function ctxOf(enc: EncounterState, content: ContentLookup, rng: Rng): EffectContext {
  return {
    rng,
    content,
    enc,
    scoring: null,
    card: null,
    source: { kind: 'status', label: '' },
    retriggerRequested: 0,
  };
}

function handSize(enc: EncounterState, content: ContentLookup): number {
  return Math.max(1, content.tuning.startingHandSize + (enc.rules.handSizeDelta ?? 0));
}

export function createEncounter(opts: CreateEncounterOpts): EncounterState {
  const { content, rng, enemy, deck, precedents, composure } = opts;
  const targetMul = opts.targetMul ?? 1;
  const enc: EncounterState = {
    enemyId: enemy.id,
    kind: enemy.kind,
    phase: 'roundStart',
    round: 0,
    maxRounds: enemy.maxRounds,
    doubt: 0,
    doubtTarget: Math.round(enemy.baseDoubtTarget * targetMul),
    rules: enemy.rules ? { ...enemy.rules } : {},
    player: {
      statuses: {},
      evidence: 0,
      composure,
      maxComposure: composure,
      focus: content.tuning.startingFocus,
      maxFocus: content.tuning.startingFocus,
      hand: [],
      drawPile: rng.shuffle(deck),
      discardPile: [],
      exhaustPile: [],
      argument: [],
      discardsUsed: 0,
      cardsPlayedThisRound: 0,
    },
    prosecution: {
      conviction: 0,
      statuses: {},
      intentQueue: [],
      currentIntent: null,
      witnesses: [],
    },
    precedents: [...precedents],
    precedentCounters: {},
    pendingOverrule: 0,
    rngState: rng.state,
    retainerEarned: 0,
    lastScoring: null,
    maxArgumentDoubt: 0,
    log: [],
    result: null,
  };

  const ctx = ctxOf(enc, content, rng);
  runPrecedentHooks(ctx, 'onTrialStart');
  beginRound(enc, content, rng);
  enc.rngState = rng.state;
  return enc;
}

function beginRound(enc: EncounterState, content: ContentLookup, rng: Rng): void {
  enc.round += 1;
  enc.phase = 'player';
  const p = enc.player;
  p.focus = p.maxFocus;
  p.discardsUsed = 0;
  p.cardsPlayedThisRound = 0;

  const ctx = ctxOf(enc, content, rng);
  drawCards(ctx, Math.max(0, handSize(enc, content) - p.hand.length));

  applyRoundStartKeywords(enc);

  // Apply queued Overrules to random hand cards for this round.
  if (enc.pendingOverrule > 0 && p.hand.length > 0) {
    const targets = rng
      .shuffle(p.hand.filter((c) => c.overruledTurns === 0))
      .slice(0, enc.pendingOverrule);
    for (const c of targets) c.overruledTurns = 1;
    enc.pendingOverrule = 0;
  }

  runPrecedentHooks(ctx, 'onRoundStart');
  enc.prosecution.currentIntent = selectIntent(enc, content, rng);
  enc.rngState = rng.state;
}

export function getArgumentFocusCost(enc: EncounterState, content: ContentLookup): number {
  return enc.player.argument.reduce((sum, c) => {
    const eff = effectiveCard(content.getCard(c.defId), c.upgraded);
    return sum + Math.max(0, eff.focusCost + c.costModifier);
  }, 0);
}

export function getCardFocusCost(
  card: CardInstance,
  content: ContentLookup,
): number {
  const eff = effectiveCard(content.getCard(card.defId), card.upgraded);
  return Math.max(0, eff.focusCost + card.costModifier);
}

/** Move an argument card between hand and the staged argument (free, reversible). */
export function toggleArgumentCard(
  enc: EncounterState,
  content: ContentLookup,
  uid: string,
): boolean {
  if (enc.phase !== 'player') return false;
  const p = enc.player;
  const handIdx = p.hand.findIndex((c) => c.uid === uid);
  if (handIdx >= 0) {
    const card = p.hand[handIdx]!;
    const def = content.getCard(card.defId);
    const eff = effectiveCard(def, card.upgraded);
    if (def.kind !== 'argument' || eff.unplayable || card.overruledTurns > 0) return false;
    if (p.argument.length >= content.tuning.maxArgumentSize) return false;
    p.hand.splice(handIdx, 1);
    p.argument.push(card);
    return true;
  }
  const argIdx = p.argument.findIndex((c) => c.uid === uid);
  if (argIdx >= 0) {
    const card = p.argument[argIdx]!;
    p.argument.splice(argIdx, 1);
    p.hand.push(card);
    return true;
  }
  return false;
}

export function canPlayActionCard(
  enc: EncounterState,
  content: ContentLookup,
  uid: string,
): boolean {
  if (enc.phase !== 'player') return false;
  const card = enc.player.hand.find((c) => c.uid === uid);
  if (!card) return false;
  const def = content.getCard(card.defId);
  const eff = effectiveCard(def, card.upgraded);
  if (def.kind !== 'action' || eff.unplayable || card.overruledTurns > 0) return false;
  return enc.player.focus >= getCardFocusCost(card, content);
}

export function playActionCard(
  enc: EncounterState,
  content: ContentLookup,
  rng: Rng,
  uid: string,
): boolean {
  if (!canPlayActionCard(enc, content, uid)) return false;
  const p = enc.player;
  const idx = p.hand.findIndex((c) => c.uid === uid);
  const card = p.hand[idx]!;
  const def = content.getCard(card.defId);
  const eff = effectiveCard(def, card.upgraded);

  p.focus -= getCardFocusCost(card, content);
  p.hand.splice(idx, 1);

  const ctx = ctxOf(enc, content, rng);
  ctx.card = card;
  ctx.source = { kind: 'card', id: def.id, label: eff.name };
  resolveEffects(ctx, eff.onPlay);
  runPrecedentHooks(ctx, 'onPlayCard');

  if (card.stricken || eff.exhausts) p.exhaustPile.push(card);
  else p.discardPile.push(card);
  p.cardsPlayedThisRound += 1;

  checkWin(enc);
  enc.rngState = rng.state;
  return true;
}

export function canPresentArgument(enc: EncounterState, content: ContentLookup): boolean {
  if (enc.phase !== 'player') return false;
  if (enc.player.argument.length === 0) return false;
  return enc.player.focus >= getArgumentFocusCost(enc, content);
}

export function presentArgument(
  enc: EncounterState,
  content: ContentLookup,
  rng: Rng,
): ScoringResult | null {
  if (!canPresentArgument(enc, content)) return null;
  const p = enc.player;
  p.focus -= getArgumentFocusCost(enc, content);

  const result = scoreArgument(enc, content, rng);
  enc.lastScoring = result;
  enc.maxArgumentDoubt = Math.max(enc.maxArgumentDoubt, result.doubt);

  const scored = p.argument;
  p.argument = [];
  for (const card of scored) {
    const eff = effectiveCard(content.getCard(card.defId), card.upgraded);
    if (card.stricken || eff.exhausts) p.exhaustPile.push(card);
    else p.discardPile.push(card);
  }
  p.cardsPlayedThisRound += scored.length;

  checkWin(enc);
  enc.rngState = rng.state;
  return result;
}

export function canDiscard(enc: EncounterState, content: ContentLookup): boolean {
  if (enc.phase !== 'player') return false;
  return enc.player.discardsUsed < content.tuning.discardsPerRound;
}

/** Object: discard the selected hand cards and redraw that many. */
export function discardSelected(
  enc: EncounterState,
  content: ContentLookup,
  rng: Rng,
  uids: string[],
): boolean {
  if (!canDiscard(enc, content) || uids.length === 0) return false;
  const p = enc.player;
  const ctx = ctxOf(enc, content, rng);
  let moved = 0;
  for (const uid of uids) {
    const idx = p.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) continue;
    const card = p.hand[idx]!;
    p.hand.splice(idx, 1);
    card.overruledTurns = 0;
    p.discardPile.push(card);
    const def = content.getCard(card.defId);
    ctx.card = card;
    ctx.source = { kind: 'card', id: def.id, label: def.name };
    runPrecedentHooks(ctx, 'onDiscard');
    moved += 1;
  }
  if (moved === 0) return false;
  p.discardsUsed += 1;
  drawCards(ctx, moved);
  enc.rngState = rng.state;
  return true;
}

export function endTurn(enc: EncounterState, content: ContentLookup, rng: Rng): void {
  if (enc.phase !== 'player') return;
  enc.phase = 'prosecution';
  const p = enc.player;
  const enemy = content.getEnemy(enc.enemyId);

  if (enc.prosecution.currentIntent) {
    resolveIntent(enc, content, rng, enc.prosecution.currentIntent);
  }

  for (const w of enc.prosecution.witnesses) {
    enc.prosecution.conviction += w.convictionPerRound;
    enc.log.push(`${w.name} testifies: +${w.convictionPerRound} Conviction.`);
  }

  enc.prosecution.conviction += enemy.baseConvictionPerRound + (enc.rules.convictionRamp ?? 0);
  enc.doubtTarget += enemy.targetRampPerRound;
  if (enc.rules.doubtDrainPerRound) {
    enc.doubt = Math.max(0, enc.doubt - enc.rules.doubtDrainPerRound);
  }
  if (enc.rules.composureDrainPerRound) {
    p.composure = Math.max(0, p.composure - enc.rules.composureDrainPerRound);
  }

  const ctx = ctxOf(enc, content, rng);
  runPrecedentHooks(ctx, 'onRoundEnd');
  tickEndOfRound(p.statuses, content);
  tickEndOfRound(enc.prosecution.statuses, content);

  // Discard the hand (keeping retained cards).
  const kept: CardInstance[] = [];
  for (const card of p.hand) {
    const eff = effectiveCard(content.getCard(card.defId), card.upgraded);
    card.overruledTurns = 0;
    if (eff.retain) kept.push(card);
    else p.discardPile.push(card);
  }
  p.hand = kept;

  if (checkLoss(enc)) {
    enc.rngState = rng.state;
    return;
  }
  if (enc.round >= enc.maxRounds) {
    enc.phase = 'lost';
    enc.result = 'loss';
    enc.log.push('The jury has heard enough — verdict: Guilty.');
    enc.rngState = rng.state;
    return;
  }

  beginRound(enc, content, rng);
  enc.rngState = rng.state;
}

function checkWin(enc: EncounterState): boolean {
  if (enc.result === null && enc.doubt >= enc.doubtTarget) {
    enc.phase = 'won';
    enc.result = 'win';
    enc.log.push('Reasonable doubt established — verdict: Not Guilty.');
    return true;
  }
  return false;
}

function checkLoss(enc: EncounterState): boolean {
  if (enc.result === null && enc.prosecution.conviction >= enc.player.composure) {
    enc.phase = 'lost';
    enc.result = 'loss';
    enc.log.push('Conviction overwhelms your composure — verdict: Guilty.');
    return true;
  }
  return false;
}

/** Convenience for tests/sims: the enemy's first telegraphed intent. */
export function currentIntent(enc: EncounterState) {
  return enc.prosecution.currentIntent;
}

export type { EnemyDef };
