import type { CardDef } from '../../engine/types';

const DEFAULTS: Omit<CardDef, 'id' | 'name'> = {
  kind: 'argument',
  category: 'Statement',
  rarity: 'common',
  character: 'neutral',
  focusCost: 1,
  base: 0,
  mult: 0,
  keywords: [],
  tags: [],
  text: '',
};

/** Create a CardDef with sensible defaults; only id and name are required. */
export function mkCard(def: Partial<CardDef> & Pick<CardDef, 'id' | 'name'>): CardDef {
  return { ...DEFAULTS, ...def };
}
