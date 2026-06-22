import { KW } from '../../engine/keywords';
import type { EnemyDef } from '../../engine/types';

/**
 * Additional prosecution encounters (Phase 7 expansion). Two elites per act plus
 * three extra bosses, each boss carrying a `rules` mutator. Balanced against the
 * existing pools (elites ~1.6x a normal trial; bosses higher with a mutator).
 */
export const ENEMIES_2: EnemyDef[] = [
  // ───────────── Act 1 — Small Claims Court ─────────────
  {
    id: 'a1.elite.publicDefenderRival',
    name: 'Your Old Rival',
    kind: 'elite',
    act: 1,
    baseDoubtTarget: 100,
    targetRampPerRound: 4,
    maxRounds: 10,
    baseConvictionPerRound: 6,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Outmaneuver You', value: 9 },
      { weight: 2, kind: 'status', label: 'Get Under Your Skin', value: 2, status: KW.Rattled },
      { weight: 1, kind: 'raiseTarget', label: 'Raise the Stakes', value: 8 },
    ],
    flavor: 'You both made law review. Only one of you sold out.',
  },
  {
    id: 'a1.elite.crookedBailiff',
    name: 'The Crooked Bailiff',
    kind: 'elite',
    act: 1,
    baseDoubtTarget: 110,
    targetRampPerRound: 3,
    maxRounds: 10,
    baseConvictionPerRound: 7,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Stack the Deck', value: 8 },
      { weight: 2, kind: 'overrule', label: 'Lose Your Filing', value: 1 },
      {
        weight: 1,
        kind: 'witness',
        label: 'Plant a Witness',
        value: 0,
        witness: { name: 'Paid Informant', convictionPerRound: 4, health: 22 },
      },
    ],
    flavor: 'Order in the court — for the right price.',
  },
  {
    id: 'a1.boss.magistrateVole',
    name: 'Magistrate Vole',
    kind: 'boss',
    act: 1,
    baseDoubtTarget: 130,
    targetRampPerRound: 4,
    maxRounds: 11,
    baseConvictionPerRound: 6,
    rules: { composureDrainPerRound: 2 },
    intents: [
      { weight: 3, kind: 'conviction', label: 'Press the Docket', value: 10 },
      { weight: 2, kind: 'status', label: 'Rattle the Bar', value: 2, status: KW.Rattled },
      { weight: 2, kind: 'raiseTarget', label: 'Clear the Calendar', value: 9 },
    ],
    flavor: 'An impatient magistrate. You lose 2 Composure each round.',
  },

  // ───────────── Act 2 — District Court ─────────────
  {
    id: 'a2.elite.starProsecutor',
    name: 'The Star Prosecutor',
    kind: 'elite',
    act: 2,
    baseDoubtTarget: 215,
    targetRampPerRound: 6,
    maxRounds: 11,
    baseConvictionPerRound: 10,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Theatrical Closing', value: 14 },
      { weight: 2, kind: 'overrule', label: 'Grandstand', value: 2 },
      { weight: 1, kind: 'status', label: 'Belittle', value: 2, status: KW.Contempt },
    ],
    flavor: 'Never lost a case. Never let you forget it.',
  },
  {
    id: 'a2.elite.shadowSyndicate',
    name: 'The Syndicate Lawyer',
    kind: 'elite',
    act: 2,
    baseDoubtTarget: 225,
    targetRampPerRound: 5,
    maxRounds: 11,
    baseConvictionPerRound: 10,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Buried Paperwork', value: 13 },
      {
        weight: 2,
        kind: 'witness',
        label: 'Coached Witness',
        value: 0,
        witness: { name: 'Coached Witness', convictionPerRound: 7, health: 44 },
      },
      { weight: 2, kind: 'raiseTarget', label: 'Drown in Discovery', value: 13 },
    ],
    flavor: 'They never see the inside of a cell. Their clients see it for them.',
  },
  {
    id: 'a2.boss.tribunalPanel',
    name: 'The Tribunal Panel',
    kind: 'boss',
    act: 2,
    baseDoubtTarget: 255,
    targetRampPerRound: 6,
    maxRounds: 12,
    baseConvictionPerRound: 9,
    rules: { multCap: 12, convictionRamp: 1 },
    intents: [
      { weight: 3, kind: 'conviction', label: 'Unanimous Voice', value: 13 },
      { weight: 2, kind: 'overrule', label: 'Three-Judge Strike', value: 2 },
      { weight: 2, kind: 'raiseTarget', label: 'Raise the Threshold', value: 14 },
    ],
    flavor: 'Three judges, one verdict. Your mult is capped at 12.',
  },

  // ───────────── Act 3 — Supreme Court ─────────────
  {
    id: 'a3.elite.ghostWriter',
    name: 'The Ghostwriter',
    kind: 'elite',
    act: 3,
    baseDoubtTarget: 355,
    targetRampPerRound: 8,
    maxRounds: 12,
    baseConvictionPerRound: 13,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Airtight Brief', value: 18 },
      { weight: 2, kind: 'overrule', label: 'Footnote Trap', value: 3 },
      { weight: 2, kind: 'status', label: 'Cold Precision', value: 3, status: KW.Rattled },
    ],
    flavor: 'Every opinion you have ever read — they wrote half of them.',
  },
  {
    id: 'a3.elite.kingmaker',
    name: 'The Kingmaker',
    kind: 'elite',
    act: 3,
    baseDoubtTarget: 365,
    targetRampPerRound: 7,
    maxRounds: 12,
    baseConvictionPerRound: 13,
    intents: [
      { weight: 3, kind: 'conviction', label: 'Pull the Strings', value: 18 },
      {
        weight: 2,
        kind: 'witness',
        label: 'Summon a Loyalist',
        value: 0,
        witness: { name: 'Loyal Insider', convictionPerRound: 9, health: 62 },
      },
      { weight: 2, kind: 'status', label: 'Whisper Campaign', value: 3, status: KW.Contempt },
    ],
    flavor: 'They do not need to win. They decide who does.',
  },
  {
    id: 'a3.boss.theArbiter',
    name: 'The Arbiter',
    kind: 'boss',
    act: 3,
    baseDoubtTarget: 440,
    targetRampPerRound: 8,
    maxRounds: 13,
    baseConvictionPerRound: 12,
    rules: { multCap: 14, doubtDrainPerRound: 6, convictionRamp: 2 },
    intents: [
      { weight: 3, kind: 'conviction', label: 'Absolute Judgment', value: 20 },
      { weight: 2, kind: 'raiseTarget', label: 'Move the Goalposts', value: 18 },
      { weight: 2, kind: 'overrule', label: 'Final Strike', value: 3 },
      { weight: 1, kind: 'status', label: 'Crushing Doubt', value: 3, status: KW.Rattled },
    ],
    flavor: 'The final word. Mult capped at 14; you lose 6 Doubt each round.',
  },
];
