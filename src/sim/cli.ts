/**
 * Balance sim entry point. Usage:
 *   npm run sim                          # full-run win-rate report (the headline metric)
 *   npm run sim -- --runs 200            # more runs per cell
 *   npm run sim -- --appeals 0,5,10,20   # specific ascension levels
 *   npm run sim -- --trials              # per-enemy trial report (starting decks)
 *   npm run sim -- --trials --targetMul 1.3
 */

import {
  computeRunReport,
  printRunReport,
  computeTrialReport,
  printTrialReport,
} from './report';
import { analyze, printAnalysis } from './analyze';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] !== undefined) return process.argv[i + 1]!;
  return def;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const seed = parseInt(arg('seed', '12345'), 10) || 12345;
const start = Date.now();

if (flag('analyze')) {
  const runs = Math.max(20, parseInt(arg('runs', '300'), 10) || 300);
  const appeals = arg('appeals', '0,2,4')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  printAnalysis(analyze({ runs, seed, appeals }));
} else if (flag('trials')) {
  const runs = Math.max(1, parseInt(arg('runs', '150'), 10) || 150);
  const targetMul = parseFloat(arg('targetMul', '1')) || 1;
  printTrialReport(computeTrialReport({ runs, seed, targetMul }), { runs, seed, targetMul });
} else {
  const runs = Math.max(1, parseInt(arg('runs', '40'), 10) || 40);
  const appeals = arg('appeals', '0,5,10,15,20')
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));
  printRunReport(computeRunReport({ runs, seed, appeals }), runs);
}

console.log(`\nDone in ${((Date.now() - start) / 1000).toFixed(1)}s`);
