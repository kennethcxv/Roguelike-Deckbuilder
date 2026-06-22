# CONTENT — authoring guide

All game content is **data** under `src/content/`. The engine interprets it; you never
need to touch `src/engine/` to add or rebalance content. Everything is validated at load
and by `npm run validate`, so a malformed record or a dangling reference fails fast with a
clear message.

After any edit: `npm run validate && npm run typecheck`. To see balance impact:
`npm run sim`.

## Where things live

| File / dir | Contents |
| --- | --- |
| `content/cards/*.ts` | Card definitions (per character + neutral), merged in `cards/index.ts`. |
| `content/precedents/*.ts` | Precedents (relics). |
| `content/events/*.ts` | Branching events. |
| `content/encounters/*.ts` | Enemies (trials, elites, bosses). |
| `content/characters.ts` | Playable attorneys (starting deck/precedents/composure, unlock). |
| `content/motions.ts`, `motions2.ts` | Consumables. |
| `content/keywords.ts` | Keyword display data (name/description/tone/decay). |
| `content/tuning.ts` | Global balance constants. |
| `content/strings.ts` | Player-facing UI strings. |
| `content/achievements.ts` | Achievement names/descriptions. |
| `content/schema.ts` | Validation. `content/index.ts` | The assembled DB. |

## The effect vocabulary

Cards/Precedents/enemy intents/motions all describe behavior with the same `Effect` data
(see `engine/types.ts`). The full op list (each is fully implemented and unit-tested):

`addBase` · `addMult` · `mulMult` · `addBasePer{per,source}` · `addMultPer{per,source}` ·
`raiseDoubt` · `gainEvidence` · `spendEvidence` · `gainComposure` · `loseComposure` ·
`gainFocus` · `gainRetainer` · `reduceConviction` · `drawCards` · `retrigger{times}` ·
`strikeSelf` · `applyStatus{target,status,amount}` · `removeStatus` · `addConviction` ·
`raiseTarget` · `conditional{condition,then,else?}` · `repeat{count,effects}` ·
`forEachInArgument{effects}`.

**Sources** (numbers read from state, for per-X effects and conditions): `const`,
`evidence`, `composure`, `focusUnspent`, `argumentSize`, `handSize`, `cardsPlayedThisRound`,
`discardsThisRound`, `roundNumber`, `deckSize`, `drawPileSize`, `discardPileSize`, `doubt`,
`conviction`, `statusStacks{target,status}`.

**Conditions**: `always`, `not`, `and`, `or`, `sourceAtLeast`, `sourceAtMost`, `hasStatus`,
`cardHasKeyword`, `cardHasCategory`, `firstCardOfArgument`, `coinFlip`.

> The resolver has a compile-time exhaustiveness check: if you add a new op to the union
> without a handler, the build fails. (Adding a new op IS an engine change — most content
> never needs it.)

## Add a card

Use the `mkCard` factory (`content/cards/_factory.ts`) — only `id` and `name` are required.

```ts
// in content/cards/litigator.ts (or any card file)
mkCard({
  id: 'lit.myCard',                 // globally unique among cards
  name: 'My Card',
  character: 'litigator',           // 'neutral' | 'litigator' | 'fixer' | 'showman'
  category: 'Rhetoric',             // drives the card frame + synergies
  rarity: 'uncommon',              // common | uncommon | rare (starter for fixed decks)
  focusCost: 1,
  mult: 2,                          // argument cards use base/mult + onScore
  onScore: [{ op: 'applyStatus', target: 'self', status: KW.Sustained, amount: 1 }],
  text: 'Score +2 mult. Gain 1 Sustained.',   // MUST match the effects
  upgrade: { name: 'My Card+', mult: 3, text: 'Score +3 mult. Gain 1 Sustained.' },
}),
```

- **Argument cards** (`kind:'argument'`, the default) are scored: use `base`, `mult`,
  `onScore`. **Action cards** (`kind:'action'`) resolve on play: use `onPlay`.
- Mention keyword names in `text` so tooltips light up. Use `KW` from
  `engine/keywords`. `exhausts:true` + `KW.Stricken` makes a one-use card.
- It will automatically appear in reward drafts and shops for its character.

## Add a Precedent

```ts
// in content/precedents/index.ts (or precedents2.ts)
{
  id: 'prec.myRelic',
  name: 'My Relic',
  rarity: 'rare',
  text: 'Every 3rd card you score, gain +10 base.',
  hooks: { onCardScored: { everyN: 3, effects: [{ op: 'addBase', amount: 10 }] } },
}
```

Hook phases: `onTrialStart`, `onRoundStart`, `onArgumentStart`, `onCardScored`,
`onArgumentTally`, `onArgumentEnd`, `onPlayCard`, `onDiscard`, `onRoundEnd`, `onAcquit`.
Scoring ops only do something in the scoring phases (`onArgumentStart` / `onCardScored` /
`onArgumentTally`). `condition` gates a hook; `everyN` fires only every Nth trigger.

## Add an event

```ts
// in content/events/index.ts (or events2.ts)
{
  id: 'ev.myEvent',
  name: 'My Event',
  text: 'Something happens. What do you do?',
  options: [
    {
      label: 'Take the risk',
      description: 'Lose 8 Composure. Gain a Precedent.',
      resultText: 'It pays off.',
      requirement: { minComposure: 9 },
      outcomes: [{ kind: 'loseComposure', amount: 8 }, { kind: 'addPrecedent' }],
    },
    { label: 'Decline', description: 'Nothing.', resultText: 'You move on.', outcomes: [{ kind: 'nothing' }] },
  ],
}
```

Outcome kinds: `gainRetainer`, `loseRetainer`, `healComposure`, `loseComposure`,
`gainMaxComposure`, `loseMaxComposure`, `addCard{cardId}`, `addRandomCard{rarity?}`,
`removeRandomCard`, `upgradeRandomCard`, `transformRandomCard`, `addPrecedent{precedentId?}`,
`addMotion{motionId?}`, `nothing`. Prefer the id-less random variants to avoid coupling.

## Add an enemy

In `content/encounters/index.ts` (or `encounters2.ts`): set `kind`, `act`,
`baseDoubtTarget`, `targetRampPerRound`, `maxRounds`, `baseConvictionPerRound`, an
`intents` list, and optionally `rules` (boss mutators: `multCap`, `doubtDrainPerRound`,
`convictionRamp`, `composureDrainPerRound`, `handSizeDelta`). Trials/elites are slotted
onto the map automatically by act; the first `boss` per act is its boss node.

## Rebalance

Tune numbers in `content/tuning.ts` (hand size, Focus, discards, reward weights, prices,
…) and in the per-card/precedent data. Then `npm run sim` to measure and `BALANCE.md` for
methodology. No engine changes required.
