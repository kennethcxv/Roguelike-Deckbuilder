/**
 * The run state machine. Owns the meta-loop: navigate the map → enter a node →
 * trial / event / shop / rest → resolve → rewards → back to the map → boss → next act.
 * Pure reducers that mutate a working RunState (cloned at the store/save boundary).
 *
 * Determinism: every random subsystem draws from a named stream derived from the run
 * seed + node id, so outcomes are independent of visit order; the encounter persists its
 * own rngState for mid-trial save/resume.
 */

import { Rng, seedFromString } from './rng';
import { generateMap, getNode } from './map';
import {
  createEncounter,
  discardSelected,
  endTurn,
  playActionCard,
  presentArgument,
  toggleArgumentCard,
} from './encounter';
import { resolveEffects } from './effects';
import { buildTrialRewards, rewardableCards, rollPrecedent } from './rewards';
import { generateShop } from './shop';
import { clamp, effectiveCard, makeCardInstance } from './state';
import type {
  CardInstance,
  ContentLookup,
  EffectContext,
  EventOutcome,
  MapNode,
  RunMode,
  RunState,
  RunStats,
} from './types';

export interface CreateRunOpts {
  content: ContentLookup;
  seedLabel: string;
  mode: RunMode;
  characterId: string;
  appeal: number;
}

/** Difficulty multiplier applied to Doubt targets per Appeal (ascension) level. */
export function targetMulForAppeal(appeal: number): number {
  return 1 + clamp(appeal, 0, 20) * 0.04;
}

function zeroStats(): RunStats {
  return {
    trialsWon: 0,
    elitesWon: 0,
    bossesWon: 0,
    cardsAdded: 0,
    cardsRemoved: 0,
    precedentsGained: 0,
    biggestArgument: 0,
    retainerEarned: 0,
    roundsPlayed: 0,
  };
}

function buildDeck(startingDeck: { cardId: string; count: number }[]): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const sc of startingDeck) {
    for (let i = 0; i < sc.count; i++) deck.push(makeCardInstance(sc.cardId));
  }
  return deck;
}

export function createRun(opts: CreateRunOpts): RunState {
  const { content, seedLabel, mode, characterId, appeal } = opts;
  const seed = seedFromString(seedLabel);
  const character = content.getCharacter(characterId);
  const map = generateMap(seed, content);
  const firstAct = map.acts[0]!;

  return {
    seed,
    seedLabel,
    mode,
    characterId,
    appeal,
    act: 1,
    map,
    currentNodeId: null,
    reachableNodeIds: [...firstAct.startNodeIds],
    deck: buildDeck(character.startingDeck),
    precedents: [...character.startingPrecedents],
    motions: [],
    retainer: character.startingRetainer,
    composure: character.startingComposure,
    maxComposure: character.startingComposure,
    screen: 'map',
    encounter: null,
    rewards: null,
    shop: null,
    event: null,
    stats: zeroStats(),
    log: [],
    result: null,
  };
}

// ───────────────────────── Map navigation ─────────────────────────

export function enterNode(run: RunState, content: ContentLookup, nodeId: string): boolean {
  if (run.screen !== 'map' || !run.reachableNodeIds.includes(nodeId)) return false;
  const node = getNode(run.map, nodeId);
  if (!node) return false;
  run.currentNodeId = nodeId;
  node.visited = true;

  switch (node.type) {
    case 'trial':
    case 'elite':
    case 'boss':
      startTrial(run, content, node);
      break;
    case 'event':
      startEvent(run, content, node);
      break;
    case 'shop':
      run.shop = generateShop(
        content,
        Rng.stream(run.seed, `shop:${node.id}`),
        run.characterId,
        node.act,
      );
      run.screen = 'shop';
      break;
    case 'rest':
      run.screen = 'rest';
      break;
  }
  return true;
}

function returnToMap(run: RunState): void {
  const node = run.currentNodeId ? getNode(run.map, run.currentNodeId) : null;
  run.encounter = null;
  run.rewards = null;
  run.shop = null;
  run.event = null;
  if (node && node.type === 'boss') {
    advanceAct(run);
    return;
  }
  run.reachableNodeIds = node ? [...node.next] : [];
  run.screen = 'map';
}

function advanceAct(run: RunState): void {
  run.act += 1;
  run.encounter = null;
  run.rewards = null;
  if (run.act > run.map.acts.length) {
    run.result = 'win';
    run.screen = 'runWon';
    return;
  }
  const act = run.map.acts[run.act - 1]!;
  run.currentNodeId = null;
  run.reachableNodeIds = [...act.startNodeIds];
  run.screen = 'map';
}

// ───────────────────────── Trials (combat) ─────────────────────────

