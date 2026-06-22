import type { CharacterDef } from '../engine/types';

/** Playable attorneys. Each has a unique starting deck, signature mechanic, and unlock. */
export const ALL_CHARACTERS: CharacterDef[] = [
  {
    id: 'litigator',
    name: 'Vivian Cross',
    title: 'The Litigator',
    description:
      'A relentless trial lawyer who turns momentum into devastating multipliers. Stack Sustained, then unleash.',
    signature: 'Sustained mult engine — build charge, then multiply.',
    startingDeck: [
      { cardId: 'lit.openingStatement', count: 4 },
      { cardId: 'lit.crescendo', count: 3 },
      { cardId: 'lit.relentless', count: 1 },
      { cardId: 'lit.buildup', count: 1 },
      { cardId: 'neutral.objection', count: 1 },
    ],
    startingPrecedents: ['prec.buildingMomentum'],
    startingComposure: 60,
    startingRetainer: 0,
    unlock: { kind: 'default' },
    color: 'crimson',
  },
  {
    id: 'fixer',
    name: 'Marcus Vale',
    title: 'The Fixer',
    description:
      'A man with a dossier on everyone. Cycle and discard to bank Evidence, then cash it in for an airtight case.',
    signature: 'Object/discard engine — discarding fuels Evidence and base.',
    startingDeck: [
      { cardId: 'fix.openingBrief', count: 4 },
      { cardId: 'fix.plant', count: 2 },
      { cardId: 'fix.dossier', count: 1 },
      { cardId: 'neutral.precedentCite', count: 2 },
      { cardId: 'neutral.objection', count: 1 },
    ],
    startingPrecedents: ['prec.paperTrail'],
    startingComposure: 62,
    startingRetainer: 0,
    unlock: { kind: 'winAct', act: 1 },
    color: 'forest',
  },
  {
    id: 'showman',
    name: 'Dazzle Beaumont',
    title: 'The Showman',
    description:
      'A courtroom magician who lives for the big reveal. Load up one enormous argument and bring the house down.',
    signature: 'Big-play engine — one giant argument wins the room.',
    startingDeck: [
      { cardId: 'show.openingFlair', count: 4 },
      { cardId: 'show.theatrics', count: 3 },
      { cardId: 'show.bombshell', count: 1 },
      { cardId: 'neutral.flourish', count: 1 },
      { cardId: 'neutral.objection', count: 1 },
    ],
    startingPrecedents: ['prec.spotlight'],
    startingComposure: 56,
    startingRetainer: 0,
    unlock: { kind: 'singleArgument', doubt: 250 },
    color: 'violet',
  },
];
