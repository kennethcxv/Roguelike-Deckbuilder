/** Small pure helpers over runtime state: clamping, status bags, card resolution. */

import type {
  CardDef,
  CardInstance,
  EncounterState,
  KeywordId,
  StatusBag,
  Target,
} from './types';

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function getStatus(bag: StatusBag, id: KeywordId): number {
  return bag[id] ?? 0;
}

export function setStatus(bag: StatusBag, id: KeywordId, amount: number): void {
  if (amount <= 0) {
    delete bag[id];
  } else {
    bag[id] = amount;
  }
}

export function addStatus(bag: StatusBag, id: KeywordId, amount: number): void {
  setStatus(bag, id, getStatus(bag, id) + amount);
}

/** Resolve the status bag for a target. `card` targets have no bag (returns null). */
export function bagForTarget(enc: EncounterState, target: Target): StatusBag | null {
  switch (target) {
    case 'self':
      return enc.player.statuses;
    case 'prosecution':
      return enc.prosecution.statuses;
    case 'card':
      return null;
  }
}

export interface EffectiveCard {
  name: string;
  text: string;
  base: number;
  mult: number;
  focusCost: number;
  keywords: KeywordId[];
  onPlay: CardDef['onPlay'];
  onScore: CardDef['onScore'];
  exhausts: boolean;
  retain: boolean;
  unplayable: boolean;
}

/** Compute the effective stats of a card def given its upgrade level. */
export function effectiveCard(def: CardDef, upgraded: number): EffectiveCard {
  const up = upgraded > 0 ? def.upgrade : undefined;
  const keywords = up?.addKeywords ? [...def.keywords, ...up.addKeywords] : def.keywords;
  return {
    name: up?.name ?? def.name,
    text: up?.text ?? def.text,
    base: up?.base ?? def.base,
    mult: up?.mult ?? def.mult,
    focusCost: up?.focusCost ?? def.focusCost,
    keywords,
    onPlay: up?.onPlay ?? def.onPlay,
    onScore: up?.onScore ?? def.onScore,
    exhausts: up?.exhausts ?? def.exhausts ?? false,
    retain: def.retain ?? false,
    unplayable: def.unplayable ?? false,
  };
}

let uidCounter = 0;
/** Deterministic-enough uid for runtime card instances (not used for RNG). */
export function nextUid(prefix = 'c'): string {
  uidCounter += 1;
  return `${prefix}${uidCounter}`;
}

export function makeCardInstance(defId: string, upgraded = 0, uid?: string): CardInstance {
  return {
    uid: uid ?? nextUid(),
    defId,
    upgraded,
    overruledTurns: 0,
    stricken: false,
    tempBase: 0,
    tempMult: 0,
    costModifier: 0,
  };
}

/** All cards currently "in the deck" during a trial (excludes exhausted). */
export function cardsInPlay(enc: EncounterState): number {
  const p = enc.player;
  return p.drawPile.length + p.discardPile.length + p.hand.length + p.argument.length;
}
