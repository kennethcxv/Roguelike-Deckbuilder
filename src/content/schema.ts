/**
 * Content validation. Runs at load (fail-fast) and in a test. Verifies that every
 * record is well-formed and every cross-reference (card/keyword/precedent id) resolves,
 * so adding content by editing /content can never silently break the game.
 */

import { KW } from '../engine/keywords';
import type {
  CardDef,
  CharacterDef,
  Condition,
  Effect,
  EnemyDef,
  KeywordDef,
  PrecedentDef,
  Source,
} from '../engine/types';

export interface ValidationIssue {
  kind: 'error' | 'warn';
  where: string;
  message: string;
}

export interface ContentBundle {
  cards: CardDef[];
  precedents: PrecedentDef[];
  enemies: EnemyDef[];
  characters: CharacterDef[];
  keywords: KeywordDef[];
}

function keywordRefsInSource(src: Source, out: Set<string>): void {
  if (src.kind === 'statusStacks') out.add(src.status);
}

function keywordRefsInCondition(cond: Condition, out: Set<string>): void {
  switch (cond.kind) {
    case 'hasStatus':
      out.add(cond.status);
      return;
    case 'sourceAtLeast':
    case 'sourceAtMost':
      keywordRefsInSource(cond.source, out);
      return;
    case 'not':
      keywordRefsInCondition(cond.condition, out);
      return;
    case 'and':
    case 'or':
      cond.conditions.forEach((c) => keywordRefsInCondition(c, out));
      return;
    default:
      return;
  }
}

/** Collect every keyword id referenced anywhere in an effect tree. */
export function keywordRefsInEffects(effects: Effect[] | undefined, out: Set<string>): void {
  if (!effects) return;
  for (const e of effects) {
    switch (e.op) {
      case 'applyStatus':
      case 'removeStatus':
        out.add(e.status);
        break;
      case 'addBasePer':
      case 'addMultPer':
        keywordRefsInSource(e.source, out);
        break;
      case 'conditional':
        keywordRefsInCondition(e.condition, out);
        keywordRefsInEffects(e.then, out);
        keywordRefsInEffects(e.else, out);
        break;
      case 'repeat':
        keywordRefsInEffects(e.effects, out);
        break;
      case 'forEachInArgument':
        keywordRefsInEffects(e.effects, out);
        break;
      default:
        break;
    }
  }
}

