# PLAN — Reasonable Doubt

A courtroom roguelike deckbuilder (Slay-the-Spire / Balatro lineage). You are a
defense attorney; every encounter is a trial; you win by building **Doubt** faster
than the prosecution builds **Conviction**.

Phases run in order. After **every** phase the gate must be green:
`npm run typecheck` · `npm run test:run` · `npm run lint` · `npm run build` ·
`npm run sim`. No stubs, TODOs, or unimplemented declared effects, ever.

Legend: `[ ]` todo · `[x]` done · `[~]` in progress.

---

## Phase 0 — Scaffold
- [x] package.json, tsconfig(.node), vite/vitest config, eslint, prettier, gitignore
- [x] index.html + minimal `src/main.tsx` / `App.tsx` / `styles/global.css`
- [x] Install deps; verify dev/build/test/typecheck/lint wiring
- [x] PLAN.md / PROGRESS.md / DECISIONS.md skeletons; initial commit

## Phase 1 — Engine core
- [x] `engine/rng.ts` seeded RNG + named sub-streams (+ determinism tests)
- [x] `engine/types.ts` all engine types
- [x] `engine/keywords.ts` status registry, stacking/decay, apply/clear
- [x] `engine/effects.ts` typed effect ops + resolver over ordered pipeline phases
- [x] `engine/scoring.ts` base×mult cascade w/ step trace + final Doubt (pure)
- [x] tests: RNG determinism, every effect op, pipeline order, keyword interactions

## Phase 2 — Content schemas + seed content + sim
- [x] `content/schema.ts` validators; `tuning.ts`, `strings.ts`, `keywords.ts`
- [x] seed content (28 cards, 17 Precedents, 3 characters, 13 enemies + bosses)
- [x] `sim/` headless runner + report; `npm run sim` works
- [x] content-validation test (records valid, id refs resolve)

## Phase 3 — Encounter / run / map / economy + AI
- [x] `engine/encounter.ts` round loop, Doubt/Conviction/target, win/lose, statuses, Witness
- [x] `engine/ai.ts` prosecution Intent telegraph→execute, scaling, boss mutators
- [x] `engine/map.ts` seeded 3-act branching DAG
- [x] `engine/run.ts` run lifecycle, deck mgmt, Composure, Retainer, relics
- [x] `engine/rewards.ts` + `engine/shop.ts`
- [x] integration tests: scripted encounter + full seeded run to a boss

## Phase 4 — Full UI
- [x] Zustand store bridging engine; screen routing
- [x] Screens: Title, CharacterSelect, Map, Trial, Reward, Shop, Event, Rest,
      DeckView, PrecedentView (overlays), Settings, RunSummary, Codex
- [x] Keyboard support baseline; full run completable in-browser (smoke-tested)

## Phase 5 — Meta-progression, save/load, settings, modes
- [x] `save/` versioned schema + migration chain; autosave/resume; meta + settings
- [x] unlocks, Appeals 0–20 ladder, achievements, run-history stats
- [x] modes: Standard, Daily (date-seed), Custom Seed

## Phase 6 — Audio, art, juice, tutorial, codex, a11y
- [ ] `audio/` WebAudio SFX + adaptive per-act music + volumes
- [ ] cohesive CSS/SVG art direction; card frames per type/rarity
- [ ] juice: cascade, number pops, particles, shake, transitions (reduce-motion gated)
- [ ] first-run tutorial trial; keyword/Precedent tooltips; Codex
- [ ] accessibility: colorblind-safe palette, scalable text, reduce-motion, keyboard

## Phase 7 — Content fill to targets
- [ ] 70+ cards across 3 characters + neutrals (all families)
- [ ] 45+ Precedents across rarities; ≥4 reachable engine combos
- [ ] 15+ events, 12+ elite/boss encounters, shop tables, full Motion set
- [ ] every declared effect implemented + unit-tested; codex/strings complete

## Phase 8 — Balance pass
- [ ] sim: win-rate curves per char×Appeal; per-card/Precedent contribution;
      dead-card/OP/broken-combo detection; difficulty-curve report
- [ ] run thousands of runs; tune `/content` only; write BALANCE.md

## Phase 9 — QA + ship
- [ ] all green: typecheck, tests, lint, build, preview (no console errors)
- [ ] zero stubs/TODOs; every declared effect real
- [ ] seeded-determinism test passes
- [ ] walk full Definition of Done against running build
- [ ] finalize README / DECISIONS / BALANCE / CONTENT; final commit + push
