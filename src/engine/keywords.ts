/**
 * Canonical keyword ids and their *mechanics*. Content owns each keyword's display
 * data (name/description/colour); the engine owns how they behave. Per-stack
 * magnitudes live here so they are consistent across cards/precedents/enemies.
 */

import { addStatus, clamp, getStatus, setStatus } from './state';
import type { ContentLookup, EncounterState, StatusBag } from './types';

export const KW = {
  Sustained: 'sustained',
  Overruled: 'overruled',
  Hearsay: 'hearsay',
  Contempt: 'contempt',
  Rattled: 'rattled',
  Composure: 'composure',
  Evidence: 'evidence',
  Leading: 'leading',
  Witness: 'witness',
  Stricken: 'stricken',
} as const;

export type CanonicalKeyword = (typeof KW)[keyof typeof KW];

export const KEYWORD_TUNING = {
  /** Each Sustained stack adds this much flat mult at argument start (then consumed). */
  sustainedMultPerStack: 1,
  /** Each scored Leading card grants this much base to the next scored card. */
  leadingBaseBonus: 3,
  /** Each Rattled stack removes this much Focus at round start. */
  rattledFocusPerStack: 1,
  /** Each Contempt stack adds this much Conviction at round start. */
  contemptConvictionPerStack: 1,
};

/** Apply start-of-round status effects (Rattled drains Focus, Contempt feeds Conviction). */
export function applyRoundStartKeywords(enc: EncounterState): void {
  const rattled = getStatus(enc.player.statuses, KW.Rattled);
  if (rattled > 0) {
    enc.player.focus = clamp(
      enc.player.focus - rattled * KEYWORD_TUNING.rattledFocusPerStack,
      0,
      enc.player.maxFocus,
    );
    enc.log.push(`Rattled saps ${rattled * KEYWORD_TUNING.rattledFocusPerStack} Focus.`);
  }
  const contempt = getStatus(enc.player.statuses, KW.Contempt);
  if (contempt > 0) {
    enc.prosecution.conviction += contempt * KEYWORD_TUNING.contemptConvictionPerStack;
    enc.log.push(
      `Contempt grants the prosecution ${contempt * KEYWORD_TUNING.contemptConvictionPerStack} Conviction.`,
    );
  }
}

/** Decay/clear statuses at the end of a round per their keyword definitions. */
export function tickEndOfRound(bag: StatusBag, content: ContentLookup): void {
  for (const id of Object.keys(bag)) {
    const def = content.getKeywordOrNull(id);
    if (!def) continue;
    if (def.clearsEndOfRound) {
      setStatus(bag, id, 0);
    } else if (def.decays) {
      addStatus(bag, id, -1);
    }
  }
}
