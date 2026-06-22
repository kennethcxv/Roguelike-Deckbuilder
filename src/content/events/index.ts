import type { EventDef } from '../../engine/types';

/**
 * Branching recess events. Each option lists run-level outcomes; requirements gate
 * options on Retainer/Composure. Phase 7 expands this past 15.
 */
export const ALL_EVENTS: EventDef[] = [
  {
    id: 'ev.nervousWitness',
    name: 'The Nervous Witness',
    text: 'A key witness corners you in the hall. For the right price, their memory could get... foggy.',
    options: [
      {
        label: 'Pay them off (−30 Retainer)',
        description: 'Lose 30 Retainer. Gain a Precedent.',
        resultText: 'The witness pockets the envelope. A useful precedent falls into your lap.',
        requirement: { minRetainer: 30 },
        outcomes: [
          { kind: 'loseRetainer', amount: 30 },
          { kind: 'addPrecedent' },
        ],
      },
      {
        label: 'Refuse',
        description: 'Keep your hands clean.',
        resultText: 'You walk away. Your conscience, at least, is intact.',
        outcomes: [{ kind: 'gainMaxComposure', amount: 4 }],
      },
    ],
    flavor: 'Justice has a price. The question is who pays it.',
  },
  {
    id: 'ev.oldMentor',
    name: 'The Old Mentor',
    text: 'Your former professor invites you for a grueling practice session.',
    options: [
      {
        label: 'Train hard (−8 Composure)',
        description: 'Lose 8 Composure. Upgrade a random card.',
        resultText: 'Exhausted but sharper, you leave with a refined argument.',
        outcomes: [
          { kind: 'loseComposure', amount: 8 },
          { kind: 'upgradeRandomCard' },
        ],
      },
      {
        label: 'Catch up over coffee',
        description: 'Heal 15 Composure.',
        resultText: 'Old stories and warm coffee restore your nerve.',
        outcomes: [{ kind: 'healComposure', amount: 15 }],
      },
    ],
    flavor: '"You were always too clever for your own good."',
  },
  {
    id: 'ev.shadyFixer',
    name: 'A Shady Offer',
    text: 'A man in a sharp suit slides a folder across the table.',
    options: [
      {
        label: 'Take the file (−6 Composure)',
        description: 'Lose 6 Composure. Add a random card to your deck.',
        resultText: 'The contents are... persuasive. You add it to your arsenal.',
        outcomes: [
          { kind: 'loseComposure', amount: 6 },
          { kind: 'addRandomCard' },
        ],
      },
      {
        label: 'Demand payment instead',
        description: 'Gain 45 Retainer.',
        resultText: 'You name a price. He pays it without blinking.',
        outcomes: [{ kind: 'gainRetainer', amount: 45 }],
      },
    ],
    flavor: 'Everyone has an angle.',
  },
  {
    id: 'ev.pressConference',
    name: 'The Press Conference',
    text: 'Cameras flash. The narrative is yours to shape.',
    options: [
      {
        label: 'Make a bold claim',
        description: 'Gain 6 max Composure, but add an Unsubstantiated Rumor to your deck.',
        resultText: 'The headlines love you. The substance is thinner.',
        outcomes: [
          { kind: 'gainMaxComposure', amount: 6 },
          { kind: 'addCard', cardId: 'neutral.rumor' },
        ],
      },
      {
        label: 'No comment',
        description: 'Gain 25 Retainer from a grateful client.',
        resultText: 'Discretion pays. Literally.',
        outcomes: [{ kind: 'gainRetainer', amount: 25 }],
      },
    ],
    flavor: 'Trial by media is still a trial.',
  },
  {
    id: 'ev.dustyArchive',
    name: 'The Dusty Archive',
    text: 'A forgotten basement full of case files. Some might be useful. Some might be junk.',
    options: [
      {
        label: 'Dig through it',
        description: 'Add a random card to your deck.',
        resultText: 'Buried among the dross, a real gem.',
        outcomes: [{ kind: 'addRandomCard' }],
      },
      {
        label: 'Tidy your case (remove a card)',
        description: 'Remove a random card from your deck.',
        resultText: 'You shed the dead weight.',
        outcomes: [{ kind: 'removeRandomCard' }],
      },
      {
        label: 'Sell the rare finds',
        description: 'Gain 30 Retainer.',
        resultText: 'A collector pays handsomely.',
        outcomes: [{ kind: 'gainRetainer', amount: 30 }],
      },
    ],
    flavor: 'History repeats — if you can find it.',
  },
  {
    id: 'ev.streetGamble',
    name: 'The Courthouse Steps',
    text: 'A paralegal bets you can’t win your next argument cold. Care to wager your reputation?',
    options: [
      {
        label: 'Take the bet',
        description: 'Lose 20 Retainer, but gain a Motion.',
        resultText: 'You talk circles around them. A useful motion is your prize.',
        requirement: { minRetainer: 20 },
        outcomes: [
          { kind: 'loseRetainer', amount: 20 },
          { kind: 'addMotion' },
        ],
      },
      {
        label: 'Decline politely',
        description: 'Nothing ventured.',
        resultText: 'You smile and move along.',
        outcomes: [{ kind: 'nothing' }],
      },
    ],
    flavor: 'The house always wins. Be the house.',
  },
];
