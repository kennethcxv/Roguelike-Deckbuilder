import type { MotionDef } from '../engine/types';
import { KW } from '../engine/keywords';

/** Additional one-shot consumables (Phase 7 expansion). Mix of combat and map usage. */
export const MOTIONS_2: MotionDef[] = [
  {
    id: 'mo.objectionShout',
    name: 'Forceful Objection',
    rarity: 'common',
    text: 'Apply 2 Rattled to the prosecution and reduce Conviction by 8.',
    usage: 'combat',
    combatEffects: [
      { op: 'applyStatus', target: 'prosecution', status: KW.Rattled, amount: 2 },
      { op: 'reduceConviction', amount: 8 },
    ],
    cost: 45,
    flavor: 'Objection! Sit down. Objection!',
  },
  {
    id: 'mo.discovery',
    name: 'Motion for Discovery',
    rarity: 'uncommon',
    text: 'Gain 5 Evidence and draw 1 card.',
    usage: 'combat',
    combatEffects: [
      { op: 'gainEvidence', amount: 5 },
      { op: 'drawCards', amount: 1 },
    ],
    cost: 60,
    flavor: 'Turn over everything. We will find the cracks.',
  },
  {
    id: 'mo.closingFlourish',
    name: 'Closing Flourish',
    rarity: 'rare',
    text: 'Gain 6 Sustained, 2 Focus, and raise 30 Doubt immediately.',
    usage: 'combat',
    combatEffects: [
      { op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 6 },
      { op: 'gainFocus', amount: 2 },
      { op: 'raiseDoubt', amount: 30 },
    ],
    cost: 80,
    flavor: 'And that, ladies and gentlemen, is reasonable doubt.',
  },
  {
    id: 'mo.pleaBargain',
    name: 'Plea Bargain',
    rarity: 'common',
    text: 'Gain 40 Retainer (used on the map).',
    usage: 'map',
    mapOutcomes: [{ kind: 'gainRetainer', amount: 40 }],
    cost: 45,
    flavor: 'Everybody wins. Mostly you.',
  },
  {
    id: 'mo.pretrialPrep',
    name: 'Pretrial Preparation',
    rarity: 'uncommon',
    text: 'Heal 14 Composure and add a random card to your deck (used on the map).',
    usage: 'map',
    mapOutcomes: [
      { kind: 'healComposure', amount: 14 },
      { kind: 'addRandomCard' },
    ],
    cost: 70,
    flavor: 'Fail to prepare; prepare to fail.',
  },
  {
    id: 'mo.landmarkRuling',
    name: 'Cite a Landmark Ruling',
    rarity: 'rare',
    text: 'Add a Precedent to your collection (used on the map).',
    usage: 'map',
    mapOutcomes: [{ kind: 'addPrecedent' }],
    cost: 75,
    flavor: 'As established in the case that changed everything.',
  },
];
