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
- [~] Install deps; verify dev/build/test/typecheck/lint wiring
- [~] PLAN.md / PROGRESS.md / DECISIONS.md skeletons; initial commit

## Phase 1 — Engine core
- [ ] `engine/rng.ts` seeded RNG + named sub-streams (+ determinism tests)
- [ ] `engine/types.ts` all engine types
- [ ] `engine/keywords.ts` status registry, stacking/decay, apply/clear
- [ ] `engine/effects.ts` typed effect ops + resolver over ordered pipeline phases
- [ ] `engine/scoring.ts` base×mult cascade w/ step trace + final Doubt (pure)
- [ ] tests: RNG determinism, every effect op, pipeline order, keyword interactions

## Phase 2 — Content schemas + seed content + sim
- [ ] `content/schema.ts` validators; `tuning.ts`, `strings.ts`, `keywords.ts`
- [ ] seed content (cards, Precedents, character, enemies, boss, events)
- [ ] `sim/` headless runner + first report; `npm run sim` works
- [ ] content-validation test (records valid, id refs resolve)

## Phase 3 — Encounter / run / map / economy + AI
- [ ] `engine/encounter.ts` round loop, Doubt/Conviction/target, win/lose, statuses, Witness
- [ ] `engine/ai.ts` prosecution Intent telegraph→execute, scaling, boss mutators
- [ ] `engine/map.ts` seeded 3-act branching DAG
- [ ] `engine/run.ts` run lifecycle, deck mgmt, Composure, Retainer, relics
- [ ] `engine/rewards.ts` + `engine/shop.ts`
- [ ] integration tests: scripted encounter + full seeded run to a boss

## Phase 4 — Full UI
- [ ] Zustand store bridging engine; screen routing
- [ ] Screens: Title, CharacterSelect, Map, Trial, Reward, Shop, Event, Rest,
      DeckView, PrecedentView, Settings, RunSummary, Codex
- [ ] Keyboard support baseline; full run completable in-browser

## Phase 5 — Meta-progression, save/load, settings, modes
- [ ] `save/` versioned schema + migration chain; autosave/resume; meta + settings
- [ ] unlocks, Appeals 0–20 ladder, achievements, run-history stats
- [ ] modes: Standard, Daily (date-seed), Custom Seed

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
