/**
 * Post-trial reward generation: Retainer, a 1-of-N card draft, and (for elites/bosses)
 * a Precedent. Pure and seeded.
 */

import { clamp } from './state';
import type {
  CardDef,
  CardReward,
  ContentLookup,
  EnemyDef,
  PendingRewards,
  PrecedentDef,
  Rarity,
} from './types';
import type { Rng } from './rng';

export function rewardableCards(
  content: ContentLookup,
  characterId: string,
  rarity?: Rarity,
): CardDef[] {
  return content.allCards().filter(
    (c) =>
      (c.character === 'neutral' || c.character === characterId) &&
      c.rarity !== 'starter' &&
      c.rarity !== 'special' &&
      !c.unplayable &&
      (rarity === undefined || c.rarity === rarity),
  );
}

export function rewardablePrecedents(content: ContentLookup): PrecedentDef[] {
  return content.allPrecedents().filter((p) => p.rarity !== 'starter' && p.rarity !== 'special');
}

export function rollCardRewards(
  content: ContentLookup,
  rng: Rng,
  characterId: string,
  act: number,
  count: number,
): CardReward[] {
  const weights = content.tuning.cardRewardRarityWeights[clamp(act - 1, 0, 2)] ?? {
    common: 60,
    uncommon: 30,
    rare: 10,
  };
  const out: CardReward[] = [];
  const used = new Set<string>();
  let attempts = 0;
  while (out.length < count && attempts++ < 80) {
    const rarity = rng.weighted<Rarity>([
      { value: 'common', weight: weights.common },
      { value: 'uncommon', weight: weights.uncommon },
      { value: 'rare', weight: weights.rare },
    ]);
    const pool = rewardableCards(content, characterId, rarity).filter((c) => !used.has(c.id));
    if (pool.length === 0) continue;
    const card = rng.pick(pool);
    used.add(card.id);
    out.push({ cardId: card.id, upgraded: false });
  }
  // Fill from the whole pool if rarity rolls came up short (tiny content sets).
  if (out.length < count) {
    const all = rewardableCards(content, characterId).filter((c) => !used.has(c.id));
    for (const c of rng.shuffle(all)) {
      if (out.length >= count) break;
      used.add(c.id);
      out.push({ cardId: c.id, upgraded: false });
    }
  }
  return out;
}

export function rollPrecedent(
  content: ContentLookup,
  rng: Rng,
  owned: string[],
): string | null {
  const w = content.tuning.precedentRarityWeights;
  const ownedSet = new Set(owned);
  let attempts = 0;
  while (attempts++ < 40) {
    const rarity = rng.weighted<Rarity>([
      { value: 'common', weight: w.common },
      { value: 'uncommon', weight: w.uncommon },
      { value: 'rare', weight: w.rare },
    ]);
    const pool = rewardablePrecedents(content).filter(
      (p) => p.rarity === rarity && !ownedSet.has(p.id),
    );
    if (pool.length > 0) return rng.pick(pool).id;
  }
  const any = rewardablePrecedents(content).filter((p) => !ownedSet.has(p.id));
  return any.length > 0 ? rng.pick(any).id : null;
}

export function buildTrialRewards(
  content: ContentLookup,
  rng: Rng,
  characterId: string,
  act: number,
  enemy: EnemyDef,
  ownedPrecedents: string[],
): PendingRewards {
  const tuning = content.tuning;
  const eliteOrBoss = enemy.kind === 'elite' || enemy.kind === 'boss';
  const kindMul = enemy.kind === 'boss' ? 3 : enemy.kind === 'elite' ? 2 : 1;
  const retainer = Math.round(
    (tuning.trialRetainerReward + rng.range(0, 10)) * kindMul + (act - 1) * 6,
  );

  const cardChoices = rollCardRewards(content, rng, characterId, act, tuning.cardRewardChoices);
  const precedentId = eliteOrBoss ? rollPrecedent(content, rng, ownedPrecedents) : null;

  let motionId: string | null = null;
  if (!eliteOrBoss && rng.bool(0.35)) {
    const pool = content.allMotions().filter((m) => m.rarity !== 'special');
    if (pool.length > 0) motionId = rng.pick(pool).id;
  }

  return {
    retainer,
    cardChoices,
    precedentId,
    motionId,
    cardTaken: false,
    precedentTaken: precedentId === null,
    motionTaken: motionId === null,
  };
}
