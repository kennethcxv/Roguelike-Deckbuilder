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
export { selectIntent, resolveIntent, previewIntents } from './ai';
export {
  createEncounter,
  toggleArgumentCard,
  playActionCard,
  canPlayActionCard,
  presentArgument,
  canPresentArgument,
  discardSelected,
  canDiscard,
  endTurn,
  getArgumentFocusCost,
  getCardFocusCost,
  currentIntent,
} from './encounter';
export type { CreateEncounterOpts } from './encounter';
export { generateMap, getNode, actMap } from './map';
export {
  rewardableCards,
  rewardablePrecedents,
  rollCardRewards,
  rollPrecedent,
  buildTrialRewards,
} from './rewards';
export { generateShop, cardPrice, precedentPrice } from './shop';
export {
  createRun,
  enterNode,
  targetMulForAppeal,
  runToggleArgument,
  runPlayAction,
  runPresent,
  runDiscard,
  runEndTurn,
  runUseCombatMotion,
  syncCombat,
  takeCardReward,
  skipCardReward,
  takePrecedentReward,
  takeMotionReward,
  finishRewards,
  chooseEventOption,
  eventOptionAvailable,
  finishEvent,
  shopBuyCard,
  shopBuyPrecedent,
  shopBuyMotion,
  shopSellCard,
  shopRemoveCard,
  leaveShop,
  restRecuperate,
  restStudy,
  canUpgrade,
  addCardToDeck,
  removeCardFromDeck,
  upgradeCard,
  addPrecedent,
  useMapMotion,
  applyOutcome,
  deckView,
} from './run';
export type { CreateRunOpts } from './run';
