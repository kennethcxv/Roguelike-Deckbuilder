import { makeCardInstance } from '../engine';
import type { CardInstance, CharacterDef } from '../engine';

/** Build a fresh list of card instances from a character's starting deck. */
export function deckFromStarting(character: CharacterDef): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const sc of character.startingDeck) {
    for (let i = 0; i < sc.count; i++) deck.push(makeCardInstance(sc.cardId));
  }
  return deck;
}

/** Build a deck from an explicit list of card ids. */
export function deckFromIds(ids: string[]): CardInstance[] {
  return ids.map((id) => makeCardInstance(id));
}

export function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
