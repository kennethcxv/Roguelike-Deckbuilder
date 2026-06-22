import { KW } from '../../engine/keywords';
import type { PrecedentDef } from '../../engine/types';

/**
 * Precedents (relics). Deliberately built to INTERACT and seed broken-build
 * archetypes: Evidence, Object/Discard, Sustained, and Big-Play engines.
 */
export const ALL_PRECEDENTS: PrecedentDef[] = [
  // ── Generic value ──
  {
    id: 'prec.scholarlyCitation',
    name: 'Scholarly Citation',
    rarity: 'common',
    text: 'Whenever a card is scored, gain +1 base.',
    tags: ['value'],
    hooks: { onCardScored: { effects: [{ op: 'addBase', amount: 1 }] } },
    flavor: 'Footnotes for days.',
  },
  {
    id: 'prec.silverTongue',
    name: 'Silver Tongue',
    rarity: 'common',
    text: 'At the start of each argument, gain +1 mult.',
    tags: ['mult'],
    hooks: { onArgumentStart: { effects: [{ op: 'addMult', amount: 1 }] } },
    flavor: 'Butter would not melt.',
  },
  {
    id: 'prec.contingencyFee',
    name: 'Contingency Fee',
    rarity: 'common',
    text: 'After each argument, gain 4 Retainer.',
    tags: ['economy'],
    hooks: { onArgumentEnd: { effects: [{ op: 'gainRetainer', amount: 4 }] } },
    flavor: 'No win, no fee. Mostly win.',
  },
  {
    id: 'prec.pocketWatch',
    name: 'Pocket Watch',
    rarity: 'common',
    text: 'At the start of each round, draw 1 card.',
    tags: ['draw'],
    hooks: { onRoundStart: { effects: [{ op: 'drawCards', amount: 1 }] } },
    flavor: 'Tempus fugit.',
  },

  // ── Evidence engine ──
  {
    id: 'prec.chainOfCustody',
    name: 'Chain of Custody',
    rarity: 'uncommon',
    text: 'During summation, gain +1 mult per 2 Evidence you hold.',
    tags: ['evidence', 'engine'],
    hooks: {
      onArgumentTally: { effects: [{ op: 'addMultPer', per: 0.5, source: { kind: 'evidence' } }] },
    },
    flavor: 'Signed, sealed, admissible.',
  },
  {
    id: 'prec.forensicAccountant',
    name: 'Forensic Accountant',
    rarity: 'uncommon',
    text: 'Whenever an Evidence card is scored, gain 1 Evidence.',
    tags: ['evidence', 'engine'],
    hooks: {
      onCardScored: {
        condition: { kind: 'cardHasCategory', category: 'Evidence' },
        effects: [{ op: 'gainEvidence', amount: 1 }],
      },
    },
    flavor: 'Follow the money.',
  },
  {
    id: 'prec.evidenceLocker',
    name: 'Evidence Locker',
    rarity: 'common',
    text: 'At the start of each round, gain 1 Evidence.',
    tags: ['evidence'],
    hooks: { onRoundStart: { effects: [{ op: 'gainEvidence', amount: 1 }] } },
    flavor: 'Room B-12. Bring a key.',
  },

  // ── Object / Discard engine ──
  {
    id: 'prec.paperTrail',
    name: 'Paper Trail',
    rarity: 'uncommon',
    text: 'Whenever you Object (discard), gain 1 Evidence.',
    tags: ['discard', 'evidence', 'engine'],
    hooks: { onDiscard: { effects: [{ op: 'gainEvidence', amount: 1 }] } },
    flavor: 'Every shredder leaves confetti.',
  },
  {
    id: 'prec.billableHours',
    name: 'Billable Hours',
    rarity: 'common',
    text: 'After each argument, gain 2 Retainer per Objection used this round.',
    tags: ['discard', 'economy'],
    hooks: {
      onArgumentEnd: { effects: [{ op: 'gainRetainer', amount: 2 }] },
    },
    flavor: 'Six-minute increments.',
  },

  // ── Sustained engine ──
  {
    id: 'prec.buildingMomentum',
    name: 'Building Momentum',
    rarity: 'uncommon',
    text: 'At the start of each argument, gain 1 Sustained.',
    tags: ['sustained', 'engine'],
    hooks: {
      onArgumentStart: {
        effects: [{ op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 1 }],
      },
    },
    flavor: 'A snowball at the top of a hill.',
  },
  {
    id: 'prec.crescendoCoach',
    name: 'Crescendo Coach',
    rarity: 'rare',
    text: 'At the start of each argument, if you hold 3+ Sustained, gain +4 mult.',
    tags: ['sustained', 'engine'],
    hooks: {
      onArgumentStart: {
        condition: { kind: 'hasStatus', target: 'self', status: KW.Sustained, atLeast: 3 },
        effects: [{ op: 'addMult', amount: 4 }],
      },
    },
    flavor: 'From the diaphragm!',
  },

  // ── Big-play engine ──
  {
    id: 'prec.starPower',
    name: 'Star Power',
    rarity: 'rare',
    text: 'During summation, if your argument has 4+ cards, double your mult.',
    tags: ['bigplay', 'engine'],
    hooks: {
      onArgumentTally: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'argumentSize' }, amount: 4 },
        effects: [{ op: 'mulMult', factor: 2 }],
      },
    },
    flavor: 'They came to see a show.',
  },
  {
    id: 'prec.spotlight',
    name: 'The Spotlight',
    rarity: 'uncommon',
    text: 'During summation, gain +2 base per card in your argument.',
    tags: ['bigplay'],
    hooks: {
      onArgumentTally: { effects: [{ op: 'addBasePer', per: 2, source: { kind: 'argumentSize' } }] },
    },
    flavor: 'Hit your mark.',
  },

  // ── Defensive / tempo ──
  {
    id: 'prec.devilsAdvocate',
    name: "Devil's Advocate",
    rarity: 'uncommon',
    text: 'At the start of each trial, gain 3 Sustained.',
    tags: ['sustained', 'tempo'],
    hooks: {
      onTrialStart: {
        effects: [{ op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 3 }],
      },
    },
    flavor: 'Someone has to say it.',
  },
  {
    id: 'prec.steelNerves',
    name: 'Nerves of Steel',
    rarity: 'common',
    text: 'At the start of each round, gain 3 Composure.',
    tags: ['defense'],
    hooks: { onRoundStart: { effects: [{ op: 'gainComposure', amount: 3 }] } },
    flavor: 'Unflappable.',
  },
  {
    id: 'prec.everyThird',
    name: 'Rule of Three',
    rarity: 'rare',
    text: 'Every 3rd card you score, gain +10 base.',
    tags: ['value', 'engine'],
    hooks: { onCardScored: { everyN: 3, effects: [{ op: 'addBase', amount: 10 }] } },
    flavor: 'Tell them, tell them again, tell them you told them.',
  },
];
