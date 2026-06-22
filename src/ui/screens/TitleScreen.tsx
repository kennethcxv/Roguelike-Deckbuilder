import { STRINGS } from '../../content';
import { hasSavedRun } from '../../save';
import { useGame } from '../store/gameStore';

export function TitleScreen() {
  const setAppScreen = useGame((s) => s.setAppScreen);
  const setPendingMode = useGame((s) => s.setPendingMode);
  const resumeRun = useGame((s) => s.resumeRun);
  const meta = useGame((s) => s.meta);
  const saved = hasSavedRun();

  const go = (mode: 'standard' | 'daily' | 'custom') => {
    setPendingMode(mode);
    setAppScreen('characterSelect');
  };

  return (
    <div className="screen center-col fade-in">
      <h1 className="game-title">{STRINGS.title}</h1>
      <p className="game-subtitle">{STRINGS.tagline}</p>
      <div className="col" style={{ width: 300 }}>
        {saved && (
          <button className="btn btn-primary" onClick={resumeRun}>
            Resume Trial
          </button>
        )}
        <button className="btn" onClick={() => go('standard')}>
          New Case
        </button>
        <button className="btn" onClick={() => go('daily')}>
          Daily Docket
        </button>
        <button className="btn" onClick={() => go('custom')}>
          Custom Seed
        </button>
        <button className="btn btn-ghost" onClick={() => setAppScreen('codex')}>
          Codex
        </button>
        <button className="btn btn-ghost" onClick={() => setAppScreen('settings')}>
          Settings
        </button>
      </div>
      <p className="small muted">
        Acquittals: {meta.stats.runsWon} · Best argument: {meta.stats.bestArgument} Doubt ·
        Highest Appeal won: {meta.stats.highestAppealWon < 0 ? '—' : meta.stats.highestAppealWon}
      </p>
    </div>
  );
}
