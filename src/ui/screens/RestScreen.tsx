import { useState } from 'react';
import { DB } from '../../content';
import { canUpgrade } from '../../engine';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';

export function RestScreen() {
  const run = useGame((s) => s.run)!;
  const restRecuperate = useGame((s) => s.restRecuperate);
  const restStudy = useGame((s) => s.restStudy);
  const [studying, setStudying] = useState(false);

  const healAmount = Math.ceil(run.maxComposure * 0.35);
  const upgradeable = run.deck.filter((c) => canUpgrade(run, DB, c.uid));

  return (
    <div className="body-pad">
      <h2 className="section-title">Chambers (Recess)</h2>
      <p className="muted">A quiet moment to recover or refine your case.</p>

      {!studying ? (
        <div className="row">
          <button className="btn btn-primary" onClick={restRecuperate}>
            Recuperate (+{healAmount} Composure)
          </button>
          <button
            className="btn"
            disabled={upgradeable.length === 0}
            onClick={() => setStudying(true)}
          >
            Study a Card (upgrade)
          </button>
        </div>
      ) : (
        <>
          <p>Select a card to upgrade:</p>
          <div className="card-grid">
            {upgradeable.map((c) => (
              <CardView
                key={c.uid}
                def={DB.getCard(c.defId)}
                upgraded={c.upgraded}
                compact
                onClick={() => restStudy(c.uid)}
              />
            ))}
          </div>
          <button className="btn btn-ghost" onClick={() => setStudying(false)}>
            Back
          </button>
        </>
      )}
    </div>
  );
}
