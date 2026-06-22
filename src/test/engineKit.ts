/**
 * Test fixtures for engine unit tests: an in-memory ContentLookup and factories for
 * encounter/card runtime state. Lives outside /engine so it may freely reference
 * engine types without violating the engine's import-boundary lint rule.
 */

import { makeCardInstance } from '../engine/state';
import { KW } from '../engine/keywords';
import type {
  CardDef,
  CardInstance,
  CharacterDef,
  ContentLookup,
  EncounterState,
  EnemyDef,
  KeywordDef,
  PlayerCombat,
  PrecedentDef,
  ProsecutionState,
  Tuning,
} from '../engine/types';

export const DEFAULT_TUNING: Tuning = {
  startingHandSize: 8,
  startingFocus: 3,
  discardsPerRound: 1,
  maxArgumentSize: 5,
  startingComposure: 30,
  shopRemoveBaseCost: 25,
  shopRerollBaseCost: 10,
  sellbackRetainer: 10,
  cardRewardChoices: 3,
  cardRewardRarityWeights: [
    { common: 70, uncommon: 25, rare: 5 },
    { common: 55, uncommon: 35, rare: 10 },
    { common: 40, uncommon: 42, rare: 18 },
  ],
  precedentRarityWeights: { common: 60, uncommon: 30, rare: 10 },
  shopCardCount: 5,
  shopPrecedentCount: 3,
  shopMotionCount: 3,
  trialRetainerReward: 25,
};

export const CANONICAL_KEYWORDS: KeywordDef[] = [
  { id: KW.Sustained, name: 'Sustained', description: 'Adds mult next argument.', tone: 'good' },
  { id: KW.Overruled, name: 'Overruled', description: 'Card is disabled.', tone: 'bad' },
  { id: KW.Hearsay, name: 'Hearsay', description: 'No base without Evidence.', tone: 'neutral' },
  {
    id: KW.Contempt,
    name: 'Contempt',
    description: 'Feeds Conviction each round.',
    tone: 'bad',
    decays: true,
  },
  {
    id: KW.Rattled,
    name: 'Rattled',
    description: 'Saps Focus each round.',
    tone: 'bad',
    decays: true,
  },
  { id: KW.Composure, name: 'Composure', description: 'Your resolve.', tone: 'good' },
  { id: KW.Evidence, name: 'Evidence', description: 'Fuel for arguments.', tone: 'good' },
  { id: KW.Leading, name: 'Leading', description: 'Boosts the next card.', tone: 'good' },
  { id: KW.Witness, name: 'Witness', description: 'A threat to cross-examine.', tone: 'bad' },
  { id: KW.Stricken, name: 'Stricken', description: 'Removed for the trial.', tone: 'neutral' },
];

export function makeContent(
  cards: CardDef[],
  precedents: PrecedentDef[] = [],
  keywords: KeywordDef[] = CANONICAL_KEYWORDS,
  tuning: Tuning = DEFAULT_TUNING,
  enemies: EnemyDef[] = [],
  characters: CharacterDef[] = [],
): ContentLookup {
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const precMap = new Map(precedents.map((p) => [p.id, p]));
  const kwMap = new Map(keywords.map((k) => [k.id, k]));
  const enemyMap = new Map(enemies.map((e) => [e.id, e]));
  const charMap = new Map(characters.map((c) => [c.id, c]));
  return {
    tuning,
    getCard(id) {
      const c = cardMap.get(id);
      if (!c) throw new Error(`Unknown card: ${id}`);
      return c;
    },
    getCardOrNull: (id) => cardMap.get(id),
    getKeyword(id) {
      const k = kwMap.get(id);
      if (!k) throw new Error(`Unknown keyword: ${id}`);
      return k;
    },
    getKeywordOrNull: (id) => kwMap.get(id),
    getPrecedent(id) {
      const p = precMap.get(id);
      if (!p) throw new Error(`Unknown precedent: ${id}`);
      return p;
    },
    getPrecedentOrNull: (id) => precMap.get(id),
    getEnemy(id) {
      const e = enemyMap.get(id);
      if (!e) throw new Error(`Unknown enemy: ${id}`);
      return e;
    },
    getEnemyOrNull: (id) => enemyMap.get(id),
    getCharacter(id) {
      const c = charMap.get(id);
      if (!c) throw new Error(`Unknown character: ${id}`);
      return c;
    },
    getCharacterOrNull: (id) => charMap.get(id),
    allCards: () => [...cardMap.values()],
    allPrecedents: () => [...precMap.values()],
    allEnemies: () => [...enemyMap.values()],
    allCharacters: () => [...charMap.values()],
  };
}

export function makePlayer(overrides: Partial<PlayerCombat> = {}): PlayerCombat {
  return {
    statuses: {},
    evidence: 0,
    composure: 30,
    maxComposure: 30,
    focus: 3,
    maxFocus: 3,
    hand: [],
    drawPile: [],
    discardPile: [],
    exhaustPile: [],
    argument: [],
    discardsUsed: 0,
    cardsPlayedThisRound: 0,
    ...overrides,
  };
}

export function makeProsecution(overrides: Partial<ProsecutionState> = {}): ProsecutionState {
  return {
    conviction: 0,
    statuses: {},
    intentQueue: [],
    currentIntent: null,
    witnesses: [],
    ...overrides,
  };
}

export function makeEncounter(overrides: Partial<EncounterState> = {}): EncounterState {
  return {
    enemyId: 'test-enemy',
    kind: 'trial',
    phase: 'player',
    round: 1,
    maxRounds: 10,
    doubt: 0,
    doubtTarget: 100,
    rules: {},
    player: makePlayer(),
    prosecution: makeProsecution(),
    precedents: [],
    precedentCounters: {},
    pendingOverrule: 0,
    rngState: 1,
    retainerEarned: 0,
    lastScoring: null,
    maxArgumentDoubt: 0,
    log: [],
    result: null,
    ...overrides,
  };
}

/** Build an argument of card instances from def ids and stage it on the encounter. */
export function stageArgument(
  enc: EncounterState,
  defIds: string[],
  upgraded = 0,
): CardInstance[] {
  const cards = defIds.map((id) => makeCardInstance(id, upgraded));
  enc.player.argument = cards;
  return cards;
}
