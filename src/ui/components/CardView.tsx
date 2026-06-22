import { effectiveCard } from '../../engine';
import type { CardDef } from '../../engine';
import { KeywordText } from './KeywordText';

export interface CardViewProps {
  def: CardDef;
  upgraded?: number;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  compact?: boolean;
  title?: string;
}

export function CardView({
  def,
  upgraded = 0,
  onClick,
  selected,
  disabled,
  compact,
  title,
}: CardViewProps) {
  const eff = effectiveCard(def, upgraded);
  const frame = def.kind === 'argument' ? 'card-frame-argument' : 'card-frame-action';
  const rar =
    def.rarity === 'rare'
      ? 'card-rarity-rare'
      : def.rarity === 'uncommon'
        ? 'card-rarity-uncommon'
        : '';
  const cls = [
    'card',
    frame,
    rar,
    onClick ? 'clickable' : '',
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
    compact ? 'compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={cls}
      onClick={disabled ? undefined : onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      title={title}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="card-cost" aria-label="Focus cost">
        {eff.focusCost}
      </div>
      <div className="card-name">
        {eff.name}
        {upgraded > 0 && <span className="upgraded-tag"> ＋</span>}
      </div>
      <div className="card-cat">{def.category}</div>
      {def.kind === 'argument' && (eff.base !== 0 || eff.mult !== 0) && (
        <div className="card-stats">
          {eff.base !== 0 && <span className="stat-base">{eff.base} base</span>}
          {eff.mult !== 0 && <span className="stat-mult">+{eff.mult} mult</span>}
        </div>
      )}
      <div className="card-text">
        <KeywordText text={eff.text} />
      </div>
      {def.flavor && <div className="card-flavor">{def.flavor}</div>}
    </div>
  );
}
