import { DB } from '../content';
import { GreedyStrategy } from './strategy';
import { simulateTrial } from './runTrial';
import { deckFromStarting, pct } from './util';
import type { EnemyDef } from '../engine';

export interface ReportOptions {
  runs: number;
  seed: number;
  /** Optional difficulty multiplier on Doubt targets (ascension preview). */
  targetMul?: number;
}

export interface EnemyResult {
  enemy: EnemyDef;
  winRate: number;
  avgRounds: number;
  avgMaxArgument: number;
}

export interface CharacterReport {
  characterId: string;
  title: string;
  results: EnemyResult[];
  act1WinRate: number;
}

export interface TrialReport {
  characters: CharacterReport[];
}

export function computeTrialReport(opts: ReportOptions): TrialReport {
  const strategy = new GreedyStrategy();
  const characters = DB.allCharacters();
  const enemies = DB.allEnemies();
  const out: CharacterReport[] = [];

  for (const ch of characters) {
    const results: EnemyResult[] = [];
    for (const enemy of enemies) {
      let wins = 0;
      let totalRounds = 0;
      let totalMax = 0;
      for (let i = 0; i < opts.runs; i++) {
        const seed = (opts.seed + i * 2654435761 + enemy.id.length * 40503) >>> 0;
        const r = simulateTrial({
          content: DB,
          enemy,
          deck: deckFromStarting(ch),
          precedents: ch.startingPrecedents,
          composure: ch.startingComposure,
          seed,
          strategy,
          targetMul: opts.targetMul ?? 1,
        });
        if (r.win) wins += 1;
        totalRounds += r.rounds;
        totalMax += r.maxArgument;
      }
      results.push({
        enemy,
        winRate: wins / opts.runs,
        avgRounds: totalRounds / opts.runs,
        avgMaxArgument: totalMax / opts.runs,
      });
    }
    const act1 = results.filter((r) => r.enemy.act === 1);
    const act1WinRate = act1.reduce((s, r) => s + r.winRate, 0) / Math.max(1, act1.length);
    out.push({ characterId: ch.id, title: ch.title, results, act1WinRate });
  }
  return { characters: out };
}

export function printTrialReport(report: TrialReport, opts: ReportOptions): void {
  console.log(
    `\nReasonable Doubt — Trial Balance Report  (starting decks · ${opts.runs} runs · targetMul ${opts.targetMul ?? 1})\n`,
  );
  for (const ch of report.characters) {
    console.log(`=== ${ch.title} ===   Act 1 win-rate: ${pct(ch.act1WinRate)}`);
    for (const r of ch.results) {
      const tag = `${r.enemy.kind.padEnd(5)} a${r.enemy.act}`;
      console.log(
        `   ${tag}  ${r.enemy.name.padEnd(28)} ${pct(r.winRate).padStart(6)}` +
          `   rounds ${r.avgRounds.toFixed(1).padStart(4)}   bigArg ${r.avgMaxArgument.toFixed(0).padStart(4)}`,
      );
    }
    console.log('');
  }
}
