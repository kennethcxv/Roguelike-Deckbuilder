import { createEncounter, endTurn, Rng } from '../engine';
import type { CardInstance, ContentLookup, EnemyDef, PrecedentId } from '../engine';
import type { Strategy } from './strategy';

export interface TrialOptions {
  content: ContentLookup;
  enemy: EnemyDef;
  deck: CardInstance[];
  precedents: PrecedentId[];
  composure: number;
  targetMul?: number;
  seed: number;
  strategy: Strategy;
}

export interface TrialResult {
  win: boolean;
  rounds: number;
  finalDoubt: number;
  target: number;
  finalConviction: number;
  composure: number;
  maxArgument: number;
}

const MAX_ROUNDS_SAFETY = 100;

/** Simulate a single trial start-to-finish with the given strategy. Deterministic by seed. */
export function simulateTrial(opts: TrialOptions): TrialResult {
  const { content, enemy, deck, precedents, composure, strategy } = opts;
  const rng = new Rng(opts.seed >>> 0);
  const enc = createEncounter({
    content,
    rng,
    enemy,
    deck,
    precedents,
    composure,
    targetMul: opts.targetMul ?? 1,
  });

  let safety = 0;
  while (enc.result === null && safety++ < MAX_ROUNDS_SAFETY) {
    strategy.takeTurn(enc, content, rng);
    if (enc.result !== null) break;
    endTurn(enc, content, rng);
  }

  return {
    win: enc.result === 'win',
    rounds: enc.round,
    finalDoubt: enc.doubt,
    target: enc.doubtTarget,
    finalConviction: enc.prosecution.conviction,
    composure: enc.player.composure,
    maxArgument: enc.maxArgumentDoubt,
  };
}
