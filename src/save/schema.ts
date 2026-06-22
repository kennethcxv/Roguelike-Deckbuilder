/** Persistence schema for meta-progression, settings, and the saved run. Versioned. */

import type { RunState } from '../engine';

export const META_VERSION = 1;
export const RUN_VERSION = 1;

export const META_KEY = 'rd.meta.v1';
export const RUN_KEY = 'rd.run.v1';

export type ColorblindMode = 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia';

export interface SettingsState {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  reduceMotion: boolean;
  screenShake: boolean;
  colorblind: ColorblindMode;
  textScale: number;
  fastMode: boolean;
}

export interface RunHistoryEntry {
  date: string;
  characterId: string;
  appeal: number;
  win: boolean;
  actReached: number;
  biggestArgument: number;
  seedLabel: string;
  mode: string;
}

export interface MetaStats {
  runsStarted: number;
  runsWon: number;
  trialsWon: number;
  elitesWon: number;
  bossesWon: number;
  bestArgument: number;
  highestAppealWon: number;
}

export interface MetaState {
  version: number;
  settings: SettingsState;
  unlockedCharacters: string[];
  /** Highest Appeal cleared per character (so the next level unlocks). */
  highestAppealCleared: Record<string, number>;
  charactersWonWith: string[];
  achievements: string[];
  seenCards: string[];
  seenPrecedents: string[];
  seenEnemies: string[];
  runHistory: RunHistoryEntry[];
  stats: MetaStats;
  tutorialDone: boolean;
}

export function defaultSettings(): SettingsState {
  return {
    masterVolume: 0.8,
    sfxVolume: 0.8,
    musicVolume: 0.45,
    reduceMotion: false,
    screenShake: true,
    colorblind: 'off',
    textScale: 1,
    fastMode: false,
  };
}

export function defaultMeta(): MetaState {
  return {
    version: META_VERSION,
    settings: defaultSettings(),
    unlockedCharacters: ['litigator'],
    highestAppealCleared: {},
    charactersWonWith: [],
    achievements: [],
    seenCards: [],
    seenPrecedents: [],
    seenEnemies: [],
    runHistory: [],
    stats: {
      runsStarted: 0,
      runsWon: 0,
      trialsWon: 0,
      elitesWon: 0,
      bossesWon: 0,
      bestArgument: 0,
      highestAppealWon: -1,
    },
    tutorialDone: false,
  };
}

export interface SavedRunEnvelope {
  version: number;
  run: RunState;
}
