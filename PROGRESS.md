# PROGRESS

Iteration log. Newest at top.

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
