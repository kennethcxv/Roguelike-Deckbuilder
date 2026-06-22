import { DB, STRINGS } from '../../content';
import type { MapNode } from '../../engine';
import { useGame } from '../store/gameStore';
import { nodeGlyph } from '../components/widgets';

const COL_W = 96;
const ROW_H = 92;
const PAD = 60;
const WIDTH_COLS = 5;

export function MapScreen() {
  const run = useGame((s) => s.run)!;
  const enterNode = useGame((s) => s.enterNode);
  const act = run.map.acts[run.act - 1]!;
  const reachable = new Set(run.reachableNodeIds);

  const maxRow = Math.max(...act.nodes.map((n) => n.row));
  const width = (WIDTH_COLS - 1) * COL_W + PAD * 2;
  const height = maxRow * ROW_H + PAD * 2;

  // Node centre coordinates (row 0 at the bottom).
  const pos = (n: MapNode) => ({
    x: PAD + n.col * COL_W,
    y: PAD + (maxRow - n.row) * ROW_H,
  });
  const byId = new Map(act.nodes.map((n) => [n.id, n]));

  return (
    <div className="body-pad" style={{ height: '100%' }}>
      <h2 className="section-title">{STRINGS.acts[run.act - 1]}</h2>
      <p className="muted small">Choose your path — glowing nodes are reachable.</p>
      <div className="map-scroll">
        <div className="map-canvas" style={{ width, height }}>
          <svg className="map-edges" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {act.nodes.flatMap((n) => {
              const a = pos(n);
              return n.next.map((nid) => {
                const t = byId.get(nid);
                if (!t) return null;
                const b = pos(t);
                const open = run.currentNodeId === n.id && reachable.has(nid);
                return (
                  <line
                    key={`${n.id}-${nid}`}
                    className={`map-edge ${open ? 'edge-open' : ''}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                  />
                );
              });
            })}
          </svg>
          {act.nodes.map((n) => {
            const p = pos(n);
            const enemy = n.enemyId ? DB.getEnemyOrNull(n.enemyId) : null;
            const label = `${STRINGS.nodeTypes[n.type]}${enemy ? `: ${enemy.name}` : ''}`;
            const isReachable = reachable.has(n.id);
            const cls = [
              'map-node',
              'abs',
              `node-${n.type}`,
              isReachable ? 'reachable' : '',
              n.visited ? 'visited' : '',
              run.currentNodeId === n.id ? 'current' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <div
                key={n.id}
                className={cls}
                style={{ left: p.x, top: p.y }}
                title={label}
                onClick={isReachable ? () => enterNode(n.id) : undefined}
                role={isReachable ? 'button' : undefined}
                tabIndex={isReachable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (isReachable && e.key === 'Enter') enterNode(n.id);
                }}
              >
                {nodeGlyph(n.type)}
              </div>
            );
          })}
        </div>
      </div>
      <div className="row small muted wrap" style={{ justifyContent: 'center' }}>
        <span>§ Trial</span>
        <span>★ Elite</span>
        <span>? Recess</span>
        <span>₪ Library</span>
        <span>✦ Chambers</span>
        <span>⚖ Boss</span>
      </div>
    </div>
  );
}
