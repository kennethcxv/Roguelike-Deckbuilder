/** Public engine API barrel. */

export * from './types';
export { Rng, hashSeed, seedFromString, deriveSeed } from './rng';
export {
  clamp,
  getStatus,
  setStatus,
  addStatus,
  bagForTarget,
  effectiveCard,
  makeCardInstance,
  nextUid,
  cardsInPlay,
} from './state';
export type { EffectiveCard } from './state';
export { evalSource, evalCondition } from './query';
export { resolveEffects, runPrecedentHooks, drawCards, pushStep } from './effects';
export { KW, KEYWORD_TUNING, applyRoundStartKeywords, tickEndOfRound } from './keywords';
export type { CanonicalKeyword } from './keywords';
export { scoreArgument } from './scoring';
