# DECISIONS

Design and engineering decisions, with rationale. Append-only log; newest at top of
each section.

## Theme & naming
- **Title: "Reasonable Doubt."** Defense attorney roguelike. Player builds **Doubt**;
  the prosecution builds **Conviction**.
- **Currency: Retainer.** A lawyer's fee. Used in shops; sellback supported.
- **Consumables: Motions** (one-shot), per spec.
- **Relics: Precedents.** Persistent passives that hook the scoring/encounter pipeline.
- **Acts:** Small Claims → District Court → Supreme Court (rising courts), each ending
  in a boss trial.

## Core model
- **Two-meter race.** A trial defines `doubtTarget` (reach it → Acquittal/win) and
  `convictionLimit` (prosecution reaches it → you lose), plus `maxRounds` (recesses)
  backstop. Player accrues cumulative Doubt; prosecution is an active opponent that
  gains Conviction, can raise the target, plays Objections, calls Witnesses, applies
  statuses. This satisfies both "each trial has a target" and "build Doubt faster than
  the prosecution builds Conviction."
- **Scoring:** `Doubt = round(base × mult)`, `mult` starts at `x1`. One ordered,
  event-driven pipeline: `ARGUMENT_START → (per card: base, mult, CARD_SCORED hooks) →
  ARGUMENT_TALLY → ARGUMENT_END`. Produces a step-by-step trace consumed by the UI
  cascade. Engine is pure; UI only renders the trace.
- **Per-round loop:** draw to hand size → optional **Object** (discard, limited) →
  **Present Argument** (play selected cards; limited arguments/round) → pipeline adds
  Doubt → prosecution phase executes telegraphed Intent.
- **Composure** is the player's between-and-within-trial buffer that absorbs Conviction
  pressure (HP analog); running out is not instant loss by itself — losing a trial is.
  Composure carries between trials and is restored at Recess nodes.

## Stack & architecture
- TypeScript **strict**, React 18, Vite 5, Vitest 2, Zustand for UI state.
- **`exactOptionalPropertyTypes` is OFF**; `strict` + `noUncheckedIndexedAccess` +
  `noUnusedLocals/Parameters` + `noFallthroughCasesInSwitch` are ON. Rationale:
  `exactOptionalPropertyTypes` creates heavy friction with React props for marginal
  benefit on a build this large; the other flags catch real engine bugs (esp. array
  indexing in the deterministic core) and are worth the friction.
- **Strict layer boundaries enforced by ESLint** (`no-restricted-imports`): `engine`
  imports nothing from ui/audio/save/sim/content (and no React); `content` imports
  engine only (no ui/audio/save/sim, no React). Rebalancing/re-skinning = edit
  `/content` only.
- **All randomness through one seeded RNG** (`mulberry32`-class) split into named,
  independent streams (map, combat, rewards, shop, event, sim) so a seed reproduces a
  run exactly. Determinism is test-verified.
- **Persistence: `localStorage`** (sufficient and synchronous) with a versioned
  migration chain for run + meta + settings. (IndexedDB deemed unnecessary complexity.)
- **No external assets:** all visuals in CSS/SVG/canvas; all audio synthesized via
  WebAudio.

## Characters (ship 3; engine supports N)
- **The Litigator** — mult-scaling aggression. Default unlocked.
- **The Fixer** — deck manipulation / Object-discard engine. Unlock: win Act 1.
- **The Showman** — rewards a single huge argument. Unlock: land a 500+ Doubt argument.
- A 4th (**The Public Defender**, Composure/endurance) is a stretch goal for Phase 7.

## Keywords (data-driven, shared by cards/Precedents/enemies)
`Sustained`, `Overruled`, `Hearsay`, `Contempt`, `Rattled`, `Composure`, `Evidence`,
`Leading`, `Witness`, `Stricken`. (Definitions in `content/keywords.ts`.)

## UI, audio, persistence (Phases 4–6)
- **State:** a Zustand store wraps the pure engine with a clone → reduce → commit pattern
  (`structuredClone` the run, apply an engine reducer, set the new reference). Keeps the
  engine pure while giving React new references. Combat RNG is threaded through the
  encounter's serialized `rngState` for save/resume mid-trial.
- **Keyword mechanics live in the engine** (canonical ids + per-stack magnitudes in
  `engine/keywords.ts`); content owns each keyword's name/description/tone/decay. Defining
  a keyword's *behavior* is mechanics, not "rebalancing," so this respects the
  content-only rule for tuning/skinning.
- **Persistence:** `localStorage` with a defensive migration that upgrades any old/partial
  payload to the current shape; saved runs that reference now-missing content are
  discarded rather than crashing.
- **Appeal scaling:** Doubt targets ×(1 + 0.04·Appeal). Simple, legible ladder; tuned via
  the sim.
- **Audio:** all SFX/music synthesized at runtime (WebAudio), initialised on first user
  gesture, no-ops where WebAudio is unavailable (tests/SSR).
- **Juice gating:** the scoring cascade animates step-by-step; screen shake, confetti, and
  number pops are gated by the reduce-motion / screen-shake settings.

## Balance approach (Phase 8)
- The sim's auto-player is "reasonable, not optimal"; reported win-rates are a floor.
- High win-rates for assembled Precedent *pairs* (the "broken combos") are a design goal —
  the ≥4 reachable engine archetypes — not defects. The pass targeted a sane curve (all
  attorneys winnable at Appeal 0, declining to ~single digits at Appeal 20) and fixed the
  one genuinely weak character (the Fixer) and card (Quid Pro Quo). See BALANCE.md.

## Meta & modes
- **Appeals 0–20** ascension ladder of stacking modifiers.
- Modes: **Standard**, **Daily Challenge** (seed = UTC date), **Custom Seed**.
- Persistent unlocks (cards/Precedents/characters), achievements, run-history stats.
