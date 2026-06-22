import type { CardDef } from '../../engine/types';
import { NEUTRAL_CARDS } from './neutral';
import { LITIGATOR_CARDS } from './litigator';
import { FIXER_CARDS } from './fixer';
import { SHOWMAN_CARDS } from './showman';

export const ALL_CARDS: CardDef[] = [
  ...NEUTRAL_CARDS,
  ...LITIGATOR_CARDS,
  ...FIXER_CARDS,
  ...SHOWMAN_CARDS,
];

export { NEUTRAL_CARDS, LITIGATOR_CARDS, FIXER_CARDS, SHOWMAN_CARDS };
