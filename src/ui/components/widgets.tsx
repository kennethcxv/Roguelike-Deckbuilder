import { DB } from '../../content';
import type { Intent, NodeType, StatusBag } from '../../engine';

export function Meter({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: 'doubt' | 'conviction' | 'composure';
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`meter meter-${tone}`}>
      <div className="meter-label">
        <span>{label}</span>
        <span>
          {Math.round(value)} / {Math.round(max)}
        </span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function StatusList({ statuses }: { statuses: StatusBag }) {
  const ids = Object.keys(statuses).filter((id) => (statuses[id] ?? 0) > 0);
  if (ids.length === 0) return null;
  return (
    <div className="status-list">
      {ids.map((id) => {
        const k = DB.getKeywordOrNull(id);
        return (
          <span
            key={id}
            className={`status-pip status-${k?.tone ?? 'neutral'}`}
            title={k?.description}
          >
            {k?.name ?? id} {statuses[id]}
          </span>
        );
      })}
    </div>
  );
}

export function IntentBadge({ intent }: { intent: Intent | null }) {
  if (!intent) return null;
  const glyph =
    intent.kind === 'conviction'
      ? '⚔'
      : intent.kind === 'raiseTarget'
        ? '⬆'
        : intent.kind === 'overrule'
          ? '✋'
          : intent.kind === 'witness'
            ? '🧑‍⚖'
            : intent.kind === 'drain'
              ? '🌀'
              : '✦';
  return (
    <div className="intent-badge" title="The prosecution's next move">
      <span>{glyph}</span>
      <span>
        {intent.label}
        {intent.value > 0 ? ` (${intent.value})` : ''}
      </span>
    </div>
  );
}

const NODE_GLYPHS: Record<NodeType, string> = {
  trial: '§',
  elite: '★',
  boss: '⚖',
  shop: '₪',
  event: '?',
  rest: '✦',
};

export function nodeGlyph(type: NodeType): string {
  return NODE_GLYPHS[type];
}