function startTrial(run: RunState, content: ContentLookup, node: MapNode): void {
  if (!node.enemyId) {
    // Defensive: a malformed node; skip straight back to the map.
    run.reachableNodeIds = [...node.next];
    run.screen = 'map';
    return;
  }
  const enemy = content.getEnemy(node.enemyId);
  const rng = Rng.stream(run.seed, `combat:${node.id}`);
  const deckCopies = run.deck.map((c) => ({
    ...c,
    overruledTurns: 0,
    stricken: false,
    tempBase: 0,
    tempMult: 0,
    costModifier: 0,
  }));
  run.encounter = createEncounter({
    content,
    rng,
    enemy,
    deck: deckCopies,
    precedents: run.precedents,
    composure: run.composure,
    targetMul: targetMulForAppeal(run.appeal),
  });
  run.screen = 'trial';
}

function combatRng(run: RunState): Rng {
  return Rng.fromState(run.encounter!.rngState);
}

function afterCombat(run: RunState, content: ContentLookup): void {
  const enc = run.encounter;
  if (!enc) return;
  if (enc.result === 'win') onTrialWon(run, content);
  else if (enc.result === 'loss') onTrialLost(run);
}

/** Public hook for drivers (UI/sim) that mutate the encounter directly, to apply
 *  the win/loss transition afterwards. */
export function syncCombat(run: RunState, content: ContentLookup): void {
  if (run.screen === 'trial') afterCombat(run, content);
}

export function runToggleArgument(run: RunState, content: ContentLookup, uid: string): boolean {
  if (!run.encounter) return false;
  return toggleArgumentCard(run.encounter, content, uid);
}

export function runPlayAction(run: RunState, content: ContentLookup, uid: string): boolean {
  if (!run.encounter) return false;
  const ok = playActionCard(run.encounter, content, combatRng(run), uid);
  afterCombat(run, content);
  return ok;
}

export function runPresent(run: RunState, content: ContentLookup): boolean {
  if (!run.encounter) return false;
  const res = presentArgument(run.encounter, content, combatRng(run));
  afterCombat(run, content);
  return res !== null;
}

export function runDiscard(run: RunState, content: ContentLookup, uids: string[]): boolean {
  if (!run.encounter) return false;
  return discardSelected(run.encounter, content, combatRng(run), uids);
}

export function runEndTurn(run: RunState, content: ContentLookup): void {
  if (!run.encounter) return;
  endTurn(run.encounter, content, combatRng(run));
  afterCombat(run, content);
}

export function runPlayCombatMotion(run: RunState, content: ContentLookup, motionId: string): boolean {
  if (!run.encounter) return false;
  const idx = run.motions.indexOf(motionId);
  if (idx < 0) return false;
  const motion = content.getMotion(motionId);
  if (motion.usage !== 'combat') return false;
  const rng = combatRng(run);
  const ctx: EffectContext = {
    rng,
    content,
    enc: run.encounter,
    scoring: null,
    card: null,
    source: { kind: 'status', label: motion.name },
    retriggerRequested: 0,
  };
  resolveEffects(ctx, motion.combatEffects);
  run.encounter.rngState = rng.state;
  run.motions.splice(idx, 1);
  afterCombat(run, content);
  return true;
}

function onTrialLost(run: RunState): void {
  run.result = 'loss';
  run.screen = 'runLost';
}

function onTrialWon(run: RunState, content: ContentLookup): void {
  const enc = run.encounter!;
  const node = getNode(run.map, run.currentNodeId!)!;
  run.composure = clamp(enc.player.composure, 1, run.maxComposure);
  run.retainer += enc.retainerEarned;
  run.stats.retainerEarned += enc.retainerEarned;
  run.stats.biggestArgument = Math.max(run.stats.biggestArgument, enc.maxArgumentDoubt);
  run.stats.roundsPlayed += enc.round;
  if (enc.kind === 'boss') run.stats.bossesWon += 1;
  else if (enc.kind === 'elite') run.stats.elitesWon += 1;
  else run.stats.trialsWon += 1;

  const enemy = content.getEnemy(node.enemyId!);
  const rng = Rng.stream(run.seed, `reward:${node.id}`);
  const rewards = buildTrialRewards(content, rng, run.characterId, node.act, enemy, run.precedents);
  run.retainer += rewards.retainer;
  run.stats.retainerEarned += rewards.retainer;
  run.rewards = rewards;
  run.screen = 'reward';
}

// ───────────────────────── Rewards ─────────────────────────

export function takeCardReward(run: RunState, index: number): boolean {
  if (!run.rewards || run.rewards.cardTaken) return false;
  const choice = run.rewards.cardChoices[index];
  if (!choice) return false;
  addCardToDeck(run, choice.cardId, choice.upgraded);
  run.rewards.cardTaken = true;
  return true;
}

