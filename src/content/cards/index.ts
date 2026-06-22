import type { CardDef } from '../../engine/types';
import { NEUTRAL_CARDS } from './neutral';
import { LITIGATOR_CARDS } from './litigator';
import { FIXER_CARDS } from './fixer';
import { SHOWMAN_CARDS } from './showman';
import { NEUTRAL_CARDS_2 } from './neutral2';
import { LITIGATOR_CARDS_2 } from './litigator2';
import { FIXER_CARDS_2 } from './fixer2';
import { SHOWMAN_CARDS_2 } from './showman2';

export const ALL_CARDS: CardDef[] = [
  ...NEUTRAL_CARDS,
  ...NEUTRAL_CARDS_2,
  ...LITIGATOR_CARDS,
  ...LITIGATOR_CARDS_2,
  ...FIXER_CARDS,
  ...FIXER_CARDS_2,
  ...SHOWMAN_CARDS,
  ...SHOWMAN_CARDS_2,
];

export { NEUTRAL_CARDS, LITIGATOR_CARDS, FIXER_CARDS, SHOWMAN_CARDS };
