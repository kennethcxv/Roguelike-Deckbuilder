/**
 * Versioned migrations. Each older payload is upgraded field-by-field to the current
 * shape, filling any missing/renamed fields with defaults so saves never crash the game
 * across releases. New versions append a step to the chain.
 */

import type { RunState } from '../engine';
import { META_VERSION, defaultMeta, defaultSettings } from './schema';
import type { MetaState, SavedRunEnvelope } from './schema';

type AnyObj = Record<string, unknown>;

/** Upgrade a raw (possibly old/partial/corrupt) meta payload to the current MetaState. */
export function migrateMeta(raw: unknown): MetaState {
  const base = defaultMeta();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<MetaState> & AnyObj;

  // (Future: switch on r.version to apply stepwise migrations before the merge.)
  const merged: MetaState = {
    ...base,
    ...r,
    version: META_VERSION,
    settings: { ...defaultSettings(), ...(r.settings ?? {}) },
    stats: { ...base.stats, ...(r.stats ?? {}) },
    unlockedCharacters: dedupe(r.unlockedCharacters ?? base.unlockedCharacters),
    highestAppealCleared: r.highestAppealCleared ?? {},
    charactersWonWith: dedupe(r.charactersWonWith ?? []),
    achievements: dedupe(r.achievements ?? []),
    seenCards: dedupe(r.seenCards ?? []),
    seenPrecedents: dedupe(r.seenPrecedents ?? []),
    seenEnemies: dedupe(r.seenEnemies ?? []),
    runHistory: Array.isArray(r.runHistory) ? r.runHistory.slice(0, 50) : [],
    tutorialDone: Boolean(r.tutorialDone),
  };
  if (!merged.unlockedCharacters.includes('litigator')) merged.unlockedCharacters.push('litigator');
  return merged;
}

export function migrateRun(raw: unknown): RunState | null {
  if (!raw || typeof raw !== 'object') return null;
  const env = raw as Partial<SavedRunEnvelope>;
  if (!env.run || typeof env.run !== 'object') return null;
  return env.run;
}

function dedupe(arr: string[]): string[] {
  return [...new Set(arr)];
}
