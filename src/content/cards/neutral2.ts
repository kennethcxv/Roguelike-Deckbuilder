import { KW } from '../../engine/keywords';
import type { CardDef } from '../../engine/types';
import { mkCard } from './_factory';

/** Neutral cards, second set — available to every attorney. Courtroom defense staples. */
export const NEUTRAL_CARDS_2: CardDef[] = [
  // ── Base-scalers ──────────────────────────────────────────────
  mkCard({
    id: 'neutral.statementOfFacts',
    name: 'Statement of Facts',
    category: 'Statement',
    rarity: 'common',
    base: 8,
    text: 'Score 8 base.',
    upgrade: { name: 'Statement of Facts+', base: 12, text: 'Score 12 base.' },
    flavor: 'The undisputed timeline, laid bare.',
  }),
  mkCard({
    id: 'neutral.affidavit',
    name: 'Sworn Affidavit',
    category: 'Evidence',
    rarity: 'common',
    base: 7,
    onScore: [{ op: 'gainComposure', amount: 2 }],
    text: 'Score 7 base. Gain 2 Composure.',
    upgrade: {
      name: 'Sworn Affidavit+',
      base: 9,
      onScore: [{ op: 'gainComposure', amount: 3 }],
      text: 'Score 9 base. Gain 3 Composure.',
    },
    flavor: 'Signed, sealed, notarized.',
  }),
  mkCard({
    id: 'neutral.deposition',
    name: 'Deposition',
    category: 'Cross',
    rarity: 'common',
    base: 6,
    onScore: [{ op: 'addBasePer', per: 2, source: { kind: 'handSize' } }],
    text: 'Score 6 base, plus 2 base per card in your hand.',
    upgrade: {
      name: 'Deposition+',
      base: 8,
      onScore: [{ op: 'addBasePer', per: 3, source: { kind: 'handSize' } }],
      text: 'Score 8 base, plus 3 base per card in your hand.',
    },
    flavor: 'On the record, under oath.',
  }),

  // ── Mult cards ───────────────────────────────────────────────
  mkCard({
    id: 'neutral.appealToReason',
    name: 'Appeal to Reason',
    category: 'Rhetoric',
    rarity: 'common',
    base: 3,
    mult: 1,
    text: 'Score 3 base and +1 mult.',
    upgrade: {
      name: 'Appeal to Reason+',
      base: 4,
      mult: 2,
      text: 'Score 4 base and +2 mult.',
    },
    flavor: 'Surely you can see it too.',
  }),
  mkCard({
    id: 'neutral.summation',
    name: 'Measured Summation',
    category: 'Closing',
    rarity: 'uncommon',
    focusCost: 2,
    mult: 2,
    onScore: [{ op: 'addMultPer', per: 1, source: { kind: 'evidence' } }],
    text: 'Score +2 mult, plus 1 mult per Evidence you hold.',
    upgrade: {
      name: 'Measured Summation+',
      mult: 3,
      onScore: [{ op: 'addMultPer', per: 1, source: { kind: 'evidence' } }],
      text: 'Score +3 mult, plus 1 mult per Evidence you hold.',
    },
    flavor: 'Let me restate, point by point.',
  }),

  // ── Evidence synergy ─────────────────────────────────────────
  mkCard({
    id: 'neutral.chainOfCustody',
    name: 'Chain of Custody',
    category: 'Evidence',
    rarity: 'common',
    base: 5,
    onScore: [{ op: 'gainEvidence', amount: 2 }],
    text: 'Score 5 base. Gain 2 Evidence.',
    upgrade: {
      name: 'Chain of Custody+',
      base: 7,
      onScore: [{ op: 'gainEvidence', amount: 2 }],
      text: 'Score 7 base. Gain 2 Evidence.',
    },
    flavor: 'Bagged, tagged, and accounted for.',
  }),
  mkCard({
    id: 'neutral.forensicReport',
    name: 'Forensic Report',
    category: 'Evidence',
    rarity: 'uncommon',
    focusCost: 2,
    base: 6,
    onScore: [
      {
        op: 'conditional',
        condition: { kind: 'sourceAtLeast', source: { kind: 'evidence' }, amount: 3 },
        then: [{ op: 'addBase', amount: 12 }],
      },
    ],
    text: 'Score 6 base. If you hold at least 3 Evidence, score 12 more base.',
    upgrade: {
      name: 'Forensic Report+',
      base: 8,
      onScore: [
        {
          op: 'conditional',
          condition: { kind: 'sourceAtLeast', source: { kind: 'evidence' }, amount: 3 },
          then: [{ op: 'addBase', amount: 16 }],
        },
      ],
      text: 'Score 8 base. If you hold at least 3 Evidence, score 16 more base.',
    },
    flavor: 'The lab results speak for themselves.',
  }),

  // ── Hearsay card ─────────────────────────────────────────────
  mkCard({
    id: 'neutral.anonymousTip',
    name: 'Anonymous Tip',
    category: 'Statement',
    rarity: 'common',
    base: 16,
    keywords: [KW.Hearsay],
    text: 'Score 16 base. Hearsay — scores 0 base unless you hold at least 1 Evidence.',
    upgrade: {
      name: 'Anonymous Tip+',
      base: 22,
      text: 'Score 22 base. Hearsay — scores 0 base unless you hold at least 1 Evidence.',
    },
    flavor: 'The caller declined to give a name.',
  }),

  // ── Leading card ─────────────────────────────────────────────
  mkCard({
    id: 'neutral.suggestiveQuestion',
    name: 'Suggestive Question',
    category: 'Cross',
    rarity: 'uncommon',
    base: 5,
    keywords: [KW.Leading],
    onScore: [{ op: 'gainEvidence', amount: 1 }],
    text: 'Score 5 base. Gain 1 Evidence. Leading — the next scored card gets +3 base.',
    upgrade: {
      name: 'Suggestive Question+',
      base: 8,
      onScore: [{ op: 'gainEvidence', amount: 1 }],
      text: 'Score 8 base. Gain 1 Evidence. Leading — the next scored card gets +3 base.',
    },
    flavor: "You'd agree that's exactly what happened?",
  }),

  // ── Draw / economy / utility actions ─────────────────────────
  mkCard({
    id: 'neutral.paralegal',
    name: 'Paralegal Assist',
    kind: 'action',
    category: 'Tactic',
    rarity: 'common',
    onPlay: [
      { op: 'drawCards', amount: 1 },
      { op: 'gainFocus', amount: 1 },
    ],
    text: 'Draw 1 card. Gain 1 Focus.',
    upgrade: {
      name: 'Paralegal Assist+',
      onPlay: [
        { op: 'drawCards', amount: 2 },
        { op: 'gainFocus', amount: 1 },
      ],
      text: 'Draw 2 cards. Gain 1 Focus.',
    },
    flavor: 'Already pulled the files you needed.',
  }),
  mkCard({
    id: 'neutral.recess',
    name: 'Brief Recess',
    kind: 'action',
    category: 'Tactic',
    rarity: 'common',
    focusCost: 0,
    onPlay: [
      { op: 'gainFocus', amount: 1 },
      { op: 'drawCards', amount: 1 },
    ],
    text: 'Costs 0 Focus. Gain 1 Focus, then draw 1 card.',
    upgrade: {
      name: 'Brief Recess+',
      onPlay: [
        { op: 'gainFocus', amount: 2 },
        { op: 'drawCards', amount: 1 },
      ],
      text: 'Costs 0 Focus. Gain 2 Focus, then draw 1 card.',
    },
    flavor: "We'll reconvene after lunch.",
  }),

  // ── Objection action ─────────────────────────────────────────
  mkCard({
    id: 'neutral.motionToStrike',
    name: 'Motion to Strike',
    kind: 'action',
    category: 'Objection',
    rarity: 'uncommon',
    onPlay: [
      { op: 'reduceConviction', amount: 9 },
      { op: 'gainComposure', amount: 3 },
    ],
    text: 'Reduce Conviction by 9. Gain 3 Composure.',
    upgrade: {
      name: 'Motion to Strike+',
      onPlay: [
        { op: 'reduceConviction', amount: 13 },
        { op: 'gainComposure', amount: 4 },
      ],
      text: 'Reduce Conviction by 13. Gain 4 Composure.',
    },
    flavor: 'Strike that from the record.',
  }),

  // ── Composure action ─────────────────────────────────────────
  mkCard({
    id: 'neutral.collectYourself',
    name: 'Collect Yourself',
    kind: 'action',
    category: 'Tactic',
    rarity: 'common',
    onPlay: [
      { op: 'gainComposure', amount: 6 },
      { op: 'drawCards', amount: 1 },
    ],
    text: 'Gain 6 Composure. Draw 1 card.',
    upgrade: {
      name: 'Collect Yourself+',
      onPlay: [
        { op: 'gainComposure', amount: 9 },
        { op: 'drawCards', amount: 1 },
      ],
      text: 'Gain 9 Composure. Draw 1 card.',
    },
    flavor: 'Straighten the tie. Square the shoulders.',
  }),

  // ── Rare combo / payoff cards ────────────────────────────────
  mkCard({
    id: 'neutral.airtightCase',
    name: 'Airtight Case',
    category: 'Closing',
    rarity: 'rare',
    focusCost: 2,
    base: 10,
    onScore: [{ op: 'addBasePer', per: 4, source: { kind: 'argumentSize' } }],
    text: 'Score 10 base, plus 4 base per card in this argument.',
    upgrade: {
      name: 'Airtight Case+',
      base: 14,
      onScore: [{ op: 'addBasePer', per: 5, source: { kind: 'argumentSize' } }],
      text: 'Score 14 base, plus 5 base per card in this argument.',
    },
    flavor: 'Not a single loose thread remains.',
  }),
  mkCard({
    id: 'neutral.reasonableDoubt',
    name: 'Reasonable Doubt',
    category: 'Closing',
    rarity: 'rare',
    focusCost: 2,
    base: 6,
    mult: 1,
    onScore: [{ op: 'addMultPer', per: 1, source: { kind: 'cardsPlayedThisRound' } }],
    keywords: [KW.Stricken],
    exhausts: true,
    text: 'Score 6 base and +1 mult, plus 1 mult per card already played this round. Stricken.',
    flavor: 'That doubt, members of the jury, is reasonable.',
  }),
];
