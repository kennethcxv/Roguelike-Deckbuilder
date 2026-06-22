# BALANCE

How _Reasonable Doubt_ is balanced, the data behind it, and the tuning pass performed.

## The balance simulator

`npm run sim` headlessly auto-plays full runs with a deterministic, focus-aware greedy
strategy (`src/sim/strategy.ts`) and reports win-rate curves. Because the engine is pure
and seeded, every simulated run is reproducible.

Modes:

| Command | What it does |
| --- | --- |
| `npm run sim` | Full-run win-rate by character × Appeal (the headline difficulty curve). |
| `npm run sim -- --runs 80 --appeals 0,5,10,15,20` | More runs / specific Appeals. |
| `npm run sim -- --analyze --runs 300` | Per-card & per-Precedent win-rate contribution, dead-card / overpowered detection, broken-combo (Precedent-pair) detection. |
| `npm run sim -- --trials` | Per-enemy trial win-rate with starting decks (isolates encounter difficulty). |

The auto-player: plays defensive actions when a loss is imminent next round; plays
utility (draw/Evidence/Focus) only when a one-step lookahead shows it raises the best
affordable argument; Objects/discards chaff to dig for its engine pieces; then greedily
builds and presents the highest-Doubt argument it can afford. It is intentionally a
"reasonable but not optimal" player — human win-rates run higher.

## Difficulty curve (50 runs/cell, full auto-runs)

Win rate by character and Appeal level:

| Attorney | A0 | A5 | A10 | A15 | A20 |
| --- | --- | --- | --- | --- | --- |
| The Litigator | 54% | 42% | 26% | 28% | 12% |
| The Fixer | 38% | 16% | 4% | 4% | 4% |
| The Showman | 34% | 16% | 24% | 12% | 6% |

This is the intended shape: Appeal 0 is winnable by all three attorneys (≈34–54%), with
a steady decline to ≈4–12% at Appeal 20. The Litigator is the most consistent; the Fixer
is the hardest, most engine-dependent character (it must assemble its Evidence/Object
loop before it comes online), and the Showman is high-variance (one giant argument can win
a trial outright, but boss rule-mutators — especially the biased judge's mult cap — punish
all-in plays). Small per-cell sample sizes (50) introduce a few points of noise (e.g. the
Litigator's A15 reading); run with `--runs 200` for tighter intervals.

## Engine archetypes (the "good" broken combos)

The spec calls for ≥4 reachable broken-build archetypes. The `--analyze` Precedent-pair
report confirms they exist and are powerful (pair win-rates of ~85–100% when assembled):

- **Sustained mult engine** — _Measured Cadence + Opening Refrain_, _Metronome + Sustain
  Pedal_, _Crescendo Coach_ (Litigator). Stack Sustained, then multiply.
- **Retrigger/scaling engine** — _Echo Chamber + The Metronome_, _Cross-Examiner_. Re-score
  key cards each argument.
- **Evidence engine** — _Forensic Accountant + Chain of Custody_, _Evidence Locker + Deep
  Breaths_, _Smoking Gun_ (Fixer). Bank Evidence, convert to mult.
- **Object/discard engine** — _Notary Stamp + Redaction Marker_, _Paper Trail_. Discarding
  fuels Evidence and base.
- **Big-play engine** — _The Grandstand + Surprise Exhibit_, _Star Power_, _Spotlight_
  (Showman). One enormous argument.

These high pair win-rates are a **design goal**, not a defect: finding and assembling an
engine should feel powerful. No single _common_ Precedent trivializes the game on its own
(top single-Precedent win-rates sit ~55–66% and require building around them).

## Tuning pass performed

Driven by the `--analyze` output:

- **Smarter auto-player** — added Object/discard cycling so the sim measures discard- and
  Evidence-engine characters fairly (this alone lifted the Fixer materially).
- **The Fixer** was underpowered (≈12% A0). Reworked its starting deck around its engine
  (added two `Cite Precedent` for reliable Evidence→base), raised starting Composure
  55→62, and buffed `Opening Brief` base 6→8. Result: ≈38% A0.
- **Quid Pro Quo** was the only genuine dead card (−13.7% contribution). Rebuilt: base
  4→8, +8 base per Objection, +1 base per Evidence.
- **The Showman** folds to boss drains; raised starting Composure 50→56 and `Opening with
  Flair` base 6→7 for early consistency.
- "Overpowered" flags (contribution > +18%) were reviewed and are predominantly
  selection bias on strong rares (you win more in runs where you found a build-defining
  card) and the intended engine pieces above — left as-is.

All balance changes live in `/content` only (`characters.ts`, `cards/*`, `tuning.ts`) and
in the sim strategy; the engine was not touched.

## Re-running the pass

```
npm run sim                      # difficulty curve
npm run sim -- --analyze --runs 400
```

Adjust numbers in `src/content/tuning.ts` and the card/precedent/character data, then
re-run. The content-validation test (`npm run validate`) guarantees edits stay well-formed.
