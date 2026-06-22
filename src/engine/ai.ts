/**
 * Prosecution AI. The opponent is active: each round it telegraphs an Intent (chosen
 * from its enemy definition, weighted and condition-gated) and resolves it. Intents
 * raise the target, feed Conviction, Overrule cards, call Witnesses, or apply statuses.
 */

import { evalCondition } from './query';
import { resolveEffects } from './effects';
import { addStatus, nextUid } from './state';
import type {
  ContentLookup,
  EffectContext,
  EncounterState,
  EnemyDef,
  EnemyIntentDef,
  Intent,
} from './types';
import type { Rng } from './rng';

function evalCtx(enc: EncounterState, content: ContentLookup, rng: Rng): EffectContext {
  return {
    rng,
    content,
    enc,
    scoring: null,
    card: null,
    source: { kind: 'status', label: 'Prosecution' },
    retriggerRequested: 0,
  };
}

function toIntent(def: EnemyIntentDef): Intent {
  const intent: Intent = { kind: def.kind, label: def.label, value: def.value };
  if (def.status !== undefined) intent.status = def.status;
  if (def.witness !== undefined) intent.witness = def.witness;
  if (def.effects !== undefined) intent.effects = def.effects;
  return intent;
}

/** Choose the prosecution's next telegraphed intent (deterministic given the rng). */
export function selectIntent(enc: EncounterState, content: ContentLookup, rng: Rng): Intent {
  const def = content.getEnemy(enc.enemyId);
  const ctx = evalCtx(enc, content, rng);
  const eligible = def.intents.filter((i) => !i.condition || evalCondition(ctx, i.condition));
  const pool = eligible.length > 0 ? eligible : def.intents;
  if (pool.length === 0) {
    return { kind: 'conviction', label: 'Press the Case', value: def.baseConvictionPerRound || 5 };
  }
  const chosen = rng.weighted(pool.map((i) => ({ value: i, weight: Math.max(0.0001, i.weight) })));
  return toIntent(chosen);
}

/** Resolve a telegraphed intent against the encounter. */
export function resolveIntent(
  enc: EncounterState,
  content: ContentLookup,
  rng: Rng,
  intent: Intent,
): void {
  const ctx = evalCtx(enc, content, rng);
  switch (intent.kind) {
    case 'conviction':
      enc.prosecution.conviction += intent.value;
      enc.log.push(`Prosecution presses: +${intent.value} Conviction.`);
      break;
    case 'raiseTarget':
      enc.doubtTarget += intent.value;
      enc.log.push(`The bar rises: target +${intent.value}.`);
      break;
    case 'overrule':
      enc.pendingOverrule += intent.value;
      enc.log.push(`Objection sustained: ${intent.value} card(s) to be Overruled.`);
      break;
    case 'witness':
      if (intent.witness) {
        enc.prosecution.witnesses.push({
          id: nextUid('wit'),
          name: intent.witness.name,
          convictionPerRound: intent.witness.convictionPerRound,
          health: intent.witness.health,
          maxHealth: intent.witness.health,
        });
        enc.log.push(`Witness called: ${intent.witness.name}.`);
      }
      break;
    case 'status':
      if (intent.status) {
        addStatus(enc.player.statuses, intent.status, intent.value);
        enc.log.push(`Prosecution inflicts ${intent.status} ${intent.value}.`);
      }
      break;
    case 'drain':
      enc.doubt = Math.max(0, enc.doubt - intent.value);
      enc.log.push(`The jury wavers: Doubt -${intent.value}.`);
      break;
    case 'buff':
      if (intent.status) addStatus(enc.prosecution.statuses, intent.status, intent.value);
      enc.log.push(`Prosecution steels itself.`);
      break;
  }
  resolveEffects(ctx, intent.effects);
}

/** Build a fresh intent for the given enemy without an encounter (used by previews). */
export function previewIntents(def: EnemyDef): Intent[] {
  return def.intents.map(toIntent);
}
