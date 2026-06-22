/**
 * Balance analytics over many full runs: per-card and per-Precedent win-rate
 * contribution, dead-card / overpowered detection, and broken-combo (Precedent pair)
 * detection. Used for the Phase-8 balance pass and BALANCE.md.
 */

import { DB } from '../content';
import { simulateRun } from './autoRun';

export interface ItemContribution {
  id: string;
  name: string;
  runs: number;
  winRate: number;
  contribution: number; // winRate - baseline
}

export interface ComboResult {
  a: string;
  b: string;
  runs: number;
  winRate: number;
}

export interface Analysis {
  totalRuns: number;
  baselineWinRate: number;
  cards: ItemContribution[];
  precedents: ItemContribution[];
  deadCards: ItemContribution[];
  overpowered: ItemContribution[];
  brokenCombos: ComboResult[];
}

interface Tally {
  runs: number;
  wins: number;
}

export function analyze(opts: { runs: number; seed: number; appeals: number[] }): Analysis {
  const characters = DB.allCharacters().map((c) => c.id);
  const cardTally = new Map<string, Tally>();
  const precTally = new Map<string, Tally>();
  const comboTally = new Map<string, Tally>();
  let wins = 0;

  const bump = (map: Map<string, Tally>, key: string, win: boolean) => {
    const t = map.get(key) ?? { runs: 0, wins: 0 };
    t.runs += 1;
    if (win) t.wins += 1;
    map.set(key, t);
  };

  for (let i = 0; i < opts.runs; i++) {
    const characterId = characters[i % characters.length]!;
    const appeal = opts.appeals[i % opts.appeals.length]!;
    const r = simulateRun({
      content: DB,
      characterId,
      appeal,
      seedLabel: `analyze-${opts.seed}-${i}`,
    });
    if (r.win) wins += 1;
    for (const id of r.cardDefIds) bump(cardTally, id, r.win);
    for (const id of r.precedentIds) bump(precTally, id, r.win);
    const ps = [...r.precedentIds].sort();
    for (let a = 0; a < ps.length; a++) {
      for (let b = a + 1; b < ps.length; b++) bump(comboTally, `${ps[a]}|${ps[b]}`, r.win);
    }
  }

  const baseline = wins / Math.max(1, opts.runs);
  const minRuns = Math.max(8, Math.floor(opts.runs / 40));

  const toContrib = (
    map: Map<string, Tally>,
    nameOf: (id: string) => string,
  ): ItemContribution[] =>
    [...map.entries()]
      .filter(([, t]) => t.runs >= minRuns)
      .map(([id, t]) => ({
        id,
        name: nameOf(id),
        runs: t.runs,
        winRate: t.wins / t.runs,
        contribution: t.wins / t.runs - baseline,
      }))
      .sort((a, b) => b.contribution - a.contribution);

  const cards = toContrib(cardTally, (id) => DB.getCardOrNull(id)?.name ?? id);
  const precedents = toContrib(precTally, (id) => DB.getPrecedentOrNull(id)?.name ?? id);

  const deadCards = cards
    .filter((c) => c.contribution < -0.12 && c.runs >= minRuns)
    .slice(0, 12);
  const overpowered = [...cards, ...precedents]
    .filter((c) => c.contribution > 0.18 && c.runs >= minRuns)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 12);

  const brokenCombos: ComboResult[] = [...comboTally.entries()]
    .filter(([, t]) => t.runs >= minRuns && t.wins / t.runs > Math.max(0.5, baseline + 0.25))
    .map(([key, t]) => {
      const [a, b] = key.split('|');
      return {
        a: DB.getPrecedentOrNull(a!)?.name ?? a!,
        b: DB.getPrecedentOrNull(b!)?.name ?? b!,
        runs: t.runs,
        winRate: t.wins / t.runs,
      };
    })
    .sort((x, y) => y.winRate - x.winRate)
    .slice(0, 12);

  return {
    totalRuns: opts.runs,
    baselineWinRate: baseline,
    cards,
    precedents,
    deadCards,
    overpowered,
    brokenCombos,
  };
}

export function printAnalysis(a: Analysis): void {
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const sign = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`;
  console.log(`\nBalance analysis — ${a.totalRuns} runs · baseline win ${pct(a.baselineWinRate)}\n`);

  console.log('Top Precedents by win-rate contribution:');
  for (const p of a.precedents.slice(0, 10)) {
    console.log(`  ${p.name.padEnd(26)} ${sign(p.contribution)}  (${p.runs} runs, ${pct(p.winRate)})`);
  }

  console.log('\nOverpowered candidates (contribution > +18%):');
  if (a.overpowered.length === 0) console.log('  (none)');
  for (const o of a.overpowered) {
    console.log(`  ${o.name.padEnd(26)} ${sign(o.contribution)}  (${o.runs} runs)`);
  }

  console.log('\nDead-card candidates (contribution < -12%):');
  if (a.deadCards.length === 0) console.log('  (none)');
  for (const d of a.deadCards) {
    console.log(`  ${d.name.padEnd(26)} ${sign(d.contribution)}  (${d.runs} runs)`);
  }

  console.log('\nBroken-combo candidates (Precedent pairs):');
  if (a.brokenCombos.length === 0) console.log('  (none)');
  for (const c of a.brokenCombos) {
    console.log(`  ${c.a} + ${c.b}  ${pct(c.winRate)}  (${c.runs} runs)`);
  }
}
