/**
 * Core engine types — the contracts the engine interprets. Content provides *values*
 * of these shapes (CardDef, PrecedentDef, KeywordDef, Tuning, ...); the engine never
 * imports content, only these types, keeping the data/logic boundary clean.
 *
 * Sections:
 *  1. Ids & enums
 *  2. Sources & conditions (read-only queries over encounter state)
 *  3. Effects (the mutating op union)
 *  4. Content definition shapes (cards, precedents, keywords, tuning)
 *  5. Runtime instances & combat/encounter state
 *  6. Scoring trace
 *  7. EffectContext & ContentLookup
 */

import type { Rng } from './rng';

// ───────────────────────── 1. Ids & enums ─────────────────────────

export type CardId = string;
export type PrecedentId = string;
export type KeywordId = string;
export type EnemyId = string;
export type EventId = string;
export type MotionId = string;
export type CharacterId = string;
export type AchievementId = string;

export type Rarity = 'starter' | 'common' | 'uncommon' | 'rare' | 'special' | 'boss';

/** Whether a card is scored into an argument or resolves immediately as a utility play. */
export type CardKind = 'argument' | 'action';

/** Visual + synergy category (drives card frames and keyword/precedent interactions). */
export type CardCategory =
  | 'Statement'
  | 'Evidence'
  | 'Cross'
  | 'Rhetoric'
  | 'Tactic'
  | 'Objection'
  | 'Closing';

/** Who a targeted effect/status applies to. `card` = the current card in context. */
export type Target = 'self' | 'prosecution' | 'card';

// ───────────────────── 2. Sources & conditions ─────────────────────

/** A numeric quantity read from encounter state, used by per-X effects and conditions. */
export type Source =
  | { kind: 'const'; value: number }
  | { kind: 'evidence' }
  | { kind: 'composure' }
  | { kind: 'focusUnspent' }
  | { kind: 'argumentSize' }
  | { kind: 'handSize' }
  | { kind: 'cardsPlayedThisRound' }
  | { kind: 'discardsThisRound' }
  | { kind: 'roundNumber' }
  | { kind: 'deckSize' }
  | { kind: 'drawPileSize' }
  | { kind: 'discardPileSize' }
  | { kind: 'doubt' }
  | { kind: 'conviction' }
  | { kind: 'statusStacks'; target: Target; status: KeywordId };

export type Condition =
  | { kind: 'always' }
  | { kind: 'not'; condition: Condition }
  | { kind: 'and'; conditions: Condition[] }
  | { kind: 'or'; conditions: Condition[] }
  | { kind: 'sourceAtLeast'; source: Source; amount: number }
  | { kind: 'sourceAtMost'; source: Source; amount: number }
  | { kind: 'hasStatus'; target: Target; status: KeywordId; atLeast?: number }
  | { kind: 'cardHasKeyword'; keyword: KeywordId }
  | { kind: 'cardHasCategory'; category: CardCategory }
  | { kind: 'firstCardOfArgument' }
  | { kind: 'coinFlip'; probability: number };

// ───────────────────────── 3. Effects ─────────────────────────

export type Effect =
  // scoring
  | { op: 'addBase'; amount: number }
  | { op: 'addMult'; amount: number }
  | { op: 'mulMult'; factor: number }
  | { op: 'addBasePer'; per: number; source: Source }
  | { op: 'addMultPer'; per: number; source: Source }
  | { op: 'raiseDoubt'; amount: number }
  // resources
  | { op: 'gainEvidence'; amount: number }
  | { op: 'spendEvidence'; amount: number }
  | { op: 'gainComposure'; amount: number }
  | { op: 'loseComposure'; amount: number }
  | { op: 'gainFocus'; amount: number }
  | { op: 'gainRetainer'; amount: number }
  | { op: 'reduceConviction'; amount: number }
  // cards / hand
  | { op: 'drawCards'; amount: number }
  | { op: 'retrigger'; times: number }
  | { op: 'strikeSelf' }
  // statuses
  | { op: 'applyStatus'; target: Target; status: KeywordId; amount: number }
  | { op: 'removeStatus'; target: Target; status: KeywordId }
  // prosecution (used by enemy intents; numbers only, safe in Phase 1)
  | { op: 'addConviction'; amount: number }
  | { op: 'raiseTarget'; amount: number }
  // control flow
  | { op: 'conditional'; condition: Condition; then: Effect[]; else?: Effect[] }
  | { op: 'repeat'; count: number; effects: Effect[] }
  | { op: 'forEachInArgument'; effects: Effect[] };