export function skipCardReward(run: RunState): void {
  if (run.rewards) run.rewards.cardTaken = true;
}

export function takePrecedentReward(run: RunState): boolean {
  if (!run.rewards || run.rewards.precedentTaken || !run.rewards.precedentId) return false;
  addPrecedent(run, run.rewards.precedentId);
  run.rewards.precedentTaken = true;
  return true;
}

export function takeMotionReward(run: RunState): boolean {
  if (!run.rewards || run.rewards.motionTaken || !run.rewards.motionId) return false;
  run.motions.push(run.rewards.motionId);
  run.rewards.motionTaken = true;
  return true;
}

export function finishRewards(run: RunState): void {
  returnToMap(run);
}

// ───────────────────────── Events ─────────────────────────

function startEvent(run: RunState, content: ContentLookup, node: MapNode): void {
  const pool = content.allEvents().filter((e) => e.act === undefined || e.act === node.act);
  const events = pool.length > 0 ? pool : content.allEvents();
  if (events.length === 0) {
    run.reachableNodeIds = [...node.next];
    run.screen = 'map';
    return;
  }
  const rng = Rng.stream(run.seed, `event:${node.id}`);
  const ev = rng.pick(events);
  run.event = { eventId: ev.id, resolvedOptionIndex: null, resultText: null };
  run.screen = 'event';
}

export function eventOptionAvailable(run: RunState, content: ContentLookup, index: number): boolean {
  if (!run.event) return false;
  const ev = content.getEvent(run.event.eventId);
  const opt = ev.options[index];
  if (!opt) return false;
  const req = opt.requirement;
  if (!req) return true;
  if (req.minRetainer !== undefined && run.retainer < req.minRetainer) return false;
  if (req.minComposure !== undefined && run.composure < req.minComposure) return false;
  if (req.character !== undefined && run.characterId !== req.character) return false;
  return true;
}

export function chooseEventOption(
  run: RunState,
  content: ContentLookup,
  index: number,
): boolean {
  if (!run.event || run.event.resolvedOptionIndex !== null) return false;
  if (!eventOptionAvailable(run, content, index)) return false;
  const ev = content.getEvent(run.event.eventId);
  const opt = ev.options[index]!;
  const rng = Rng.stream(run.seed, `event:${run.currentNodeId}:outcome`);
  for (const outcome of opt.outcomes) applyOutcome(run, content, rng, outcome);
  run.event.resolvedOptionIndex = index;
  run.event.resultText = opt.resultText;
  return true;
}

export function finishEvent(run: RunState): void {
  returnToMap(run);
}

// ───────────────────────── Shop ─────────────────────────

export function shopBuyCard(run: RunState, index: number): boolean {
  const entry = run.shop?.cards[index];
  if (!run.shop || !entry || entry.sold || run.retainer < entry.cost) return false;
  run.retainer -= entry.cost;
  addCardToDeck(run, entry.cardId, false);
  entry.sold = true;
  return true;
}

export function shopBuyPrecedent(run: RunState, index: number): boolean {
  const entry = run.shop?.precedents[index];
  if (!run.shop || !entry || entry.sold || run.retainer < entry.cost) return false;
  if (run.precedents.includes(entry.precedentId)) return false;
  run.retainer -= entry.cost;
  addPrecedent(run, entry.precedentId);
  entry.sold = true;
  return true;
}

export function shopBuyMotion(run: RunState, index: number): boolean {
  const entry = run.shop?.motions[index];
  if (!run.shop || !entry || entry.sold || run.retainer < entry.cost) return false;
  run.retainer -= entry.cost;
  run.motions.push(entry.motionId);
  entry.sold = true;
  return true;
}

export function shopSellCard(run: RunState, content: ContentLookup, uid: string): boolean {
  if (!run.shop) return false;
  if (run.deck.length <= 1) return false;
  if (!removeCardFromDeck(run, uid)) return false;
  run.retainer += content.tuning.sellbackRetainer;
  return true;
}

export function shopRemoveCard(run: RunState, uid: string): boolean {
  if (!run.shop || run.shop.removeUsed || run.retainer < run.shop.removeCost) return false;
  if (run.deck.length <= 1) return false;
  if (!removeCardFromDeck(run, uid)) return false;
  run.retainer -= run.shop.removeCost;
  run.shop.removeUsed = true;
  return true;
}

export function leaveShop(run: RunState): void {
  returnToMap(run);
}

// ───────────────────────── Rest (Chambers) ─────────────────────────

export function restRecuperate(run: RunState): void {
  run.composure = clamp(run.composure + Math.ceil(run.maxComposure * 0.35), 0, run.maxComposure);
  returnToMap(run);
}

export function restStudy(run: RunState, content: ContentLookup, uid: string): boolean {
  if (!upgradeCard(run, content, uid)) return false;
  returnToMap(run);
  return true;
}

