/**
 * Balance sim entry point. Usage:
 *   npm run sim                       # default trial report
 *   npm run sim -- --runs 500 --seed 42
 *   npm run sim -- --targetMul 1.3    # preview a harder ascension
 */

import { computeTrialReport, printTrialReport } from './report';

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] !== undefined) return process.argv[i + 1]!;
  return def;
}

const runs = Math.max(1, parseInt(arg('runs', '150'), 10) || 150);
const seed = parseInt(arg('seed', '12345'), 10) || 12345;
const targetMul = parseFloat(arg('targetMul', '1')) || 1;

const start = Date.now();
const report = computeTrialReport({ runs, seed, targetMul });
printTrialReport(report, { runs, seed, targetMul });
console.log(`Done in ${((Date.now() - start) / 1000).toFixed(1)}s`);