export type EffectOp = Effect['op'];

// ───────────────── 4. Content definition shapes ─────────────────

export interface CardUpgrade {
  name?: string;
  text?: string;
  base?: number;
  mult?: number;
  focusCost?: number;
  onPlay?: Effect[];
  onScore?: Effect[];
  addKeywords?: KeywordId[];
  exhausts?: boolean;
}

export interface CardDef {
  id: CardId;
  name: string;
  kind: CardKind;
  category: CardCategory;
  rarity: Rarity;
  character: CharacterId | 'neutral';
  focusCost: number;
  base: number;
  mult: number;
  keywords: KeywordId[];
  tags: string[];
  text: string;
  flavor?: string;
  /** Resolves when the card is played from hand (utility, draw, status, etc.). */
  onPlay?: Effect[];
  /** Resolves when the card is scored during the cascade (argument cards). */
  onScore?: Effect[];
  /** If true, card is Stricken (removed for the rest of the trial) after play/score. */
  exhausts?: boolean;
  /** If true, the card is kept in hand at end of round instead of discarded. */
  retain?: boolean;
  /** If true, the card cannot be selected/played (status-like curse). */
  unplayable?: boolean;
  upgrade?: CardUpgrade;
}

export type HookPhase =
  | 'onTrialStart'
  | 'onRoundStart'
  | 'onArgumentStart'
  | 'onCardScored'
  | 'onArgumentTally'
  | 'onArgumentEnd'
  | 'onPlayCard'
  | 'onDiscard'
  | 'onAcquit'
  | 'onRoundEnd';

export interface PrecedentHook {
  condition?: Condition;
  /** Fire only on every Nth time this hook triggers in a trial (e.g. every 3rd card). */
  everyN?: number;
  effects: Effect[];
}

export interface PrecedentDef {
  id: PrecedentId;
  name: string;
  rarity: Rarity;
  character?: CharacterId | 'neutral';
  text: string;
  flavor?: string;
  hooks: Partial<Record<HookPhase, PrecedentHook>>;
  /** Tags for synergy/codex grouping. */
  tags?: string[];
}

/** Player-facing + behavior-flag data for a keyword/status. Numbers/strings only. */
export interface KeywordDef {
  id: KeywordId;
  name: string;
  description: string;
  /** Whether stacks decay by 1 at end of the owner's round. */
  decays?: boolean;
  /** Whether stacks are cleared entirely at end of round. */
  clearsEndOfRound?: boolean;
  /** Good/bad/neutral — drives color coding. */
  tone: 'good' | 'bad' | 'neutral';
  /** Colorblind-safe accent token name (resolved by UI theme). */
  accent?: string;
}

export interface RarityWeights {
  common: number;
  uncommon: number;
  rare: number;
}

export interface Tuning {
  startingHandSize: number;
  startingFocus: number;
  discardsPerRound: number;
  maxArgumentSize: number;
  startingComposure: number;
  shopRemoveBaseCost: number;
  shopRerollBaseCost: number;
  sellbackRetainer: number;
  cardRewardChoices: number;
  /** Card-reward rarity weights per act (index 0..2). */
  cardRewardRarityWeights: RarityWeights[];
  /** Precedent-reward rarity weights. */
  precedentRarityWeights: RarityWeights;
  shopCardCount: number;
  shopPrecedentCount: number;
  shopMotionCount: number;
  /** Base Retainer reward for clearing a normal trial. */
  trialRetainerReward: number;
}

