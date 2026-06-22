/**
 * Auto-play strategies for the balance sim. A strategy drives the player phase of a
 * trial; the simulator then ends the turn.
 *
 * The default GreedyStrategy:
 *   1. plays defensive cards when a loss is imminent next round,
 *   2. plays utility (draw/Evidence/Focus) ONLY when a one-step lookahead shows it
 *      raises the best argument it can afford (so action-heavy decks don't waste Focus),
 *   3. greedily builds and presents the highest-Doubt argument it can afford.
 */

import {
  canDiscard,
  discardSelected,
  effectiveCard,
  getCardFocusCost,
  playActionCard,
  presentArgument,
  scoreArgument,
  toggleArgumentCard,
  Rng,
} from '../engine';
import type { CardDef, ContentLookup, EncounterState } from '../engine';

export interface Strategy {
  name: string;
  takeTurn(enc: EncounterState, content: ContentLookup, rng: Rng): void;
}

function clone(enc: EncounterState): EncounterState {
  return structuredClone(enc);
}

function tmpRng(enc: EncounterState): Rng {
  return new Rng((enc.rngState ^ 0x9e3779b9) >>> 0);
}

/** Doubt a candidate set of hand cards would score, evaluated on a clone. */
function simulateArgumentDoubt(
  enc: EncounterState,
  content: ContentLookup,
  uids: string[],
): number {
  const c = clone(enc);
  for (const uid of uids) {
    const i = c.player.hand.findIndex((card) => card.uid === uid);
    if (i >= 0) {
      const [card] = c.player.hand.splice(i, 1);
      c.player.argument.push(card!);
    }
  }
  return scoreArgument(c, content, tmpRng(c)).doubt;
}

/** Greedily choose argument-card uids that maximise marginal Doubt within Focus. */
function greedyArgument(enc: EncounterState, content: ContentLookup): string[] {
  const chosen: string[] = [];
  let focusLeft = enc.player.focus;
  let slotsLeft = content.tuning.maxArgumentSize;
  let bestDoubt = 0;

  while (slotsLeft > 0) {
    const candidates = enc.player.hand.filter((card) => {
      if (chosen.includes(card.uid)) return false;
      const def = content.getCard(card.defId);
      const eff = effectiveCard(def, card.upgraded);
      if (def.kind !== 'argument' || eff.unplayable || card.overruledTurns > 0) return false;
      return getCardFocusCost(card, content) <= focusLeft;
    });
    if (candidates.length === 0) break;

    let bestUid: string | null = null;
    let bestGainPerFocus = 0;
    let bestCost = 1;
    for (const card of candidates) {
      const doubt = simulateArgumentDoubt(enc, content, [...chosen, card.uid]);
      const cost = Math.max(1, getCardFocusCost(card, content));
      const gain = (doubt - bestDoubt) / cost;
      if (gain > bestGainPerFocus) {
        bestGainPerFocus = gain;
        bestUid = card.uid;
        bestCost = getCardFocusCost(card, content);
      }
    }
    if (bestUid === null || bestGainPerFocus <= 0) break;
    chosen.push(bestUid);
    focusLeft -= bestCost;
    slotsLeft -= 1;
    bestDoubt = simulateArgumentDoubt(enc, content, chosen);
  }
  return chosen;
}

function bestArgumentDoubt(enc: EncounterState, content: ContentLookup): number {
  return simulateArgumentDoubt(enc, content, greedyArgument(enc, content));
}

function incomingThreat(enc: EncounterState, content: ContentLookup): number {
  const enemy = content.getEnemy(enc.enemyId);
  let threat = enemy.baseConvictionPerRound + (enc.rules.convictionRamp ?? 0);
  for (const w of enc.prosecution.witnesses) threat += w.convictionPerRound;
  const intent = enc.prosecution.currentIntent;
  if (intent?.kind === 'conviction') threat += intent.value;
  if (intent?.kind === 'status' && intent.status === 'contempt') threat += intent.value;
  return threat;
}

function inDanger(enc: EncounterState, content: ContentLookup): boolean {
  return enc.prosecution.conviction + incomingThreat(enc, content) >= enc.player.composure;
}

