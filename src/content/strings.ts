/** Player-facing UI strings. All copy lives here so re-skinning means editing /content. */
export const STRINGS = {
  title: 'Reasonable Doubt',
  tagline: 'Build Doubt faster than the prosecution builds Conviction.',
  currency: 'Retainer',
  currencyShort: '₹',
  meters: {
    doubt: 'Doubt',
    doubtTarget: 'Acquittal at',
    conviction: 'Conviction',
    composure: 'Composure',
    evidence: 'Evidence',
    focus: 'Focus',
  },
  phases: {
    player: 'Your Move, Counselor',
    prosecution: 'The Prosecution Responds',
    won: 'Not Guilty',
    lost: 'Guilty',
  },
  buttons: {
    present: 'Rest Your Case',
    object: 'Object (Discard)',
    endTurn: 'End Turn',
    play: 'Play',
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
  },
  acts: ['Small Claims Court', 'District Court', 'Supreme Court'],
  nodeTypes: {
    trial: 'Trial',
    elite: 'Elite Trial',
    boss: 'Boss Trial',
    event: 'Recess',
    shop: 'Law Library',
    rest: 'Chambers',
  },
  verdicts: {
    win: 'The jury finds your client NOT GUILTY. Justice — for now.',
    lose: 'The gavel falls. Your client is found GUILTY. You are disbarred.',
  },
} as const;

export type Strings = typeof STRINGS;