export function validateContent(bundle: ContentBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const err = (where: string, message: string) => issues.push({ kind: 'error', where, message });
  const warn = (where: string, message: string) => issues.push({ kind: 'warn', where, message });

  const keywordIds = new Set(bundle.keywords.map((k) => k.id));
  const cardIds = new Set<string>();
  const precedentIds = new Set(bundle.precedents.map((p) => p.id));
  const characterIds = new Set(bundle.characters.map((c) => c.id));

  // Unique + structural checks for cards.
  for (const c of bundle.cards) {
    if (cardIds.has(c.id)) err(`card:${c.id}`, 'duplicate card id');
    cardIds.add(c.id);
    if (!c.name) err(`card:${c.id}`, 'missing name');
    if (!c.text) warn(`card:${c.id}`, 'missing rules text');
    if (c.focusCost < 0) err(`card:${c.id}`, 'negative focusCost');
    if (c.character !== 'neutral' && !characterIds.has(c.character)) {
      err(`card:${c.id}`, `unknown character ${c.character}`);
    }
    for (const kw of c.keywords) {
      if (!keywordIds.has(kw)) err(`card:${c.id}`, `unknown keyword ${kw}`);
    }
    const refs = new Set<string>();
    keywordRefsInEffects(c.onPlay, refs);
    keywordRefsInEffects(c.onScore, refs);
    keywordRefsInEffects(c.upgrade?.onPlay, refs);
    keywordRefsInEffects(c.upgrade?.onScore, refs);
    for (const kw of refs) {
      if (!keywordIds.has(kw)) err(`card:${c.id}`, `effect references unknown keyword ${kw}`);
    }
    if (c.kind === 'action' && (c.base !== 0 || c.mult !== 0)) {
      warn(`card:${c.id}`, 'action card has base/mult but is never scored');
    }
  }

  // Precedents.
  const seenPrec = new Set<string>();
  for (const p of bundle.precedents) {
    if (seenPrec.has(p.id)) err(`precedent:${p.id}`, 'duplicate precedent id');
    seenPrec.add(p.id);
    if (!p.text) warn(`precedent:${p.id}`, 'missing rules text');
    if (Object.keys(p.hooks).length === 0) err(`precedent:${p.id}`, 'has no hooks (no effect)');
    const refs = new Set<string>();
    for (const hook of Object.values(p.hooks)) {
      if (hook) {
        keywordRefsInEffects(hook.effects, refs);
        if (hook.condition) keywordRefsInCondition(hook.condition, refs);
        if (hook.effects.length === 0) err(`precedent:${p.id}`, 'hook has no effects');
      }
    }
    for (const kw of refs) {
      if (!keywordIds.has(kw)) err(`precedent:${p.id}`, `references unknown keyword ${kw}`);
    }
  }

  // Enemies.
  const seenEnemy = new Set<string>();
  for (const e of bundle.enemies) {
    if (seenEnemy.has(e.id)) err(`enemy:${e.id}`, 'duplicate enemy id');
    seenEnemy.add(e.id);
    if (e.baseDoubtTarget <= 0) err(`enemy:${e.id}`, 'non-positive doubt target');
    if (e.maxRounds <= 0) err(`enemy:${e.id}`, 'non-positive maxRounds');
    if (e.intents.length === 0) err(`enemy:${e.id}`, 'no intents');
    for (const intent of e.intents) {
      if (intent.status && !keywordIds.has(intent.status)) {
        err(`enemy:${e.id}`, `intent references unknown status ${intent.status}`);
      }
      if (intent.kind === 'status' && !intent.status) {
        err(`enemy:${e.id}`, 'status intent missing status');
      }
      if (intent.kind === 'witness' && !intent.witness) {
        err(`enemy:${e.id}`, 'witness intent missing witness data');
      }
      const refs = new Set<string>();
      keywordRefsInEffects(intent.effects, refs);
      for (const kw of refs) {
        if (!keywordIds.has(kw)) err(`enemy:${e.id}`, `intent effect references unknown keyword ${kw}`);
      }
    }
  }

  // Characters.
  const seenChar = new Set<string>();
  for (const c of bundle.characters) {
    if (seenChar.has(c.id)) err(`character:${c.id}`, 'duplicate character id');
    seenChar.add(c.id);
    let deckCount = 0;
    for (const sc of c.startingDeck) {
      if (!cardIds.has(sc.cardId)) err(`character:${c.id}`, `unknown starting card ${sc.cardId}`);
      if (sc.count <= 0) err(`character:${c.id}`, `non-positive count for ${sc.cardId}`);
      deckCount += sc.count;
    }
    if (deckCount < 5) warn(`character:${c.id}`, `small starting deck (${deckCount})`);
    for (const pid of c.startingPrecedents) {
      if (!precedentIds.has(pid)) err(`character:${c.id}`, `unknown starting precedent ${pid}`);
    }
    if (c.startingComposure <= 0) err(`character:${c.id}`, 'non-positive starting composure');
  }

  // Every engine keyword must have display data.
  for (const id of Object.values(KW)) {
    if (!keywordIds.has(id)) err('keywords', `engine keyword "${id}" has no KeywordDef`);
  }

  return issues;
}

export function assertValidContent(bundle: ContentBundle): void {
  const issues = validateContent(bundle).filter((i) => i.kind === 'error');
  if (issues.length > 0) {
    const msg = issues.map((i) => `  [${i.where}] ${i.message}`).join('\n');
    throw new Error(`Invalid content:\n${msg}`);
  }
}