// ───────────── 4b. Enemy & character definition shapes ─────────────

/** One possible prosecution action; the AI picks among these (weighted, gated). */
export interface EnemyIntentDef {
  weight: number;
  kind: IntentKind;
  label: string;
  value: number;
  status?: KeywordId;
  witness?: { name: string; convictionPerRound: number; health: number };
  effects?: Effect[];
  condition?: Condition;
}

export interface EnemyDef {
  id: EnemyId;
  name: string;
  kind: EncounterKind;
  /** Act 1..3 this enemy belongs to (for pools and scaling). */
  act: number;
  baseDoubtTarget: number;
  /** Doubt target growth applied per round automatically (prosecution presses). */
  targetRampPerRound: number;
  maxRounds: number;
  rules?: EncounterRules;
  intents: EnemyIntentDef[];
  /** Conviction the prosecution gains automatically each round (baseline pressure). */
  baseConvictionPerRound: number;
  flavor?: string;
}

export type UnlockCondition =
  | { kind: 'default' }
  | { kind: 'winAct'; act: number }
  | { kind: 'winRun'; character?: CharacterId }
  | { kind: 'singleArgument'; doubt: number }
  | { kind: 'achievement'; id: AchievementId };

export interface StartingCard {
  cardId: CardId;
  count: number;
}

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  description: string;
  /** One-line signature mechanic. */
  signature: string;
  startingDeck: StartingCard[];
  startingPrecedents: PrecedentId[];
  startingComposure: number;
  startingRetainer: number;
  unlock: UnlockCondition;
  /** Theme accent token. */
  color: string;
}

// ───────────── 5. Runtime instances & encounter state ─────────────

export interface CardInstance {
  uid: string;
  defId: CardId;
  upgraded: number;
  // transient per-trial flags
  overruledTurns: number;
  stricken: boolean;
  tempBase: number;
  tempMult: number;
  costModifier: number;
}

export type StatusBag = Record<KeywordId, number>;

export interface PlayerCombat {
  statuses: StatusBag;
  evidence: number;
  composure: number;
  maxComposure: number;
  focus: number;
  maxFocus: number;
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  /** Cards currently staged into the pending argument. */
  argument: CardInstance[];
  discardsUsed: number;
  cardsPlayedThisRound: number;
}

export type WitnessState = {
  id: string;
  name: string;
  convictionPerRound: number;
  health: number; // doubt needed to dismiss (cross-examine)
  maxHealth: number;
};

export interface ProsecutionState {
  conviction: number;
  statuses: StatusBag;
  intentQueue: Intent[];
  currentIntent: Intent | null;
  witnesses: WitnessState[];
}

export type IntentKind =
  | 'conviction'
  | 'raiseTarget'
  | 'overrule'
  | 'witness'
  | 'status'
  | 'drain'
  | 'buff';

export interface Intent {
  kind: IntentKind;
  label: string;
  /** Primary magnitude (conviction gained, target raised, cards overruled, ...). */
  value: number;
  status?: KeywordId;
  witness?: { name: string; convictionPerRound: number; health: number };
  /** Arbitrary effects applied when the intent resolves. */
  effects?: Effect[];
}

/** Boss/encounter rule mutators that the scoring/round logic reads. */
export interface EncounterRules {
  /** Hard cap on mult during scoring (biased judge). 0/undefined = no cap. */
  multCap?: number;
  /** Doubt drained at the start of each player round (hostile jury). */
  doubtDrainPerRound?: number;
  /** Extra Conviction the prosecution gains each round on top of its intent. */
  convictionRamp?: number;
  /** Composure lost each round (time pressure). */
  composureDrainPerRound?: number;
  /** Hand size delta. */
  handSizeDelta?: number;
}

