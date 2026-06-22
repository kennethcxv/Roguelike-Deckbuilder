# PROGRESS

Iteration log. Newest at top.

## Iteration 5 — Phases 4 & 5 (full UI + meta/save)
- Zustand store bridges React to the pure engine (clone → reduce → commit; combat RNG
  threaded via encounter.rngState). Autosaves run; resumes on relaunch.
- Every screen built: Title, Character Select (modes + appeal + seed), Map (branching
  node grid), Trial (hand/argument staging, live base×mult preview, intents, statuses,
  Object/discard, motions, score flash), Reward draft, Shop (buy/sell/remove), Event,
  Rest, Run Summary, Settings, Codex, plus in-run HUD + Deck/Precedents/Help/Menu overlays.
- Save layer (`/save`): versioned schema + defensive migrations + corruption-safe load;
  meta-progression (character unlocks, achievements, Appeals ladder, run history, codex
  "seen" sets); 3 modes (standard/daily/custom).
- Noir-parchment + CRT art-direction CSS baseline; keyword tooltips. 66 tests incl. UI
  smoke (title→run→overlay) with no console errors.

## Iteration 4 — Phase 3 (run/map/economy)
- Seeded StS-style branching map generator (3 acts, merging paths, typed nodes, bosses).
- Full run state machine (`engine/run.ts`): map navigation → trials/events/shops/rest →
  rewards (1-of-3 draft + Precedent + Motion) → next act → win/lose. Deck add/remove/
  upgrade/transform, Retainer economy, Composure as run-persistent HP, consumable Motions
  (combat + map), 6 branching events, shop with buy/sell/remove.
- `engine/rewards.ts` + `engine/shop.ts` (seeded generation + pricing).
- Full-run auto-player (`sim/autoRun.ts`) + win-rate-by-Appeal report. Baseline curve:
  Litigator 53%→3% across Appeals 0–20. 63 tests green incl. map/run determinism +
  full-run integration.

## Iteration 3 — Phase 2 (content + sim) and the encounter engine
- Locked the combat model: win at `doubt >= doubtTarget`; lose when prosecution
  `conviction >= composure` or rounds run out. Composure is your breaking point.
- Built the content layer (data-only): tuning, keyword display data, 28 cards across
  3 characters + neutrals, 17 interacting Precedents (seeding Evidence / Object-discard /
  Sustained / Big-play engines), 3 characters with starting decks, 13 enemies incl.
  rule-mutating bosses (biased judge mult cap, hung-jury Doubt drain, supreme composure
  drain). Validation schema + fail-fast load + tests.
- Built the encounter round loop (`engine/encounter.ts`) and prosecution AI
  (`engine/ai.ts`): telegraphed intents, witnesses, overrules, ramps.
- Built the balance sim (`npm run sim`): a focus-aware greedy auto-player, deterministic,
  with a per-character/per-enemy win-rate report. Baseline: all characters ~100% in
  Act 1 with starting decks, tapering later (pre-progression). 57 tests green.

## Iteration 2 — Phase 1 (engine core)
- See git history: RNG, types, effects, scoring cascade, keywords + 45 tests.

## Iteration 1 — Phase 0 scaffold
- Initialized greenfield TypeScript/React/Vite/Vitest project on branch
  `claude/great-ritchie-8cv2c2`.
- Added tooling: strict tsconfig, vite+vitest config, ESLint (with engine/content
  import-boundary rules), Prettier, gitignore.
- Added minimal app entry (`index.html`, `main.tsx`, `App.tsx`, `global.css`) and test
  setup.
- Authored living docs: PLAN.md (phase checklist), DECISIONS.md (design log),
  PROGRESS.md (this file).
- Installed dependencies (exit 0). Next: verify the toolchain gate, commit Phase 0,
  then build the engine core (Phase 1).
