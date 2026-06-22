import { useState } from 'react';
import { DB, STRINGS } from '../../content';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';

export function ShopScreen() {
  const run = useGame((s) => s.run)!;
  const shop = run.shop!;
  const buyCard = useGame((s) => s.buyCard);
  const buyPrecedent = useGame((s) => s.buyPrecedent);
  const buyMotion = useGame((s) => s.buyMotion);
  const sellCard = useGame((s) => s.sellCard);
  const removeCard = useGame((s) => s.removeCard);
  const leaveShop = useGame((s) => s.leaveShop);
  const [manage, setManage] = useState(false);

  const c = STRINGS.currencyShort;

  return (
    <div className="body-pad">
      <h2 className="section-title">The Law Library</h2>
      <p className="retainer">
        {STRINGS.currency}: {run.retainer}
      </p>

      <h3>Cards</h3>
      <div className="reward-row">
        {shop.cards.map((entry, i) => (
          <div key={`${entry.cardId}-${i}`} className="col" style={{ alignItems: 'center' }}>
            <CardView
              def={DB.getCard(entry.cardId)}
              disabled={entry.sold || run.retainer < entry.cost}
              onClick={() => buyCard(i)}
            />
            <span className={entry.sold ? 'muted' : 'retainer'}>
              {entry.sold ? 'Sold' : `${c} ${entry.cost}`}
            </span>
          </div>
        ))}
      </div>

      <h3>Precedents</h3>
      <div className="row wrap">
        {shop.precedents.map((entry, i) => {
          const p = DB.getPrecedent(entry.precedentId);
          const owned = run.precedents.includes(entry.precedentId);
          return (
            <div key={`${entry.precedentId}-${i}`} className="panel" style={{ width: 280 }}>
              <strong>{p.name}</strong> <span className="small muted">({p.rarity})</span>
              <p className="small">{p.text}</p>
              <button
                className="btn btn-sm"
                disabled={entry.sold || owned || run.retainer < entry.cost}
                onClick={() => buyPrecedent(i)}
              >
                {entry.sold ? 'Sold' : owned ? 'Owned' : `Buy ${c} ${entry.cost}`}
              </button>
            </div>
          );
        })}
      </div>

      <h3>Motions</h3>
      <div className="row wrap">
        {shop.motions.map((entry, i) => {
          const m = DB.getMotion(entry.motionId);
          return (
            <div key={`${entry.motionId}-${i}`} className="panel" style={{ width: 260 }}>
              <strong>{m.name}</strong> <span className="small muted">({m.usage})</span>
              <p className="small">{m.text}</p>
              <button
                className="btn btn-sm"
                disabled={entry.sold || run.retainer < entry.cost}
                onClick={() => buyMotion(i)}
              >
                {entry.sold ? 'Sold' : `Buy ${c} ${entry.cost}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="row">
        <button className="btn" onClick={() => setManage((m) => !m)}>
          {manage ? 'Hide deck' : `Sell / Remove cards (remove: ${c} ${shop.removeCost})`}
        </button>
        <button className="btn btn-primary" onClick={leaveShop}>
          Leave
        </button>
      </div>

      {manage && (
        <div className="card-grid">
          {run.deck.map((card) => (
            <div key={card.uid} className="col" style={{ alignItems: 'center' }}>
              <CardView def={DB.getCard(card.defId)} upgraded={card.upgraded} compact />
              <div className="row">
                <button className="btn btn-sm" onClick={() => sellCard(card.uid)}>
                  Sell {c} {DB.tuning.sellbackRetainer}
                </button>
                <button
                  className="btn btn-sm"
                  disabled={shop.removeUsed || run.retainer < shop.removeCost}
                  onClick={() => removeCard(card.uid)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
