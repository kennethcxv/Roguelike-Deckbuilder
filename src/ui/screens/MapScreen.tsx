import { DB, STRINGS } from '../../content';
import type { MapNode } from '../../engine';
import { useGame } from '../store/gameStore';
import { nodeGlyph } from '../components/widgets';

function MapNodeView({
  node,
  reachable,
  current,
  onClick,
}: {
  node: MapNode;
  reachable: boolean;
  current: boolean;
  onClick: () => void;
}) {
  const enemy = node.enemyId ? DB.getEnemyOrNull(node.enemyId) : null;
  const label = `${STRINGS.nodeTypes[node.type]}${enemy ? `: ${enemy.name}` : ''}`;
  const cls = [
    'map-node',
    `node-${node.type}`,
    reachable ? 'reachable' : '',
    node.visited ? 'visited' : '',
    current ? 'current' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div
      className={cls}
      title={label}
      onClick={reachable ? onClick : undefined}
      role={reachable ? 'button' : undefined}
      tabIndex={reachable ? 0 : undefined}
      onKeyDown={(e) => {
        if (reachable && e.key === 'Enter') onClick();
      }}
    >
      {nodeGlyph(node.type)}
    </div>
  );
}

export function MapScreen() {
  const run = useGame((s) => s.run)!;
  const enterNode = useGame((s) => s.enterNode);
  const act = run.map.acts[run.act - 1]!;
  const reachable = new Set(run.reachableNodeIds);

  const maxRow = Math.max(...act.nodes.map((n) => n.row));
  const rows: MapNode[][] = Array.from({ length: maxRow + 1 }, () => []);
  for (const n of act.nodes) rows[n.row]!.push(n);
  rows.forEach((r) => r.sort((a, b) => a.col - b.col));

  return (
    <div className="body-pad" style={{ height: '100%' }}>
      <h2 className="section-title">{STRINGS.acts[run.act - 1]}</h2>
      <p className="muted small">Choose your path — highlighted nodes are reachable.</p>
      <div className="map-scroll">
        <div className="map-grid">
          {rows.map((r, i) => (
            <div className="map-row" key={i}>
              {r.map((n) => (
                <MapNodeView
                  key={n.id}
                  node={n}
                  reachable={reachable.has(n.id)}
                  current={run.currentNodeId === n.id}
                  onClick={() => enterNode(n.id)}
                />
              ))}
            </div>
          ))}
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