export function canUpgrade(run: RunState, content: ContentLookup, uid: string): boolean {
  const card = run.deck.find((c) => c.uid === uid);
  if (!card || card.upgraded > 0) return false;
  return content.getCard(card.defId).upgrade !== undefined;
}

// ───────────────────────── Deck operations ─────────────────────────

export function addCardToDeck(run: RunState, cardId: string, upgraded: boolean): void {
  run.deck.push(makeCardInstance(cardId, upgraded ? 1 : 0));
  run.stats.cardsAdded += 1;
}

export function removeCardFromDeck(run: RunState, uid: string): boolean {
  const idx = run.deck.findIndex((c) => c.uid === uid);
  if (idx < 0) return false;
  run.deck.splice(idx, 1);
  run.stats.cardsRemoved += 1;
  return true;
}

export function upgradeCard(run: RunState, content: ContentLookup, uid: string): boolean {
  const card = run.deck.find((c) => c.uid === uid);
  if (!card || card.upgraded > 0) return false;
  if (content.getCard(card.defId).upgrade === undefined) return false;
  card.upgraded = 1;
  return true;
}

export function addPrecedent(run: RunState, precedentId: string): void {
  if (run.precedents.includes(precedentId)) return;
  run.precedents.push(precedentId);
  run.stats.precedentsGained += 1;
}

export function playMapMotion(run: RunState, content: ContentLookup, motionId: string): boolean {
  const idx = run.motions.indexOf(motionId);
  if (idx < 0) return false;
  const motion = content.getMotion(motionId);
  if (motion.usage !== 'map' || !motion.mapOutcomes) return false;
  const rng = Rng.stream(run.seed, `motion:${motionId}:${run.deck.length}:${run.retainer}`);
  for (const o of motion.mapOutcomes) applyOutcome(run, content, rng, o);
  run.motions.splice(idx, 1);
  return true;
}

// ───────────────────────── Outcomes ─────────────────────────

export function applyOutcome(
  run: RunState,
  content: ContentLookup,
  rng: Rng,
  outcome: EventOutcome,
): void {
  switch (outcome.kind) {
    case 'gainRetainer':
      run.retainer += outcome.amount;
      run.stats.retainerEarned += outcome.amount;
      break;
    case 'loseRetainer':
      run.retainer = Math.max(0, run.retainer - outcome.amount);
      break;
    case 'healComposure':
      run.composure = clamp(run.composure + outcome.amount, 0, run.maxComposure);
      break;
    case 'loseComposure':
      run.composure = Math.max(1, run.composure - outcome.amount);
      break;
    case 'gainMaxComposure':
      run.maxComposure += outcome.amount;
      run.composure += outcome.amount;
      break;
    case 'loseMaxComposure':
      run.maxComposure = Math.max(1, run.maxComposure - outcome.amount);
      run.composure = Math.min(run.composure, run.maxComposure);
      break;
    case 'addCard':
      addCardToDeck(run, outcome.cardId, outcome.upgraded ?? false);
      break;
    case 'addRandomCard': {
      const pool = rewardableCards(content, run.characterId, outcome.rarity);
      if (pool.length > 0) addCardToDeck(run, rng.pick(pool).id, false);
      break;
    }
    case 'removeRandomCard':
      if (run.deck.length > 1) removeCardFromDeck(run, rng.pick(run.deck).uid);
      break;
    case 'upgradeRandomCard': {
      const up = run.deck.filter(
        (c) => c.upgraded === 0 && content.getCard(c.defId).upgrade !== undefined,
      );
      if (up.length > 0) upgradeCard(run, content, rng.pick(up).uid);
      break;
    }
    case 'transformRandomCard': {
      if (run.deck.length > 0) {
        removeCardFromDeck(run, rng.pick(run.deck).uid);
        const pool = rewardableCards(content, run.characterId);
        if (pool.length > 0) addCardToDeck(run, rng.pick(pool).id, false);
      }
      break;
    }
    case 'addPrecedent': {
      const id = outcome.precedentId ?? rollPrecedent(content, rng, run.precedents);
      if (id) addPrecedent(run, id);
      break;
    }
    case 'addMotion': {
      const id =
        outcome.motionId ??
        (() => {
          const pool = content.allMotions().filter((m) => m.rarity !== 'special');
          return pool.length > 0 ? rng.pick(pool).id : null;
        })();
      if (id) run.motions.push(id);
      break;
    }
    case 'nothing':
      break;
  }
}

/** Build the player's current deck as display-ready effective cards. */
export function deckView(run: RunState, content: ContentLookup) {
  return run.deck.map((c) => ({
    instance: c,
    def: content.getCard(c.defId),
    effective: effectiveCard(content.getCard(c.defId), c.upgraded),
  }));
}