function actionOps(def: CardDef): string[] {
  return (effectiveCard(def, 0).onPlay ?? []).map((e) => e.op);
}

export class GreedyStrategy implements Strategy {
  name = 'greedy';

  takeTurn(enc: EncounterState, content: ContentLookup, rng: Rng): void {
    this.playDefense(enc, content, rng);
    this.playValueActions(enc, content, rng);
    this.cycleDeadCards(enc, content, rng);
    this.playValueActions(enc, content, rng);
    this.presentArguments(enc, content, rng);
    this.playDefense(enc, content, rng);
  }

  /** Object/discard chaff to dig for better cards (and fuel discard-payoff builds). */
  private cycleDeadCards(enc: EncounterState, content: ContentLookup, rng: Rng): void {
    let guard = 0;
    while (guard++ < 4 && enc.phase === 'player' && enc.result === null && canDiscard(enc, content)) {
      const keep = new Set(greedyArgument(enc, content));
      const dead = enc.player.hand.filter((c) => {
        if (keep.has(c.uid)) return false;
        const def = content.getCard(c.defId);
        if (def.kind === 'action') return false;
        if (c.overruledTurns > 0) return true;
        return simulateArgumentDoubt(enc, content, [c.uid]) < 6;
      });
      if (dead.length === 0) break;
      const ok = discardSelected(
        enc,
        content,
        rng,
        dead.slice(0, 5).map((c) => c.uid),
      );
      if (!ok) break;
    }
  }

  /** Play Objection/Composure cards while a loss is imminent and Focus remains. */
  private playDefense(enc: EncounterState, content: ContentLookup, rng: Rng): void {
    let safety = 0;
    while (safety++ < 20 && enc.phase === 'player' && enc.result === null && inDanger(enc, content)) {
      const card = enc.player.hand.find((c) => {
        const def = content.getCard(c.defId);
        const eff = effectiveCard(def, c.upgraded);
        if (def.kind !== 'action' || eff.unplayable || c.overruledTurns > 0) return false;
        if (getCardFocusCost(c, content) > enc.player.focus) return false;
        const ops = actionOps(def);
        return ops.includes('reduceConviction') || ops.includes('gainComposure');
      });
      if (!card) break;
      playActionCard(enc, content, rng, card.uid);
    }
  }

  /** Play utility actions only when a lookahead shows they raise our best argument. */
  private playValueActions(enc: EncounterState, content: ContentLookup, rng: Rng): void {
    let safety = 0;
    while (safety++ < 12 && enc.phase === 'player' && enc.result === null) {
      const baseline = bestArgumentDoubt(enc, content);
      let bestUid: string | null = null;
      let bestValue = baseline;

      for (const c of enc.player.hand) {
        const def = content.getCard(c.defId);
        const eff = effectiveCard(def, c.upgraded);
        if (def.kind !== 'action' || eff.unplayable || c.overruledTurns > 0) continue;
        if (getCardFocusCost(c, content) > enc.player.focus) continue;
        const ops = actionOps(def);
        const isUtility =
          ops.includes('drawCards') ||
          ops.includes('gainEvidence') ||
          ops.includes('gainFocus') ||
          ops.includes('raiseDoubt');
        if (!isUtility) continue;

        const sandbox = clone(enc);
        playActionCard(sandbox, content, tmpRng(sandbox), c.uid);
        const value = bestArgumentDoubt(sandbox, content) + sandbox.doubt - enc.doubt;
        if (value > bestValue + 0.001) {
          bestValue = value;
          bestUid = c.uid;
        }
      }
      if (bestUid === null) break;
      playActionCard(enc, content, rng, bestUid);
    }
  }

  private presentArguments(enc: EncounterState, content: ContentLookup, rng: Rng): void {
    let safety = 0;
    while (safety++ < 10 && enc.phase === 'player' && enc.result === null) {
      const uids = greedyArgument(enc, content);
      if (uids.length === 0) break;
      for (const uid of uids) toggleArgumentCard(enc, content, uid);
      const before = enc.doubt;
      const res = presentArgument(enc, content, rng);
      if (!res || enc.doubt <= before) break;
    }
  }
}
