import { DB, STRINGS } from '../../content';
import { useGame } from '../store/gameStore';

export function RunSummaryScreen() {
  const run = useGame((s) => s.run)!;
  const returnToTitle = useGame((s) => s.returnToTitle);
  const win = run.result === 'win';

  return (
    <div className="screen center-col fade-in">
      <h1 className="game-title" style={{ color: win ? 'var(--good)' : 'var(--crimson-bright)' }}>
        {win ? STRINGS.phases.won : STRINGS.phases.lost}
      </h1>
      <p className="game-subtitle">{win ? STRINGS.verdicts.win : STRINGS.verdicts.lose}</p>

      <div className="panel" style={{ minWidth: 360, color: 'var(--parchment-ink)' }}>
        <div className="slider-row">
          <span>Attorney</span>
          <strong>{DB.getCharacter(run.characterId).title}</strong>
        </div>
        <div className="slider-row">
          <span>Appeal</span>
          <strong>{run.appeal}</strong>
        </div>
        <div className="slider-row">
          <span>Reached</span>
          <strong>
            {STRINGS.acts[Math.min(run.act, 3) - 1] ?? `Act ${run.act}`}
          </strong>
        </div>
        <div className="slider-row">
          <span>Trials / Elites / Bosses</span>
          <strong>
            {run.stats.trialsWon} / {run.stats.elitesWon} / {run.stats.bossesWon}
          </strong>
        </div>
        <div className="slider-row">
          <span>Biggest argument</span>
          <strong>{run.stats.biggestArgument} Doubt</strong>
        </div>
        <div className="slider-row">
          <span>Precedents collected</span>
          <strong>{run.precedents.length}</strong>
        </div>
        <div className="slider-row">
          <span>Seed</span>
          <strong>{run.seedLabel}</strong>
        </div>
      </div>

      <button className="btn btn-primary" onClick={returnToTitle}>
        Return to Title
      </button>
    </div>
  );
}