export type EncounterPhase =
  | 'roundStart'
  | 'player'
  | 'scoring'
  | 'prosecution'
  | 'won'
  | 'lost';

export type EncounterKind = 'trial' | 'elite' | 'boss';

export interface EncounterState {
  enemyId: EnemyId;
  kind: EncounterKind;
  phase: EncounterPhase;
  round: number;
  maxRounds: number;
  doubt: number;
  doubtTarget: number;
  /** Player loses when prosecution conviction reaches composure (their breaking point). */
  rules: EncounterRules;
  player: PlayerCombat;
  prosecution: ProsecutionState;
  /** Active precedents this trial (ids reference run relics). */
  precedents: PrecedentId[];
  /** Per-trial counters for precedent everyN hooks, keyed by `${id}:${phase}`. */
  precedentCounters: Record<string, number>;
  /** Overrules queued by the prosecution, applied to the hand next round start. */
  pendingOverrule: number;
  /** Serialized combat RNG state for deterministic resume. */
  rngState: number;
  /** Retainer earned this trial from effects (added to run on victory). */
  retainerEarned: number;
  /** The most recent scoring result (for UI cascade / inspection). */
  lastScoring: ScoringResult | null;
  /** The largest single argument's Doubt this trial (for unlocks / combo detection). */
  maxArgumentDoubt: number;
  /** Append-only log of notable combat events (for UI/debug). */
  log: string[];
  result: 'win' | 'loss' | null;
}

// ───────────────────────── 6. Scoring trace ─────────────────────────

export type ScoreStepKind =
  | 'start'
  | 'card'
  | 'precedent'
  | 'status'
  | 'tally'
  | 'cap'
  | 'skip'
  | 'final';

export interface ScoreStep {
  kind: ScoreStepKind;
  sourceId?: string;
  label: string;
  detail?: string;
  baseDelta: number;
  multDelta: number;
  multFactor?: number;
  baseAfter: number;
  multAfter: number;
}

export interface ScoringResult {
  steps: ScoreStep[];
  base: number;
  mult: number;
  doubt: number;
}

export interface ScoringState {
  base: number;
  mult: number;
  steps: ScoreStep[];
  /** Index of the card currently being scored within the argument. */
  cardIndex: number;
  scoredUids: string[];
}

// ─────────────── 7. EffectContext & ContentLookup ───────────────

export interface ScoreSource {
  kind: ScoreStepKind;
  id?: string;
  label: string;
}

export interface EffectContext {
  rng: Rng;
  content: ContentLookup;
  enc: EncounterState;
  /** Present only during the scoring cascade. */
  scoring: ScoringState | null;
  /** The card currently being scored or played. */
  card: CardInstance | null;
  /** Attribution for the next recorded trace step. */
  source: ScoreSource;
  /** Retrigger requests for the current card (consumed by the cascade loop). */
  retriggerRequested: number;
  /** While true, `retrigger` effects are ignored (set during re-scores to avoid loops). */
  suppressRetrigger?: boolean;
}

/** The read-only view of all content the engine needs. Implemented by /content. */
export interface ContentLookup {
  tuning: Tuning;
  getCard(id: CardId): CardDef;
  getCardOrNull(id: CardId): CardDef | undefined;
  getKeyword(id: KeywordId): KeywordDef;
  getKeywordOrNull(id: KeywordId): KeywordDef | undefined;
  getPrecedent(id: PrecedentId): PrecedentDef;
  getPrecedentOrNull(id: PrecedentId): PrecedentDef | undefined;
  getEnemy(id: EnemyId): EnemyDef;
  getEnemyOrNull(id: EnemyId): EnemyDef | undefined;
  getCharacter(id: CharacterId): CharacterDef;
  getCharacterOrNull(id: CharacterId): CharacterDef | undefined;
  allCards(): CardDef[];
  allPrecedents(): PrecedentDef[];
  allEnemies(): EnemyDef[];
  allCharacters(): CharacterDef[];
}
