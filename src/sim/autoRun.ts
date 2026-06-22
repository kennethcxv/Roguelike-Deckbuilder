/**
 * Full-run auto-player: navigates the map, plays trials with a Strategy, drafts rewards,
 * shops, resolves events and rests — start to finish. Used by integration tests and the
 * Phase-8 balance pass. Deterministic for a given seed label.
 */

import {
  Rng,
  createRun,
  enterNode,
  finishEvent,
  finishRewards,
  leaveShop,
  restRecuperate,
  restStudy,
  runEndTurn,
  syncCombat,
  takeCardReward,
  takePrecedentReward,
  takeMotionReward,
  chooseEventOption,
  eventOptionAvailable,
  shopBuyCard,
  shopBuyPrecedent,
  shopRemoveCard,
} from '../engine';
import type { ContentLookup, MapNode, Rarity, RunState } from '../engine';
import type { Strategy } from './strategy';
import { GreedyStrategy } from './strategy';

export interface RunSimOptions {
  content: ContentLookup;
  characterId: string;
  appeal: number;
  seedLabel: string;
  strategy?: Strategy;
}

export interface RunSimResult {
  win: boolean;
  actReached: number;
  trialsWon: number;
  elitesWon: number;
  bossesWon: number;
  biggestArgument: number;
  finalDeckSize: number;
  precedents: number;
  /** Unique card defIds present in the final deck (for contribution analysis). */
  cardDefIds: string[];
  /** Precedent ids owned at the end (for contribution / combo analysis). */
  precedentIds: string[];
}

const RARITY_RANK: Record<Rarity, number> = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  special: 1,
  boss: 4,
};

function chooseNode(run: RunState): string | null {
  const allNodes = run.map.acts.flatMap((a) => a.nodes);
  const reachable = run.reachableNodeIds
    .map((id) => allNodes.find((n) => n.id === id))
    .filter((n): n is MapNode => !!n);
  if (reachable.length === 0) return null;

  const margin = run.composure / run.maxComposure;
  const value = (n: MapNode): number => {
    switch (n.type) {
      case 'boss':
        return 100;
      case 'rest':
        return margin < 0.6 ? 9 : 3;
      case 'shop':
        return run.retainer >= 80 ? 7 : 4;
      case 'elite':
        return margin > 0.7 ? 7 : 1;
      case 'event':
        return 5;
      default:
        return 5;
    }
  };
  const rng = Rng.stream(run.seed, `nav:${run.act}:${run.currentNodeId ?? 'start'}`);
  let best = reachable[0]!;
  let bestScore = -1;
  for (const n of rng.shuffle(reachable)) {
    const s = value(n);
    if (s > bestScore) {
      bestScore = s;
      best = n;
    }
  }
  return best.id;
}

function playTrial(run: RunState, content: ContentLookup, strategy: Strategy): void {
  const enc = run.encounter;
  if (!enc) return;
  let safety = 0;
  while (run.screen === 'trial' && run.result === null && safety++ < 80) {
    const rng = Rng.fromState(enc.rngState);
    strategy.takeTurn(enc, content, rng);
    enc.rngState = rng.state;
    syncCombat(run, content);
    if (run.screen !== 'trial') break;
    runEndTurn(run, content);
  }
}

function takeRewards(run: RunState): void {
  if (!run.rewards) return;
  takePrecedentReward(run);
  takeMotionReward(run);
  const choices = run.rewards.cardChoices;
  if (choices.length > 0) {
    let bestIdx = 0;
    let bestRank = -1;
    choices.forEach((c, i) => {
      // upgraded cards rank slightly higher; use cardId rarity via rank map fallback.
      const rank = RARITY_RANK[(c.cardId.includes('rare') ? 'rare' : 'common') as Rarity] + i * 0;
      if (rank > bestRank) {
        bestRank = rank;
        bestIdx = i;
      }
    });
    takeCardReward(run, bestIdx);
  }
  finishRewards(run);
}

function doShopping(run: RunState, content: ContentLookup): void {
  if (!run.shop) return;
  // Buy the first affordable, unowned precedent.
  run.shop.precedents.forEach((_, i) => shopBuyPrecedent(run, i));
  // Buy affordable cards while keeping a buffer.
  run.shop.cards.forEach((entry, i) => {
    if (!entry.sold && run.retainer - entry.cost >= 30) shopBuyCard(run, i);
  });
  // Thin the deck once if flush.
  if (run.retainer >= run.shop.removeCost + 40 && run.deck.length > 8) {
    const starter = run.deck.find((c) => content.getCard(c.defId).rarity === 'starter');
    if (starter) shopRemoveCard(run, starter.uid);
  }
  leaveShop(run);
}

function doEvent(run: RunState, content: ContentLookup): void {
  if (!run.event) return;
  const ev = content.getEvent(run.event.eventId);
  let chosen = 0;
  for (let i = 0; i < ev.options.length; i++) {
    if (eventOptionAvailable(run, content, i)) {
      chosen = i;
      break;
    }
  }
  chooseEventOption(run, content, chosen);
  finishEvent(run);
}

function doRest(run: RunState, content: ContentLookup): void {
  if (run.composure < run.maxComposure * 0.6) {
    restRecuperate(run);
    return;
  }
  const upgradeable = run.deck.find(
    (c) => c.upgraded === 0 && content.getCard(c.defId).upgrade !== undefined,
  );
  if (upgradeable) restStudy(run, content, upgradeable.uid);
  else restRecuperate(run);
}

export function simulateRun(opts: RunSimOptions): RunSimResult {
  const strategy = opts.strategy ?? new GreedyStrategy();
  const run = createRun({
    content: opts.content,
    seedLabel: opts.seedLabel,
    mode: 'standard',
    characterId: opts.characterId,
    appeal: opts.appeal,
  });

  let safety = 0;
  while (run.result === null && safety++ < 400) {
    switch (run.screen) {
      case 'map': {
        const id = chooseNode(run);
        if (!id || !enterNode(run, opts.content, id)) {
          safety = 9999; // stuck — bail
        }
        break;
      }
      case 'trial':
        playTrial(run, opts.content, strategy);
        break;
      case 'reward':
        takeRewards(run);
        break;
      case 'shop':
        doShopping(run, opts.content);
        break;
      case 'event':
        doEvent(run, opts.content);
        break;
      case 'rest':
        doRest(run, opts.content);
        break;
      case 'runWon':
      case 'runLost':
        break;
    }
  }

  return {
    win: run.result === 'win',
    actReached: run.act,
    trialsWon: run.stats.trialsWon,
    elitesWon: run.stats.elitesWon,
    bossesWon: run.stats.bossesWon,
    biggestArgument: run.stats.biggestArgument,
    finalDeckSize: run.deck.length,
    precedents: run.precedents.length,
    cardDefIds: [...new Set(run.deck.map((c) => c.defId))],
    precedentIds: [...run.precedents],
  };
}
