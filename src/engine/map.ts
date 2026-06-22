/**
 * Seeded act-map generation: a Slay-the-Spire-style branching DAG. Each of three acts
 * is a grid of rows; several random bottom-to-top paths are carved and merged, then node
 * types and enemies are assigned. Fully deterministic from the run seed.
 */

import { Rng } from './rng';
import { clamp } from './state';
import type { ActMap, ContentLookup, EnemyDef, GameMap, MapNode, NodeType } from './types';

interface GenConfig {
  rows: number;
  paths: number;
  width: number;
}

const ACT_CONFIG: GenConfig = { rows: 11, paths: 6, width: 5 };

export function generateMap(seed: number, content: ContentLookup): GameMap {
  const acts: ActMap[] = [];
  for (let act = 1; act <= 3; act++) {
    acts.push(generateAct(act, Rng.stream(seed, `map:act${act}`), content));
  }
  return { acts };
}

function generateAct(act: number, rng: Rng, content: ContentLookup): ActMap {
  const { rows, paths, width } = ACT_CONFIG;
  const nodeAt = new Map<string, MapNode>();
  const order: MapNode[] = [];

  const ensure = (row: number, col: number): MapNode => {
    const key = `${row}:${col}`;
    let n = nodeAt.get(key);
    if (!n) {
      n = { id: `a${act}-r${row}-c${col}`, act, row, col, type: 'trial', next: [] };
      nodeAt.set(key, n);
      order.push(n);
    }
    return n;
  };
  const link = (a: MapNode, b: MapNode) => {
    if (!a.next.includes(b.id)) a.next.push(b.id);
  };

  for (let p = 0; p < paths; p++) {
    let col = rng.int(width);
    let prev = ensure(0, col);
    for (let row = 1; row < rows; row++) {
      col = clamp(col + (rng.int(3) - 1), 0, width - 1);
      const node = ensure(row, col);
      link(prev, node);
      prev = node;
    }
  }

  const bossDef = content.allEnemies().find((e) => e.act === act && e.kind === 'boss');
  const boss: MapNode = {
    id: `a${act}-boss`,
    act,
    row: rows,
    col: Math.floor(width / 2),
    type: 'boss',
    next: [],
  };
  if (bossDef) boss.enemyId = bossDef.id;
  for (const n of order) if (n.row === rows - 1) link(n, boss);
  order.push(boss);

  assignTypes(order, rng, rows);
  assignEnemies(order, rng, content, act);

  return {
    act,
    rows: rows + 1,
    nodes: order,
    startNodeIds: order.filter((n) => n.row === 0).map((n) => n.id),
    bossNodeId: boss.id,
  };
}

function assignTypes(order: MapNode[], rng: Rng, rows: number): void {
  for (const n of order) {
    if (n.type === 'boss') continue;
    if (n.row === 0) {
      n.type = 'trial';
      continue;
    }
    if (n.row === rows - 1) {
      n.type = 'rest';
      continue;
    }
    n.type = rng.weighted<NodeType>([
      { value: 'trial', weight: 48 },
      { value: 'event', weight: 22 },
      { value: 'shop', weight: n.row >= 2 ? 11 : 0 },
      { value: 'elite', weight: n.row >= 3 ? 13 : 0 },
      { value: 'rest', weight: n.row >= 4 ? 8 : 0 },
    ]);
  }
}

function assignEnemies(order: MapNode[], rng: Rng, content: ContentLookup, act: number): void {
  const trials = content.allEnemies().filter((e) => e.act === act && e.kind === 'trial');
  const elites = content.allEnemies().filter((e) => e.act === act && e.kind === 'elite');
  const pick = (pool: EnemyDef[], fallback: EnemyDef[]): EnemyDef | undefined =>
    pool.length > 0 ? rng.pick(pool) : fallback.length > 0 ? rng.pick(fallback) : undefined;

  for (const n of order) {
    if (n.type === 'trial') {
      const e = pick(trials, elites);
      if (e) n.enemyId = e.id;
    } else if (n.type === 'elite') {
      const e = pick(elites, trials);
      if (e) n.enemyId = e.id;
    }
  }
}

export function getNode(map: GameMap, nodeId: string): MapNode | undefined {
  for (const act of map.acts) {
    const n = act.nodes.find((x) => x.id === nodeId);
    if (n) return n;
  }
  return undefined;
}

export function actMap(map: GameMap, act: number): ActMap | undefined {
  return map.acts.find((a) => a.act === act);
}
