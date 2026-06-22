/**
 * The assembled content database. Implements the engine's ContentLookup plus extra
 * query helpers used by the run/rewards/shop/sim layers. Content is validated at load.
 */

import type {
  CardDef,
  CharacterDef,
  ContentLookup,
  EncounterKind,
  EnemyDef,
  EventDef,
  KeywordDef,
  MotionDef,
  PrecedentDef,
  Rarity,
} from '../engine/types';
import { ALL_CARDS } from './cards';
import { ALL_PRECEDENTS as BASE_PRECEDENTS } from './precedents';
import { PRECEDENTS_2 } from './precedents/precedents2';
import { ALL_ENEMIES as BASE_ENEMIES } from './encounters';
import { ENEMIES_2 } from './encounters/encounters2';
import { ALL_CHARACTERS } from './characters';
import { ALL_EVENTS as BASE_EVENTS } from './events';
import { EVENTS_2 } from './events/events2';
import { ALL_MOTIONS as BASE_MOTIONS } from './motions';
import { MOTIONS_2 } from './motions2';
import { KEYWORDS } from './keywords';
import { TUNING } from './tuning';
import { STRINGS } from './strings';
import { assertValidContent } from './schema';

const ALL_PRECEDENTS: PrecedentDef[] = [...BASE_PRECEDENTS, ...PRECEDENTS_2];
const ALL_ENEMIES: EnemyDef[] = [...BASE_ENEMIES, ...ENEMIES_2];
const ALL_EVENTS: EventDef[] = [...BASE_EVENTS, ...EVENTS_2];
const ALL_MOTIONS: MotionDef[] = [...BASE_MOTIONS, ...MOTIONS_2];

export interface ContentDB extends ContentLookup {
  /** Neutral cards plus the given character's cards. */
  cardsForCharacter(characterId: string): CardDef[];
  /** Cards that may appear as rewards/shop stock for a character (excludes starters). */
  rewardableCards(characterId: string, rarity?: Rarity): CardDef[];
  precedentsByRarity(rarity: Rarity): PrecedentDef[];
  rewardablePrecedents(): PrecedentDef[];
  enemiesBy(act: number, kind: EncounterKind): EnemyDef[];
  boss(act: number): EnemyDef | undefined;
  eventsForAct(act: number): EventDef[];
  motionsByUsage(usage: MotionDef['usage']): MotionDef[];
  rewardableMotions(): MotionDef[];
}

function index<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((i) => [i.id, i]));
}

function build(): ContentDB {
  const cardMap = index(ALL_CARDS);
  const precMap = index(ALL_PRECEDENTS);
  const enemyMap = index(ALL_ENEMIES);
  const charMap = index(ALL_CHARACTERS);
  const kwMap = index(KEYWORDS);
  const eventMap = index(ALL_EVENTS);
  const motionMap = index(ALL_MOTIONS);

  const need = <T>(v: T | undefined, what: string, id: string): T => {
    if (v === undefined) throw new Error(`Unknown ${what}: ${id}`);
    return v;
  };

  return {
    tuning: TUNING,
    getCard: (id) => need(cardMap.get(id), 'card', id),
    getCardOrNull: (id) => cardMap.get(id),
    getKeyword: (id) => need(kwMap.get(id), 'keyword', id),
    getKeywordOrNull: (id) => kwMap.get(id),
    getPrecedent: (id) => need(precMap.get(id), 'precedent', id),
    getPrecedentOrNull: (id) => precMap.get(id),
    getEnemy: (id) => need(enemyMap.get(id), 'enemy', id),
    getEnemyOrNull: (id) => enemyMap.get(id),
    getCharacter: (id) => need(charMap.get(id), 'character', id),
    getCharacterOrNull: (id) => charMap.get(id),
    getEvent: (id) => need(eventMap.get(id), 'event', id),
    getEventOrNull: (id) => eventMap.get(id),
    getMotion: (id) => need(motionMap.get(id), 'motion', id),
    getMotionOrNull: (id) => motionMap.get(id),
    allCards: () => [...cardMap.values()],
    allPrecedents: () => [...precMap.values()],
    allEnemies: () => [...enemyMap.values()],
    allCharacters: () => [...charMap.values()],
    allEvents: () => [...eventMap.values()],
    allMotions: () => [...motionMap.values()],

    cardsForCharacter: (characterId) =>
      ALL_CARDS.filter((c) => c.character === 'neutral' || c.character === characterId),
    rewardableCards: (characterId, rarity) =>
      ALL_CARDS.filter(
        (c) =>
          (c.character === 'neutral' || c.character === characterId) &&
          c.rarity !== 'starter' &&
          c.rarity !== 'special' &&
          !c.unplayable &&
          (rarity === undefined || c.rarity === rarity),
      ),
    precedentsByRarity: (rarity) => ALL_PRECEDENTS.filter((p) => p.rarity === rarity),
    rewardablePrecedents: () =>
      ALL_PRECEDENTS.filter((p) => p.rarity !== 'starter' && p.rarity !== 'special'),
    enemiesBy: (act, kind) => ALL_ENEMIES.filter((e) => e.act === act && e.kind === kind),
    boss: (act) => ALL_ENEMIES.find((e) => e.act === act && e.kind === 'boss'),
    eventsForAct: (act) => ALL_EVENTS.filter((e) => e.act === undefined || e.act === act),
    motionsByUsage: (usage) => ALL_MOTIONS.filter((m) => m.usage === usage),
    rewardableMotions: () => ALL_MOTIONS.filter((m) => m.rarity !== 'special'),
  };
}

export const DB: ContentDB = build();

// Fail fast at load if any content is malformed or references dangle.
assertValidContent({
  cards: ALL_CARDS,
  precedents: ALL_PRECEDENTS,
  enemies: ALL_ENEMIES,
  characters: ALL_CHARACTERS,
  keywords: KEYWORDS,
  events: ALL_EVENTS,
  motions: ALL_MOTIONS,
});

export {
  ALL_CARDS,
  ALL_PRECEDENTS,
  ALL_ENEMIES,
  ALL_CHARACTERS,
  ALL_EVENTS,
  ALL_MOTIONS,
  KEYWORDS,
  TUNING,
  STRINGS,
};
export type { CardDef, PrecedentDef, EnemyDef, CharacterDef, KeywordDef, EventDef, MotionDef };
