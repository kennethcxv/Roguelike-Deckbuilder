/** Pure read-only evaluation of Sources (numbers) and Conditions (booleans). */

import { effectiveCard, getStatus } from './state';
import type { Condition, EffectContext, Source } from './types';

export function evalSource(ctx: EffectContext, source: Source): number {
  const p = ctx.enc.player;
  switch (source.kind) {
    case 'const':
      return source.value;
    case 'evidence':
      return p.evidence;
    case 'composure':
      return p.composure;
    case 'focusUnspent':
      return p.focus;
    case 'argumentSize':
      return p.argument.length;
    case 'handSize':
      return p.hand.length;
    case 'cardsPlayedThisRound':
      return p.cardsPlayedThisRound;
    case 'discardsThisRound':
      return p.discardsUsed;
    case 'roundNumber':
      return ctx.enc.round;
    case 'deckSize':
      return p.drawPile.length + p.discardPile.length + p.hand.length + p.argument.length;
    case 'drawPileSize':
      return p.drawPile.length;
    case 'discardPileSize':
      return p.discardPile.length;
    case 'doubt':
      return ctx.enc.doubt;
    case 'conviction':
      return ctx.enc.prosecution.conviction;
    case 'statusStacks': {
      const bag =
        source.target === 'prosecution' ? ctx.enc.prosecution.statuses : ctx.enc.player.statuses;
      return getStatus(bag, source.status);
    }
  }
}

export function evalCondition(ctx: EffectContext, cond: Condition): boolean {
  switch (cond.kind) {
    case 'always':
      return true;
    case 'not':
      return !evalCondition(ctx, cond.condition);
    case 'and':
      return cond.conditions.every((c) => evalCondition(ctx, c));
    case 'or':
      return cond.conditions.some((c) => evalCondition(ctx, c));
    case 'sourceAtLeast':
      return evalSource(ctx, cond.source) >= cond.amount;
    case 'sourceAtMost':
      return evalSource(ctx, cond.source) <= cond.amount;
    case 'hasStatus': {
      const bag =
        cond.target === 'prosecution' ? ctx.enc.prosecution.statuses : ctx.enc.player.statuses;
      return getStatus(bag, cond.status) >= (cond.atLeast ?? 1);
    }
    case 'cardHasKeyword': {
      if (!ctx.card) return false;
      const def = ctx.content.getCard(ctx.card.defId);
      return effectiveCard(def, ctx.card.upgraded).keywords.includes(cond.keyword);
    }
    case 'cardHasCategory': {
      if (!ctx.card) return false;
      return ctx.content.getCard(ctx.card.defId).category === cond.category;
    }
    case 'firstCardOfArgument':
      return ctx.scoring ? ctx.scoring.cardIndex === 0 : false;
    case 'coinFlip':
      return ctx.rng.bool(cond.probability);
  }
}
