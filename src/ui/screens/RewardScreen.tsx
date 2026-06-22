import { DB, STRINGS } from '../../content';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';

export function RewardScreen() {
  const run = useGame((s) => s.run)!;
  const rewards = run.rewards!;
  const takeCard = useGame((s) => s.takeCard);
  const skipCard = useGame((s) => s.skipCard);
  const takePrecedent = useGame((s) => s.takePrecedent);
  const takeMotion = useGame((s) => s.takeMotion);
  const finishRewards = useGame((s) => s.finishRewards);

  return (
    <div className="body-pad">
      <h2 className="section-title">Case Won — Spoils</h2>
      <p className="retainer">
        +{rewards.retainer} {STRINGS.currency} (total {run.retainer})
      </p>

      {!rewards.cardTaken && rewards.cardChoices.length > 0 && (
        <>
          <h3>Add a card to your deck</h3>
          <div className="reward-row">
            {rewards.cardChoices.map((choice, i) => (
              <CardView
                key={`${choice.cardId}-${i}`}
                def={DB.getCard(choice.cardId)}
                upgraded={choice.upgraded ? 1 : 0}
                onClick={() => takeCard(i)}
              />
            ))}
          </div>
          <button className="btn btn-ghost" onClick={skipCard}>
            Skip card
          </button>
        </>
      )}
      {rewards.cardTaken && <p className="muted">Card reward resolved.</p>}

      {rewards.precedentId && !rewards.precedentTaken && (
        <div className="panel" style={{ maxWidth: 460 }}>
          <h3 style={{ marginTop: 0 }}>Precedent: {DB.getPrecedent(rewards.precedentId).name}</h3>
          <p className="small">{DB.getPrecedent(rewards.precedentId).text}</p>
          <button className="btn btn-primary" onClick={takePrecedent}>
            Take Precedent
          </button>
        </div>
      )}

      {rewards.motionId && !rewards.motionTaken && (
        <div className="panel" style={{ maxWidth: 460 }}>
          <h3 style={{ marginTop: 0 }}>Motion: {DB.getMotion(rewards.motionId).name}</h3>
          <p className="small">{DB.getMotion(rewards.motionId).text}</p>
          <button className="btn btn-primary" onClick={takeMotion}>
            Take Motion
          </button>
        </div>
      )}

      <button className="btn btn-primary" onClick={finishRewards} style={{ marginTop: 12 }}>
        Continue
      </button>
    </div>
  );
}
