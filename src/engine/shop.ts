/**
 * Shop (Law Library) stock generation and pricing. Purchases/sellback live in run.ts
 * since they mutate run state; this module is pure generation + price helpers.
 */

import { rewardableCards, rewardablePrecedents } from './rewards';
import type { ContentLookup, Rarity, ShopState } from './types';
import type { Rng } from './rng';

const CARD_PRICE: Record<Rarity, number> = {
  starter: 40,
  common: 50,
  uncommon: 75,
  rare: 110,
  special: 60,
  boss: 140,
};

const PRECEDENT_PRICE: Record<Rarity, number> = {
  starter: 80,
  common: 80,
  uncommon: 130,
  rare: 185,
  special: 150,
  boss: 250,
};

function jitter(rng: Rng, base: number): number {
  return Math.round(base * (0.9 + rng.next() * 0.25));
}

export function cardPrice(rng: Rng, rarity: Rarity, act: number): number {
  return jitter(rng, CARD_PRICE[rarity] + (act - 1) * 8);
}

export function precedentPrice(rng: Rng, rarity: Rarity, act: number): number {
  return jitter(rng, PRECEDENT_PRICE[rarity] + (act - 1) * 12);
}

export function generateShop(
  content: ContentLookup,
  rng: Rng,
  characterId: string,
  act: number,
): ShopState {
  const tuning = content.tuning;

  const cardPool = rng.shuffle(rewardableCards(content, characterId));
  const cards = cardPool.slice(0, tuning.shopCardCount).map((c) => ({
    cardId: c.id,
    cost: cardPrice(rng, c.rarity, act),
    sold: false,
  }));

  const precPool = rng.shuffle(rewardablePrecedents(content));
  const precedents = precPool.slice(0, tuning.shopPrecedentCount).map((p) => ({
    precedentId: p.id,
    cost: precedentPrice(rng, p.rarity, act),
    sold: false,
  }));

  const motionPool = rng.shuffle(content.allMotions().filter((m) => m.rarity !== 'special'));
  const motions = motionPool.slice(0, tuning.shopMotionCount).map((m) => ({
    motionId: m.id,
    cost: jitter(rng, m.cost + (act - 1) * 6),
    sold: false,
  }));

  return {
    cards,
    precedents,
    motions,
    removeCost: tuning.shopRemoveBaseCost,
    removeUsed: false,
  };
}
