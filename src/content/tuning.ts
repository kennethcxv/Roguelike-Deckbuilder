import type { Tuning } from '../engine/types';

/**
 * Global balance constants. Rebalancing the moment-to-moment economy and combat
 * cadence happens HERE (and in the per-card/precedent data) — never in the engine.
 */
export const TUNING: Tuning = {
  startingHandSize: 8,
  startingFocus: 3,
  discardsPerRound: 2,
  maxArgumentSize: 5,
  startingComposure: 60,
  shopRemoveBaseCost: 25,
  shopRerollBaseCost: 10,
  sellbackRetainer: 12,
  cardRewardChoices: 3,
  cardRewardRarityWeights: [
    { common: 72, uncommon: 25, rare: 3 },
    { common: 58, uncommon: 34, rare: 8 },
    { common: 44, uncommon: 40, rare: 16 },
  ],
  precedentRarityWeights: { common: 58, uncommon: 32, rare: 10 },
  shopCardCount: 5,
  shopPrecedentCount: 3,
  shopMotionCount: 3,
  trialRetainerReward: 22,
};
