import { KW } from '../../engine/keywords';
import type { PrecedentDef } from '../../engine/types';

/**
 * Precedents (relics), set 2. Designed to INTERACT with and reinforce the core
 * archetypes seeded by ALL_PRECEDENTS:
 *   (1) Evidence engine        — bank, spend, and scale on Evidence
 *   (2) Object / Discard engine — payoffs for discarding (Objecting)
 *   (3) Sustained mult engine   — generate and cash in Sustained
 *   (4) Big single-argument     — reward wide arguments / argumentSize
 *   (5) retrigger & scaling     — multiplicative and per-source combos
 *
 * Includes conditional and everyN hooks, economy (Retainer) pieces, defensive
 * (Composure / reduceConviction) pieces, and a few build-around rares.
 *
 * Phase notes the values respect:
 *   - Scoring ops (addBase/addMult/mulMult/addBasePer/addMultPer/retrigger) only
 *     do anything during onArgumentStart / onCardScored / onArgumentTally.
 *   - Resource ops (gainEvidence/gainRetainer/gainComposure/drawCards/gainFocus/
 *     reduceConviction/applyStatus/...) work in any phase.
 *   - A card is in context only during onCardScored / onPlayCard / onDiscard, so
 *     card-conditions (cardHasCategory/cardHasKeyword/firstCardOfArgument) live there.
 */
