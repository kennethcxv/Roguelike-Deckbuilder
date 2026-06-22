import { DB } from '../content';
import { GreedyStrategy } from './strategy';
import { simulateTrial } from './runTrial';
import { simulateRun } from './autoRun';
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

// ───────────────────────── Full-run report ─────────────────────────

export interface RunCell {
  appeal: number;
  winRate: number;
  avgAct: number;
  avgBigArg: number;
}
export interface RunCharacterReport {
  characterId: string;
  title: string;
  cells: RunCell[];
}
export interface RunReport {
  characters: RunCharacterReport[];
  appeals: number[];
}

export function computeRunReport(opts: { runs: number; seed: number; appeals: number[] }): RunReport {
  const characters = DB.allCharacters();
  const out: RunCharacterReport[] = [];
  for (const ch of characters) {
    const cells: RunCell[] = [];
    for (const appeal of opts.appeals) {
      let wins = 0;
      let actSum = 0;
      let bigSum = 0;
      for (let i = 0; i < opts.runs; i++) {
        const r = simulateRun({
          content: DB,
          characterId: ch.id,
          appeal,
          seedLabel: `sim-${opts.seed}-${ch.id}-${appeal}-${i}`,
        });
        if (r.win) wins += 1;
        actSum += r.actReached;
        bigSum += r.biggestArgument;
      }
      cells.push({
        appeal,
        winRate: wins / opts.runs,
        avgAct: actSum / opts.runs,
        avgBigArg: bigSum / opts.runs,
      });
    }
    out.push({ characterId: ch.id, title: ch.title, cells });
  }
  return { characters: out, appeals: opts.appeals };
}

export function printRunReport(report: RunReport, runs: number): void {
  console.log(`\nReasonable Doubt — Full-Run Win Rates  (${runs} runs/cell)\n`);
  const header = ['Character'.padEnd(16), ...report.appeals.map((a) => `A${a}`.padStart(7))].join('');
  console.log(header);
  console.log('-'.repeat(header.length));
  for (const ch of report.characters) {
    const row = [ch.title.padEnd(16), ...ch.cells.map((c) => pct(c.winRate).padStart(7))].join('');
    console.log(row);
  }
  console.log('\nAvg act reached:');
  for (const ch of report.characters) {
    const row = [ch.title.padEnd(16), ...ch.cells.map((c) => c.avgAct.toFixed(1).padStart(7))].join('');
    console.log(row);
  }
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
