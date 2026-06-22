import type { EventDef } from '../../engine/types';

/**
 * Additional branching recess events (Phase 7 expansion). Same shape as ALL_EVENTS:
 * each option lists run-level outcomes; requirements gate options on Retainer/Composure.
 */
export const EVENTS_2: EventDef[] = [
  {
    id: 'ev.juryTampering',
    name: 'A Word with the Jury',
    text: 'A juror lingers by the vending machines, eager to chat about the case they are sworn not to discuss.',
    options: [
      {
        label: 'Whisper your theory (−10 Composure)',
        description: 'Lose 10 Composure. Gain a Precedent.',
        resultText: 'They nod along. Whatever you said, it stuck — and so did a precedent.',
        outcomes: [
          { kind: 'loseComposure', amount: 10 },
          { kind: 'addPrecedent' },
        ],
      },
      {
        label: 'Report the contact',
        description: 'Gain 6 max Composure for doing it by the book.',
        resultText: 'You flag it to the bailiff. The judge commends your candor.',
        outcomes: [{ kind: 'gainMaxComposure', amount: 6 }],
      },
      {
        label: 'Quietly walk away',
        description: 'Nothing happens.',
        resultText: 'You pretend you never heard a thing.',
        outcomes: [{ kind: 'nothing' }],
      },
    ],
    flavor: 'Twelve angry people. One of them talks too much.',
  },
  {
    id: 'ev.paralegalGift',
    name: 'The Eager Paralegal',
    text: 'A junior paralegal has stayed up all night assembling research for you, free of charge.',
    options: [
      {
        label: 'Accept their work',
        description: 'Add a random card to your deck.',
        resultText: 'Their notes are immaculate. You fold them into your case.',
        outcomes: [{ kind: 'addRandomCard' }],
      },
      {
        label: 'Tip them generously (−20 Retainer)',
        description: 'Lose 20 Retainer. Heal 12 Composure from the goodwill.',
        resultText: 'You slip them a bonus. Their gratitude steadies your nerves.',
        requirement: { minRetainer: 20 },
        outcomes: [
          { kind: 'loseRetainer', amount: 20 },
          { kind: 'healComposure', amount: 12 },
        ],
      },
    ],
    flavor: 'Ambition is cheaper than experience.',
  },
  {
    id: 'ev.barComplaint',
    name: 'The Bar Complaint',
    text: 'An old rival has filed an ethics complaint against you. Settling it will cost you.',
    options: [
      {
        label: 'Hire counsel (−40 Retainer)',
        description: 'Lose 40 Retainer. Gain 8 max Composure once cleared.',
        resultText: 'Your lawyer makes it vanish. You sleep easier.',
        requirement: { minRetainer: 40 },
        outcomes: [
          { kind: 'loseRetainer', amount: 40 },
          { kind: 'gainMaxComposure', amount: 8 },
        ],
      },
      {
        label: 'Represent yourself (−14 Composure)',
        description: 'Lose 14 Composure from the stress, but lose no Retainer.',
        resultText: 'You argue your own case. It is grueling, but you prevail.',
        outcomes: [{ kind: 'loseComposure', amount: 14 }],
      },
    ],
    flavor: 'The accuser becomes the accused.',
  },
  {
    id: 'ev.evidenceLocker',
    name: 'The Evidence Locker',
    text: 'A sympathetic clerk leaves the evidence locker unlocked. You have a few minutes alone.',
    options: [
      {
        label: 'Borrow a file (−8 Composure)',
        description: 'Lose 8 Composure. Gain a Motion.',
        resultText: 'You photograph what you need and slip out. A useful motion is yours.',
        outcomes: [
          { kind: 'loseComposure', amount: 8 },
          { kind: 'addMotion' },
        ],
      },
      {
        label: 'Reorganize your own files',
        description: 'Remove a random card from your deck.',
        resultText: 'You take the moment to discard what no longer serves you.',
        outcomes: [{ kind: 'removeRandomCard' }],
      },
      {
        label: 'Lock it back up',
        description: 'Gain 4 max Composure for your integrity.',
        resultText: 'You close the door. Some lines you will not cross.',
        outcomes: [{ kind: 'gainMaxComposure', amount: 4 }],
      },
    ],
    flavor: 'Opportunity knocks. Temptation answers.',
  },
  {
    id: 'ev.retainerDispute',
    name: 'The Unpaid Client',
    text: 'A wealthy client refuses to pay until you sweeten the deal. They want a favor.',
    options: [
      {
        label: 'Do the favor',
        description: 'Gain 50 Retainer, but add an Unsubstantiated Rumor to your deck.',
        resultText: 'You bend the truth in their filing. The check clears — with strings attached.',
        outcomes: [
          { kind: 'gainRetainer', amount: 50 },
          { kind: 'addCard', cardId: 'neutral.rumor' },
        ],
      },
      {
        label: 'Hold firm on your fee',
        description: 'Gain 20 Retainer. Keep your record clean.',
        resultText: 'They grumble but pay the agreed amount. No more, no less.',
        outcomes: [{ kind: 'gainRetainer', amount: 20 }],
      },
    ],
    flavor: 'He who pays the piper calls the tune.',
  },
  {
    id: 'ev.lawLibrary',
    name: 'The Law Library',
    text: 'Rows of leather-bound volumes await. Hours here could sharpen any argument.',
    options: [
      {
        label: 'Study a precedent',
        description: 'Add a Precedent to your collection.',
        resultText: 'A landmark ruling, perfectly on point. You commit it to memory.',
        outcomes: [{ kind: 'addPrecedent' }],
      },
      {
        label: 'Refine an argument (−6 Composure)',
        description: 'Lose 6 Composure. Upgrade a random card.',
        resultText: 'You burn the midnight oil and emerge with a sharper play.',
        outcomes: [
          { kind: 'loseComposure', amount: 6 },
          { kind: 'upgradeRandomCard' },
        ],
      },
    ],
    flavor: 'The answer is always in the books. Eventually.',
  },
  {
    id: 'ev.disbarredVeteran',
    name: 'The Disbarred Veteran',
    text: 'A washed-up attorney offers to teach you a trick the bar would never approve of.',
    options: [
      {
        label: 'Learn the trick (−25 Retainer)',
        description: 'Lose 25 Retainer. Transform a random card into something stronger.',
        resultText: 'The old shark reshapes one of your plays into something far nastier.',
        requirement: { minRetainer: 25 },
        outcomes: [
          { kind: 'loseRetainer', amount: 25 },
          { kind: 'transformRandomCard' },
        ],
      },
      {
        label: 'Buy them a meal instead',
        description: 'Lose 10 Retainer. Heal 18 Composure from the company.',
        resultText: 'You share a meal and old war stories. You leave lighter.',
        requirement: { minRetainer: 10 },
        outcomes: [
          { kind: 'loseRetainer', amount: 10 },
          { kind: 'healComposure', amount: 18 },
        ],
      },
      {
        label: 'Decline the lesson',
        description: 'Nothing ventured.',
        resultText: 'You thank them and move on.',
        outcomes: [{ kind: 'nothing' }],
      },
    ],
    flavor: 'They knew every rule — that is how they learned to break them.',
  },
  {
    id: 'ev.courthouseFire',
    name: 'The Courthouse Fire',
    text: 'Smoke fills the records wing. Files are burning. You could grab something — or someone.',
    options: [
      {
        label: 'Save the files (−12 Composure)',
        description: 'Lose 12 Composure from smoke and panic. Add a rare random card.',
        resultText: 'You stagger out coughing, clutching an irreplaceable document.',
        outcomes: [
          { kind: 'loseComposure', amount: 12 },
          { kind: 'addRandomCard', rarity: 'rare' },
        ],
      },
      {
        label: 'Help evacuate everyone',
        description: 'Gain 10 max Composure. The clerks owe you their lives.',
        resultText: 'You guide the staff to safety. Word of your courage spreads.',
        outcomes: [{ kind: 'gainMaxComposure', amount: 10 }],
      },
    ],
    flavor: 'When the records burn, only memory remains.',
  },
  {
    id: 'ev.anonymousTip',
    name: 'The Anonymous Tip',
    text: 'A plain envelope appears on your desk. No return address. Just a name and a hint.',
    options: [
      {
        label: 'Follow the lead',
        description: 'Gain a Motion and a random card, but lose 16 Composure chasing shadows.',
        resultText: 'The tip pans out spectacularly — though the paranoia lingers.',
        outcomes: [
          { kind: 'loseComposure', amount: 16 },
          { kind: 'addMotion' },
          { kind: 'addRandomCard' },
        ],
      },
      {
        label: 'Shred it',
        description: 'Heal 8 Composure. Some doors are best left closed.',
        resultText: 'You feed it to the shredder and feel a weight lift.',
        outcomes: [{ kind: 'healComposure', amount: 8 }],
      },
    ],
    flavor: 'Information wants to be free. Freedom has a cost.',
  },
  {
    id: 'ev.judgesChambers',
    name: 'Summoned to Chambers',
    text: 'The judge wants a private word. The reason is unclear, and that worries you.',
    options: [
      {
        label: 'Plead your case (−30 Retainer)',
        description: 'Lose 30 Retainer in "court fees." Gain 12 max Composure and a Precedent.',
        resultText: 'A generous donation to the courthouse fund works wonders.',
        requirement: { minRetainer: 30 },
        outcomes: [
          { kind: 'loseRetainer', amount: 30 },
          { kind: 'gainMaxComposure', amount: 12 },
          { kind: 'addPrecedent' },
        ],
      },
      {
        label: 'Stand on principle (−8 Composure)',
        description: 'Lose 8 Composure under scrutiny, but gain a random card from the lecture.',
        resultText: 'The judge dresses you down, but lets slip a useful angle.',
        outcomes: [
          { kind: 'loseComposure', amount: 8 },
          { kind: 'addRandomCard' },
        ],
      },
    ],
    flavor: 'In chambers, the robe comes off — but the power does not.',
  },
];