export const PRECEDENTS_2: PrecedentDef[] = [
  // ─────────────────────────── COMMON (≈12) ───────────────────────────

  // (1) Evidence engine
  {
    id: 'prec.depositionTranscript',
    name: 'Deposition Transcript',
    rarity: 'common',
    text: 'During summation, gain +1 base per Evidence you hold.',
    tags: ['evidence', 'value'],
    hooks: {
      onArgumentTally: { effects: [{ op: 'addBasePer', per: 1, source: { kind: 'evidence' } }] },
    },
    flavor: 'On the record, page after page.',
  },
  {
    id: 'prec.notaryStamp',
    name: 'Notary Stamp',
    rarity: 'common',
    text: 'Whenever an Evidence card is scored, gain +2 base.',
    tags: ['evidence', 'value'],
    hooks: {
      onCardScored: {
        condition: { kind: 'cardHasCategory', category: 'Evidence' },
        effects: [{ op: 'addBase', amount: 2 }],
      },
    },
    flavor: 'Sworn, certified, undeniable.',
  },

  // (2) Object / Discard engine
  {
    id: 'prec.shredderBin',
    name: 'Shredder Bin',
    rarity: 'common',
    text: 'After each argument, if you discarded at least 1 card this round, gain 5 Retainer.',
    tags: ['discard', 'economy'],
    hooks: {
      onArgumentEnd: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'discardsThisRound' }, amount: 1 },
        effects: [{ op: 'gainRetainer', amount: 5 }],
      },
    },
    flavor: 'One office is another firm’s gold mine.',
  },
  {
    id: 'prec.redactionMarker',
    name: 'Redaction Marker',
    rarity: 'common',
    text: 'Every 2nd card you Object (discard), gain 1 Focus.',
    tags: ['discard', 'tempo'],
    hooks: {
      onDiscard: {
        everyN: 2,
        effects: [{ op: 'gainFocus', amount: 1 }],
      },
    },
    flavor: 'Strike it, and breathe.',
  },

  // (3) Sustained mult engine
  {
    id: 'prec.metronome',
    name: 'The Metronome',
    rarity: 'common',
    text: 'At the start of each round, gain 1 Sustained.',
    tags: ['sustained', 'engine'],
    hooks: {
      onRoundStart: {
        effects: [{ op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 1 }],
      },
    },
    flavor: 'Keep the rhythm of the room.',
  },
  {
    id: 'prec.openingRefrain',
    name: 'Opening Refrain',
    rarity: 'common',
    text: 'The first card you score each argument gains +4 base.',
    tags: ['value', 'tempo'],
    hooks: {
      onCardScored: {
        condition: { kind: 'firstCardOfArgument' },
        effects: [{ op: 'addBase', amount: 4 }],
      },
    },
    flavor: 'Set the tone early.',
  },

  // (4) Big single-argument engine
  {
    id: 'prec.grandstand',
    name: 'The Grandstand',
    rarity: 'common',
    text: 'During summation, if your argument has 3+ cards, gain +3 mult.',
    tags: ['bigplay'],
    hooks: {
      onArgumentTally: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'argumentSize' }, amount: 3 },
        effects: [{ op: 'addMult', amount: 3 }],
      },
    },
    flavor: 'Play to the cheap seats.',
  },
  {
    id: 'prec.secondChair',
    name: 'Second Chair',
    rarity: 'common',
    text: 'At the start of each argument, gain +1 mult per 2 cards in your argument.',
    tags: ['bigplay', 'mult'],
    hooks: {
      onArgumentStart: {
        effects: [{ op: 'addMultPer', per: 0.5, source: { kind: 'argumentSize' } }],
      },
    },
    flavor: 'Always good to have backup.',
  },

  // Economy
  {
    id: 'prec.retainerAgreement',
    name: 'Retainer Agreement',
    rarity: 'common',
    text: 'At the start of each trial, gain 8 Retainer.',
    tags: ['economy'],
    hooks: {
      onTrialStart: { effects: [{ op: 'gainRetainer', amount: 8 }] },
    },
    flavor: 'Paid up front, win or lose.',
  },

  // Defensive
  {
    id: 'prec.deepBreaths',
    name: 'Deep Breaths',
    rarity: 'common',
    text: 'At the end of each round, gain 2 Composure.',
    tags: ['defense'],
    hooks: {
      onRoundEnd: { effects: [{ op: 'gainComposure', amount: 2 }] },
    },
    flavor: 'In through the nose, out through the mouth.',
  },
  {
    id: 'prec.objectionReflex',
    name: 'Objection Reflex',
    rarity: 'common',
    text: 'Whenever you Object (discard), reduce the prosecution’s Conviction by 1.',
    tags: ['discard', 'defense'],
    hooks: {
      onDiscard: { effects: [{ op: 'reduceConviction', amount: 1 }] },
    },
    flavor: 'Objection! — before they finish the sentence.',
  },

  // retrigger / scaling
  {
    id: 'prec.closingStatement',
    name: 'Closing Statement',
    rarity: 'common',
    text: 'Whenever a Closing card is scored, gain +3 base.',
    tags: ['closing', 'value'],
    hooks: {
      onCardScored: {
        condition: { kind: 'cardHasCategory', category: 'Closing' },
        effects: [{ op: 'addBase', amount: 3 }],
      },
    },
    flavor: 'And in conclusion…',
  },

  // ─────────────────────────── UNCOMMON (≈10) ───────────────────────────

  // (1) Evidence engine
  {
    id: 'prec.warrantBundle',
    name: 'Warrant Bundle',
    rarity: 'uncommon',
    text: 'Every 2nd card you score, gain 1 Evidence.',
    tags: ['evidence', 'engine'],
    hooks: {
      onCardScored: { everyN: 2, effects: [{ op: 'gainEvidence', amount: 1 }] },
    },
    flavor: 'Sign here, here, and here.',
  },
  {
    id: 'prec.discoveryRequest',
    name: 'Discovery Request',
    rarity: 'uncommon',
    text: 'At the start of each round, if you hold 4+ Evidence, draw 1 card.',
    tags: ['evidence', 'draw'],
    hooks: {
      onRoundStart: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'evidence' }, amount: 4 },
        effects: [{ op: 'drawCards', amount: 1 }],
      },
    },
    flavor: 'We’ll be needing everything you’ve got.',
  },

  // (2) Object / Discard engine
  {
    id: 'prec.hostileWitness',
    name: 'Hostile Witness',
    rarity: 'uncommon',
    text: 'During summation, gain +1 mult per card you discarded this round.',
    tags: ['discard', 'engine', 'mult'],
    hooks: {
      onArgumentTally: {
        effects: [{ op: 'addMultPer', per: 1, source: { kind: 'discardsThisRound' } }],
      },
    },
    flavor: 'Turn their own answers against them.',
  },
  {
    id: 'prec.gagOrder',
    name: 'Gag Order',
    rarity: 'uncommon',
    text: 'Whenever you Object (discard) an Objection card, gain 1 Evidence and 1 Focus.',
    tags: ['discard', 'evidence', 'tempo'],
    hooks: {
      onDiscard: {
        condition: { kind: 'cardHasCategory', category: 'Objection' },
        effects: [
          { op: 'gainEvidence', amount: 1 },
          { op: 'gainFocus', amount: 1 },
        ],
      },
    },
    flavor: 'Counsel, that’s quite enough.',
  },

  // (3) Sustained mult engine
  {
    id: 'prec.sustainPedal',
    name: 'Sustain Pedal',
    rarity: 'uncommon',
    text: 'At the start of each argument, gain +1 mult per Sustained you hold (it is still spent as normal).',
    tags: ['sustained', 'engine', 'mult'],
    hooks: {
      onArgumentStart: {
        effects: [
          {
            op: 'addMultPer',
            per: 1,
            source: { kind: 'statusStacks', target: 'self', status: KW.Sustained },
          },
        ],
      },
    },
    flavor: 'Let it ring.',
  },
  {
    id: 'prec.harmonicResonance',
    name: 'Harmonic Resonance',
    rarity: 'uncommon',
    text: 'At the start of each round, if you hold 5+ Sustained, gain 2 more Sustained.',
    tags: ['sustained', 'engine'],
    hooks: {
      onRoundStart: {
        condition: {
          kind: 'hasStatus',
          target: 'self',
          status: KW.Sustained,
          atLeast: 5,
        },
        effects: [{ op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 2 }],
      },
    },
    flavor: 'Resonance feeds resonance.',
  },

  // (4) Big single-argument engine
  {
    id: 'prec.surpriseExhibit',
    name: 'Surprise Exhibit',
    rarity: 'uncommon',
    text: 'During summation, gain +2 base per card in your argument and +1 mult per 2 cards in your argument.',
    tags: ['bigplay', 'engine'],
    hooks: {
      onArgumentTally: {
        effects: [
          { op: 'addBasePer', per: 2, source: { kind: 'argumentSize' } },
          { op: 'addMultPer', per: 0.5, source: { kind: 'argumentSize' } },
        ],
      },
    },
    flavor: 'Behold — exhibit Z.',
  },

  // (5) retrigger / scaling
  {
    id: 'prec.echoChamber',
    name: 'Echo Chamber',
    rarity: 'uncommon',
    text: 'Every 4th card you score is retriggered once.',
    tags: ['retrigger', 'engine'],
    hooks: {
      onCardScored: { everyN: 4, effects: [{ op: 'retrigger', times: 1 }] },
    },
    flavor: 'Say it again. Again. Again.',
  },

  // Economy
  {
    id: 'prec.proBono',
    name: 'Pro Bono Hours',
    rarity: 'uncommon',
    text: 'After each argument, gain 2 Retainer; if the argument had 4+ cards, gain 6 instead.',
    tags: ['economy', 'bigplay'],
    hooks: {
      onArgumentEnd: {
        effects: [
          {
            op: 'conditional',
            condition: { kind: 'sourceAtLeast', source: { kind: 'argumentSize' }, amount: 4 },
            then: [{ op: 'gainRetainer', amount: 6 }],
            else: [{ op: 'gainRetainer', amount: 2 }],
          },
        ],
      },
    },
    flavor: 'For the good of the firm’s reputation.',
  },

  // Defensive
  {
    id: 'prec.measuredCadence',
    name: 'Measured Cadence',
    rarity: 'uncommon',
    text: 'At the start of each round, gain 2 Composure and reduce the prosecution’s Conviction by 2.',
    tags: ['defense'],
    hooks: {
      onRoundStart: {
        effects: [
          { op: 'gainComposure', amount: 2 },
          { op: 'reduceConviction', amount: 2 },
        ],
      },
    },
    flavor: 'Slow is smooth; smooth is fast.',
  },

  // ─────────────────────────── RARE (≈6) ───────────────────────────

  // (1) Evidence engine build-around
  {
    id: 'prec.smokingGun',
    name: 'The Smoking Gun',
    rarity: 'rare',
    text: 'During summation, if you hold 8+ Evidence, double your mult and spend 4 Evidence.',
    tags: ['evidence', 'bigplay', 'buildaround'],
    hooks: {
      onArgumentTally: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'evidence' }, amount: 8 },
        effects: [
          { op: 'mulMult', factor: 2 },
          { op: 'spendEvidence', amount: 4 },
        ],
      },
    },
    flavor: 'One exhibit to end the trial.',
  },

  // (2) Object / Discard build-around
  {
    id: 'prec.scorchedEarth',
    name: 'Scorched Earth',
    rarity: 'rare',
    text: 'During summation, if you discarded 3+ cards this round, gain +6 mult and 2 Evidence.',
    tags: ['discard', 'engine', 'buildaround'],
    hooks: {
      onArgumentTally: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'discardsThisRound' }, amount: 3 },
        effects: [
          { op: 'addMult', amount: 6 },
          { op: 'gainEvidence', amount: 2 },
        ],
      },
    },
    flavor: 'Leave nothing standing for the other side.',
  },

  // (3) Sustained build-around
  {
    id: 'prec.standingOvation',
    name: 'Standing Ovation',
    rarity: 'rare',
    text: 'At the start of each argument, gain +2 mult per 2 Sustained you hold (it is still spent as normal).',
    tags: ['sustained', 'engine', 'buildaround'],
    hooks: {
      onArgumentStart: {
        effects: [
          {
            op: 'addMultPer',
            per: 1,
            source: { kind: 'statusStacks', target: 'self', status: KW.Sustained },
          },
        ],
      },
    },
    flavor: 'They’re on their feet before you finish.',
  },

  // (4) Big single-argument build-around
  {
    id: 'prec.theClincher',
    name: 'The Clincher',
    rarity: 'rare',
    text: 'During summation, if your argument has 5+ cards, gain +5 base per card.',
    tags: ['bigplay', 'engine', 'buildaround'],
    hooks: {
      onArgumentTally: {
        condition: { kind: 'sourceAtLeast', source: { kind: 'argumentSize' }, amount: 5 },
        effects: [{ op: 'addBasePer', per: 5, source: { kind: 'argumentSize' } }],
      },
    },
    flavor: 'Bring it all home at once.',
  },

  // (5) retrigger / scaling build-around
  {
    id: 'prec.crossExaminer',
    name: 'The Cross-Examiner',
    rarity: 'rare',
    text: 'Whenever a Cross card is scored, retrigger it once and gain 1 Evidence.',
    tags: ['cross', 'retrigger', 'evidence', 'buildaround'],
    hooks: {
      onCardScored: {
        condition: { kind: 'cardHasCategory', category: 'Cross' },
        effects: [
          { op: 'retrigger', times: 1 },
          { op: 'gainEvidence', amount: 1 },
        ],
      },
    },
    flavor: 'No further questions — well, a few more.',
  },

  // Defensive / economy rare
  {
    id: 'prec.ironcladDefense',
    name: 'Ironclad Defense',
    rarity: 'rare',
    text: 'At the start of each trial, gain 12 Composure. At the start of each round, reduce the prosecution’s Conviction by 3.',
    tags: ['defense', 'buildaround'],
    hooks: {
      onTrialStart: { effects: [{ op: 'gainComposure', amount: 12 }] },
      onRoundStart: { effects: [{ op: 'reduceConviction', amount: 3 }] },
    },
    flavor: 'Let them throw everything. Nothing lands.',
  },
];
