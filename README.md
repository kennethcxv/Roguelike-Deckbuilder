# Reasonable Doubt

A single-player **roguelike deckbuilder** in the Slay-the-Spire / Balatro lineage, themed
as a courtroom defense attorney. You are the defense; every encounter is a trial; you win
by building **Doubt** to the Acquittal target faster than the prosecution builds
**Conviction** against your **Composure** — climbing three acts of rising court
(Small Claims → District → Supreme), each ending in a rule-mutating boss trial.

Everything is generated at runtime: all visuals are CSS/SVG/canvas, all audio is
synthesized via WebAudio — there are **no external asset files**.

## Quick start

```bash
npm install
npm run dev        # play in the browser (Vite dev server)
```

Then open the printed URL. To play the optimized build:

```bash
npm run build
npm run preview
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server. |
| `npm run build` | Production build to `dist/`. |
| `npm run preview` | Serve the production build. |
| `npm run typecheck` | Strict `tsc --noEmit`. |
| `npm run test` / `npm run test:run` | Vitest (watch / once). |
| `npm run lint` | ESLint (zero warnings allowed). |
| `npm run validate` | Run only the content-validation test. |
| `npm run sim` | Balance simulator — full-run win-rate by character × Appeal. |
| `npm run sim -- --analyze --runs 400` | Per-card/Precedent contribution, dead-card / OP / broken-combo detection. |
| `npm run sim -- --trials` | Per-enemy trial win-rates with starting decks. |

## How to play

- Each **trial**, draw a hand. Click **argument cards** to stage them into your argument;
  click **action cards** to resolve them immediately (draw, Evidence, Objections…).
- **Rest Your Case** scores the staged argument through an animated
  `base × mult = Doubt` cascade and adds it to your Doubt. Cards cost **Focus**.
- **Object** to discard chosen cards and redraw (limited per round).
- **End Turn** — the prosecution executes its telegraphed **Intent**: gaining Conviction,
  raising the target, Overruling cards, calling Witnesses, or inflicting statuses.
- Win the trial at `Doubt ≥ target`. Lose if `Conviction ≥ Composure` or the rounds run
  out. Between trials, navigate a branching map: trials, elites, events, shops (the Law
  Library), and rests (Chambers). Draft cards, collect **Precedents** (relics), and buy
  **Motions** (consumables).

Three attorneys (the Litigator, the Fixer, the Showman), an **Appeals 0–20** ascension
ladder, **Daily** and **Custom-seed** modes, achievements, a Codex, and save/resume are
all in. Accessibility: colorblind palettes, scalable text, reduce-motion, screen-shake
toggle, and keyboard support — all in **Settings**.

## Architecture

Strict separation, enforced by ESLint import boundaries:

```
src/
  engine/   Pure, deterministic, UI-free: seeded RNG, effect/scoring pipeline,
            keyword/status system, encounter loop, prosecution AI, map, run state machine.
  content/  DATA ONLY (+ typed schema + validation): cards, Precedents, events, encounters,
            characters, motions, tuning constants, keyword data, all player-facing strings.
  ui/       React components, screens, the Zustand store that bridges to the engine.
  audio/    WebAudio-synthesized SFX + adaptive per-act music.
  save/     localStorage persistence with versioned migrations (run + meta + settings).
  sim/      Headless balance simulator and analytics.
```

- **Determinism:** all randomness flows through one seeded RNG (`engine/rng.ts`) split into
  named streams, so a seed reproduces a run exactly (test-verified).
- **Rebalancing or re-skinning means editing `/content` only** — see `CONTENT.md`.

## Docs

- `CONTENT.md` — how to add a card / Precedent / event / enemy by editing `/content`.
- `BALANCE.md` — the balance methodology, difficulty curve, and tuning pass.
- `DECISIONS.md` — design and engineering decisions with rationale.
- `PLAN.md` / `PROGRESS.md` — the build plan and iteration log.

## Tech

TypeScript (strict) · React 18 · Vite 5 · Vitest 2 · Zustand. No runtime art/audio
dependencies.
