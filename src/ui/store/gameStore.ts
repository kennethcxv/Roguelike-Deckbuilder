/**
 * The UI store bridges React to the pure engine. Every mutating action clones the run
 * (so the engine stays pure and React sees a new reference), applies an engine reducer,
 * and commits. Combat RNG is threaded through the encounter's serialized rngState.
 */

import { create } from 'zustand';
import { DB } from '../../content';
import {
  createRun,
  enterNode as engEnterNode,
  runToggleArgument,
  runPlayAction,
  runPresent,
  runDiscard,
  runEndTurn,
  runPlayCombatMotion,
  takeCardReward,
  skipCardReward,
  takePrecedentReward,
  takeMotionReward,
  finishRewards,
  chooseEventOption,
  finishEvent,
  shopBuyCard,
  shopBuyPrecedent,
  shopBuyMotion,
  shopSellCard,
  shopRemoveCard,
  leaveShop,
  restRecuperate,
  restStudy,
  playMapMotion,
} from '../../engine';
import type { RunMode, RunState, ScoringResult } from '../../engine';
import { playSfx } from '../../audio';

export interface CascadeData {
  result: ScoringResult;
  fromDoubt: number;
  target: number;
}
import {
  loadMeta,
  saveMeta,
  loadRun,
  saveRun,
  clearRun,
  recordRunResult,
  type MetaState,
} from '../../save';

export type AppScreen = 'title' | 'characterSelect' | 'settings' | 'codex' | 'run';
export type Overlay = 'deck' | 'precedents' | 'settings' | 'map' | 'help' | null;

export interface GameStore {
  appScreen: AppScreen;
  overlay: Overlay;
  run: RunState | null;
  meta: MetaState;
  /** Mode selected on the title screen, consumed by character select. */
  pendingMode: RunMode;
  /** Active scoring cascade to animate (null when idle). */
  cascade: CascadeData | null;
  /** Bumped whenever settings change so subscribers (audio) react. */
  tick: number;

  setAppScreen: (s: AppScreen) => void;
  setOverlay: (o: Overlay) => void;
  setPendingMode: (m: RunMode) => void;
  clearCascade: () => void;

  startRun: (characterId: string, mode: RunMode, seedLabel: string, appeal: number) => void;
  resumeRun: () => void;
  abandonRun: () => void;
  returnToTitle: () => void;

  // combat
  toggleArgument: (uid: string) => void;
  playAction: (uid: string) => void;
  present: () => void;
  discard: (uids: string[]) => void;
  endTurn: () => void;
  playCombatMotion: (id: string) => void;

  // rewards
  takeCard: (i: number) => void;
  skipCard: () => void;
  takePrecedent: () => void;
  takeMotion: () => void;
  finishRewards: () => void;

  // events
  chooseEvent: (i: number) => void;
  finishEvent: () => void;

  // shop
  buyCard: (i: number) => void;
  buyPrecedent: (i: number) => void;
  buyMotion: (i: number) => void;
  sellCard: (uid: string) => void;
  removeCard: (uid: string) => void;
  leaveShop: () => void;

  // rest
  restRecuperate: () => void;
  restStudy: (uid: string) => void;

  // map
  enterNode: (id: string) => void;
  playMapMotion: (id: string) => void;

  updateMeta: (fn: (m: MetaState) => void) => void;
}

function persist(run: RunState | null): void {
  if (run && run.result === null) saveRun(run);
  else clearRun();
}

