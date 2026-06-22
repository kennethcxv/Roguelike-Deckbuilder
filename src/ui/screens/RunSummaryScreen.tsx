import { DB, STRINGS } from '../../content';
import { useGame } from '../store/gameStore';

const CONFETTI_COLORS = ['#d8a84b', '#f0c869', '#4aa8a0', '#9a7fc4', '#e06a5a', '#ece1c6'];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 1.5;
    const dur = 2.5 + Math.random() * 2;
    const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    return (
      <span
        key={i}
        className="confetti-piece"
        style={{
          left: `${left}%`,
          background: color,
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
        }}
      />
    );
  });
  return <div className="confetti">{pieces}</div>;
}

export function RunSummaryScreen() {
  const run = useGame((s) => s.run)!;
  const returnToTitle = useGame((s) => s.returnToTitle);
  const reduceMotion = useGame((s) => s.meta.settings.reduceMotion);
  const win = run.result === 'win';

  return (
    <div className="screen center-col fade-in">
      {win && !reduceMotion && <Confetti />}
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
