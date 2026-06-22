/**
 * Save/meta API. Persists settings + meta-progression and the in-progress run, with
 * versioned migrations and corruption-safe loads. `recordRunResult` folds a finished run
 * into meta-progression: stats, history, unlocks, achievements, and codex "seen" sets.
 */

import type { ContentLookup, RunState } from '../engine';
import { META_KEY, RUN_KEY, RUN_VERSION } from './schema';
import type { MetaState, RunHistoryEntry } from './schema';
import { migrateMeta, migrateRun } from './migrations';
import { readJSON, writeJSON, removeKey } from './storage';

export type { MetaState, SettingsState, ColorblindMode, RunHistoryEntry } from './schema';
export { defaultMeta, defaultSettings } from './schema';

export function loadMeta(): MetaState {
  return migrateMeta(readJSON(META_KEY));
}

export function saveMeta(meta: MetaState): void {
  writeJSON(META_KEY, meta);
}

export function saveRun(run: RunState): void {
  writeJSON(RUN_KEY, { version: RUN_VERSION, run });
}

export function clearRun(): void {
  removeKey(RUN_KEY);
}

/** Load a saved run, discarding it if it references content that no longer exists. */
export function loadRun(content: ContentLookup): RunState | null {
  const run = migrateRun(readJSON(RUN_KEY));
  if (!run) return null;
  if (!content.getCharacterOrNull(run.characterId)) {
    removeKey(RUN_KEY);
    return null;
  }
  for (const c of run.deck) {
    if (!content.getCardOrNull(c.defId)) {
      removeKey(RUN_KEY);
      return null;
    }
  }
  return run;
}

export function hasSavedRun(): boolean {
  return readJSON(RUN_KEY) !== null;
}

function addUnique(arr: string[], values: string[]): void {
  for (const v of values) if (!arr.includes(v)) arr.push(v);
}

/** Fold a finished run into meta-progression. Mutates `meta`. */
export function recordRunResult(meta: MetaState, run: RunState, content: ContentLookup): void {
  const win = run.result === 'win';

  // Stats.
  meta.stats.trialsWon += run.stats.trialsWon;
  meta.stats.elitesWon += run.stats.elitesWon;
  meta.stats.bossesWon += run.stats.bossesWon;
  meta.stats.bestArgument = Math.max(meta.stats.bestArgument, run.stats.biggestArgument);
  if (win) {
    meta.stats.runsWon += 1;
    meta.stats.highestAppealWon = Math.max(meta.stats.highestAppealWon, run.appeal);
    addUnique(meta.charactersWonWith, [run.characterId]);
    const prev = meta.highestAppealCleared[run.characterId] ?? -1;
    meta.highestAppealCleared[run.characterId] = Math.max(prev, run.appeal);
  }

  // History (newest first, capped).
  const entry: RunHistoryEntry = {
    date: new Date().toISOString(),
    characterId: run.characterId,
    appeal: run.appeal,
    win,
    actReached: run.act,
    biggestArgument: run.stats.biggestArgument,
    seedLabel: run.seedLabel,
    mode: run.mode,
  };
  meta.runHistory.unshift(entry);
  if (meta.runHistory.length > 50) meta.runHistory.length = 50;

  // Codex "seen".
  addUnique(meta.seenCards, run.deck.map((c) => c.defId));
  addUnique(meta.seenPrecedents, run.precedents);
  const seenEnemies: string[] = [];
  for (const act of run.map.acts) {
    for (const node of act.nodes) {
      if (node.visited && node.enemyId) seenEnemies.push(node.enemyId);
    }
  }
  addUnique(meta.seenEnemies, seenEnemies);

  // Character unlocks.
  for (const ch of content.allCharacters()) {
    if (meta.unlockedCharacters.includes(ch.id)) continue;
    if (unlockSatisfied(ch.unlock, run)) addUnique(meta.unlockedCharacters, [ch.id]);
  }

  // Achievements.
  grantAchievements(meta, run);
}

function unlockSatisfied(
  unlock: ReturnType<ContentLookup['getCharacter']>['unlock'],
  run: RunState,
): boolean {
  switch (unlock.kind) {
    case 'default':
      return true;
    case 'winAct':
      return run.stats.bossesWon >= unlock.act;
    case 'winRun':
      return run.result === 'win' && (!unlock.character || run.characterId === unlock.character);
    case 'singleArgument':
      return run.stats.biggestArgument >= unlock.doubt;
    case 'achievement':
      return false; // handled separately if ever used
  }
}

function grantAchievements(meta: MetaState, run: RunState): void {
  const win = run.result === 'win';
  const give = (id: string, cond: boolean) => {
    if (cond && !meta.achievements.includes(id)) meta.achievements.push(id);
  };
  give('firstAcquittal', win);
  give('clearAct1', run.stats.bossesWon >= 1);
  give('clearAct2', run.stats.bossesWon >= 2);
  give('showstopper', run.stats.biggestArgument >= 500);
  give('closer', win && run.stats.roundsPlayed <= 24);
  give('appellate', win && run.appeal >= 5);
  give('librarian', run.precedents.length >= 8);
  give('allRise', ['litigator', 'fixer', 'showman'].every((c) => meta.charactersWonWith.includes(c)));
}

/** Highest Appeal the player may select for a character (cleared + 1, capped at 20). */
export function maxSelectableAppeal(meta: MetaState, characterId: string): number {
  const cleared = meta.highestAppealCleared[characterId] ?? -1;
  return Math.min(20, cleared + 1);
}