export const useGame = create<GameStore>((set, get) => {
  /** Clone → mutate → commit; persists run + checks for unlocks on terminal states. */
  const act = (fn: (run: RunState) => void): void => {
    const cur = get().run;
    if (!cur) return;
    const next = structuredClone(cur);
    fn(next);
    if (next.result !== null && cur.result === null) {
      const meta = structuredClone(get().meta);
      recordRunResult(meta, next, DB);
      saveMeta(meta);
      set({ run: next, meta });
      clearRun();
      playSfx(next.result === 'win' ? 'win' : 'lose');
    } else {
      set({ run: next });
      persist(next);
    }
  };

  return {
    appScreen: 'title',
    overlay: null,
    run: null,
    meta: loadMeta(),
    pendingMode: 'standard',
    cascade: null,
    tick: 0,

    setAppScreen: (s) => set({ appScreen: s, overlay: null }),
    setOverlay: (o) => set({ overlay: o }),
    setPendingMode: (m) => set({ pendingMode: m }),
    clearCascade: () => set({ cascade: null }),

    startRun: (characterId, mode, seedLabel, appeal) => {
      const run = createRun({ content: DB, seedLabel, mode, characterId, appeal });
      saveRun(run);
      const meta = structuredClone(get().meta);
      meta.stats.runsStarted += 1;
      saveMeta(meta);
      set({ run, meta, appScreen: 'run', overlay: null });
    },
    resumeRun: () => {
      const run = loadRun(DB);
      if (run) set({ run, appScreen: 'run', overlay: null });
    },
    abandonRun: () => {
      clearRun();
      set({ run: null, appScreen: 'title', overlay: null });
    },
    returnToTitle: () => set({ appScreen: 'title', overlay: null }),

    toggleArgument: (uid) => {
      playSfx('click');
      act((r) => void runToggleArgument(r, DB, uid));
    },
    playAction: (uid) => {
      playSfx('card');
      act((r) => void runPlayAction(r, DB, uid));
    },
    present: () => {
      const cur = get().run;
      if (!cur?.encounter || cur.encounter.phase !== 'player') return;
      const fromDoubt = cur.encounter.doubt;
      const target = cur.encounter.doubtTarget;
      act((r) => void runPresent(r, DB));
      const after = get().run;
      const result = after?.encounter?.lastScoring ?? null;
      if (result) set({ cascade: { result, fromDoubt, target } });
    },
    discard: (uids) => {
      playSfx('shuffle');
      act((r) => void runDiscard(r, DB, uids));
    },
    endTurn: () => {
      playSfx('gavel');
      act((r) => runEndTurn(r, DB));
    },
    playCombatMotion: (id) => {
      playSfx('present');
      act((r) => void runPlayCombatMotion(r, DB, id));
    },

    takeCard: (i) => {
      playSfx('card');
      act((r) => void takeCardReward(r, i));
    },
    skipCard: () => act((r) => skipCardReward(r)),
    takePrecedent: () => {
      playSfx('coin');
      act((r) => void takePrecedentReward(r));
    },
    takeMotion: () => {
      playSfx('coin');
      act((r) => void takeMotionReward(r));
    },
    finishRewards: () => act((r) => finishRewards(r)),

    chooseEvent: (i) => {
      playSfx('click');
      act((r) => void chooseEventOption(r, DB, i));
    },
    finishEvent: () => act((r) => finishEvent(r)),

    buyCard: (i) => {
      playSfx('coin');
      act((r) => void shopBuyCard(r, i));
    },
    buyPrecedent: (i) => {
      playSfx('coin');
      act((r) => void shopBuyPrecedent(r, i));
    },
    buyMotion: (i) => {
      playSfx('coin');
      act((r) => void shopBuyMotion(r, i));
    },
    sellCard: (uid) => {
      playSfx('coin');
      act((r) => void shopSellCard(r, DB, uid));
    },
    removeCard: (uid) => {
      playSfx('coin');
      act((r) => void shopRemoveCard(r, uid));
    },
    leaveShop: () => act((r) => leaveShop(r)),

    restRecuperate: () => act((r) => restRecuperate(r)),
    restStudy: (uid) => {
      playSfx('card');
      act((r) => void restStudy(r, DB, uid));
    },

    enterNode: (id) => {
      playSfx('click');
      act((r) => void engEnterNode(r, DB, id));
    },
    playMapMotion: (id) => act((r) => void playMapMotion(r, DB, id)),

    updateMeta: (fn) => {
      const meta = structuredClone(get().meta);
      fn(meta);
      saveMeta(meta);
      set({ meta, tick: get().tick + 1 });
    },
  };
});
