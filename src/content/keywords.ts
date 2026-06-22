import { KW } from '../engine/keywords';
import type { KeywordDef } from '../engine/types';

/**
 * Display data for every keyword/status. Mechanics live in the engine; names,
 * descriptions, tone (colour-coding) and decay flags live here.
 */
export const KEYWORDS: KeywordDef[] = [
  {
    id: KW.Sustained,
    name: 'Sustained',
    description:
      'At the start of your next argument, gain +1 mult per stack, then it is spent.',
    tone: 'good',
    accent: 'gold',
  },
  {
    id: KW.Overruled,
    name: 'Overruled',
    description: 'This card is disabled and scores nothing while Overruled.',
    tone: 'bad',
    accent: 'red',
  },
  {
    id: KW.Hearsay,
    name: 'Hearsay',
    description: 'Scores no base unless you hold at least 1 Evidence.',
    tone: 'neutral',
    accent: 'violet',
  },
  {
    id: KW.Contempt,
    name: 'Contempt',
    description: 'At the start of each round, the prosecution gains Conviction per stack. Decays by 1 each round.',
    tone: 'bad',
    accent: 'red',
    decays: true,
  },
  {
    id: KW.Rattled,
    name: 'Rattled',
    description: 'At the start of each round, lose 1 Focus per stack. Decays by 1 each round.',
    tone: 'bad',
    accent: 'orange',
    decays: true,
  },
  {
    id: KW.Composure,
    name: 'Composure',
    description: 'Your resolve. You lose the trial if Conviction reaches your Composure.',
    tone: 'good',
    accent: 'teal',
  },
  {
    id: KW.Evidence,
    name: 'Evidence',
    description: 'Banked proof. Many cards and Precedents scale with the Evidence you hold.',
    tone: 'good',
    accent: 'blue',
  },
  {
    id: KW.Leading,
    name: 'Leading',
    description: 'When scored, the next card in the argument gains +3 base.',
    tone: 'good',
    accent: 'gold',
  },
  {
    id: KW.Witness,
    name: 'Witness',
    description: 'A hostile witness adds Conviction each round until cross-examined.',
    tone: 'bad',
    accent: 'red',
  },
  {
    id: KW.Stricken,
    name: 'Stricken',
    description: 'Removed from the trial after it is played (one use).',
    tone: 'neutral',
    accent: 'grey',
  },
];
