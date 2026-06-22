import { useState } from 'react';
import { DB } from '../../content';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';

type Tab = 'cards' | 'precedents' | 'enemies';

export function CodexScreen() {
  const meta = useGame((s) => s.meta);
  const setAppScreen = useGame((s) => s.setAppScreen);
  const [tab, setTab] = useState<Tab>('cards');

  const seenCards = new Set(meta.seenCards);
  const seenPrec = new Set(meta.seenPrecedents);
  const seenEnemies = new Set(meta.seenEnemies);

  return (
    <div className="screen center-col fade-in" style={{ justifyContent: 'flex-start' }}>
      <h2 className="section-title">Codex</h2>
      <div className="row">
        {(['cards', 'precedents', 'enemies'] as Tab[]).map((t) => (
          <button key={t} className={`btn btn-sm ${tab === t ? 'btn-primary' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
        <button className="btn btn-sm btn-ghost" onClick={() => setAppScreen('title')}>
          Back
        </button>
      </div>

      {tab === 'cards' && (
        <>
          <p className="small muted">
            Discovered {seenCards.size} / {DB.allCards().length} cards
          </p>
          <div className="card-grid">
            {DB.allCards().map((c) =>
              seenCards.has(c.id) ? (
                <CardView key={c.id} def={c} compact />
              ) : (
                <div key={c.id} className="card compact" style={{ display: 'grid', placeContent: 'center' }}>
                  <span className="muted">Undiscovered</span>
                </div>
              ),
            )}
          </div>
        </>
      )}

      {tab === 'precedents' && (
        <>
          <p className="small muted">
            Discovered {seenPrec.size} / {DB.allPrecedents().length} precedents
          </p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {DB.allPrecedents().map((p) => (
              <div key={p.id} className="panel" style={{ width: 280 }}>
                {seenPrec.has(p.id) ? (
                  <>
                    <strong>{p.name}</strong> <span className="small muted">({p.rarity})</span>
                    <p className="small">{p.text}</p>
                  </>
                ) : (
                  <span className="muted">Undiscovered Precedent</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'enemies' && (
        <>
          <p className="small muted">
            Faced {seenEnemies.size} / {DB.allEnemies().length} prosecutions
          </p>
          <div className="row wrap" style={{ justifyContent: 'center' }}>
            {DB.allEnemies().map((e) => (
              <div key={e.id} className="panel" style={{ width: 280 }}>
                {seenEnemies.has(e.id) ? (
                  <>
                    <strong>{e.name}</strong>{' '}
                    <span className="small muted">
                      (Act {e.act} {e.kind})
                    </span>
                    <p className="small">{e.flavor}</p>
                    <p className="small">
                      Target {e.baseDoubtTarget} · Conviction/round {e.baseConvictionPerRound}
                    </p>
                  </>
                ) : (
                  <span className="muted">Unknown Prosecution</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
