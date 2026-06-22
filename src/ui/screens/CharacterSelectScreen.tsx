import { useState } from 'react';
import { DB } from '../../content';
import { maxSelectableAppeal } from '../../save';
import type { CharacterDef, UnlockCondition } from '../../engine';
import { useGame } from '../store/gameStore';

function unlockText(u: UnlockCondition): string {
  switch (u.kind) {
    case 'default':
      return '';
    case 'winAct':
      return `Unlock: defeat the Act ${u.act} boss.`;
    case 'winRun':
      return 'Unlock: win a run.';
    case 'singleArgument':
      return `Unlock: score a single argument of ${u.doubt}+ Doubt.`;
    case 'achievement':
      return `Unlock: earn an achievement.`;
  }
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function CharacterSelectScreen() {
  const meta = useGame((s) => s.meta);
  const pendingMode = useGame((s) => s.pendingMode);
  const startRun = useGame((s) => s.startRun);
  const setAppScreen = useGame((s) => s.setAppScreen);

  const characters = DB.allCharacters();
  const firstUnlocked = characters.find((c) => meta.unlockedCharacters.includes(c.id));
  const [charId, setCharId] = useState(firstUnlocked?.id ?? 'litigator');
  const [appeal, setAppeal] = useState(0);
  const [seed, setSeed] = useState('');

  const character = DB.getCharacter(charId);
  const maxAppeal = maxSelectableAppeal(meta, charId);
  const dateSeed = new Date().toISOString().slice(0, 10);

  const begin = () => {
    const label =
      pendingMode === 'daily'
        ? `daily-${dateSeed}`
        : pendingMode === 'custom'
          ? seed.trim() || randomSeed()
          : randomSeed();
    startRun(charId, pendingMode, label, Math.min(appeal, maxAppeal));
  };

  const select = (c: CharacterDef) => {
    if (!meta.unlockedCharacters.includes(c.id)) return;
    setCharId(c.id);
    setAppeal((a) => Math.min(a, maxSelectableAppeal(meta, c.id)));
  };

  return (
    <div className="screen center-col fade-in">
      <h2 className="section-title">Choose Your Counsel</h2>
      <p className="muted small">
        Mode: {pendingMode === 'daily' ? `Daily Docket (${dateSeed})` : pendingMode}
      </p>
      <div className="row wrap" style={{ justifyContent: 'center' }}>
        {characters.map((c) => {
          const unlocked = meta.unlockedCharacters.includes(c.id);
          return (
            <div
              key={c.id}
              className={`panel char-card ${charId === c.id ? 'selected' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => select(c)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') select(c);
              }}
            >
              <h3 style={{ margin: '0 0 4px' }}>{c.title}</h3>
              <div className="small" style={{ fontStyle: 'italic' }}>
                {c.name}
              </div>
              <p className="small">{c.description}</p>
              <p className="small">
                <strong>Signature:</strong> {c.signature}
              </p>
              <p className="small">Composure {c.startingComposure}</p>
              {!unlocked && <p className="small">🔒 {unlockText(c.unlock)}</p>}
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ minWidth: 360 }}>
        <div className="slider-row">
          <span>Appeal (difficulty): {appeal}</span>
          <input
            type="range"
            min={0}
            max={maxAppeal}
            value={appeal}
            onChange={(e) => setAppeal(parseInt(e.target.value, 10))}
            disabled={maxAppeal === 0}
          />
        </div>
        <p className="small muted">
          {maxAppeal === 0
            ? 'Win at Appeal 0 to unlock higher Appeals for this attorney.'
            : `Higher Appeals raise the Doubt you must reach. Max selectable: ${maxAppeal}.`}
        </p>
        {pendingMode === 'custom' && (
          <div className="slider-row">
            <span>Seed</span>
            <input
              type="text"
              value={seed}
              placeholder="enter any text"
              onChange={(e) => setSeed(e.target.value)}
              style={{ padding: 6 }}
            />
          </div>
        )}
      </div>

      <div className="row">
        <button className="btn btn-ghost" onClick={() => setAppScreen('title')}>
          Back
        </button>
        <button className="btn btn-primary" onClick={begin}>
          Begin Trial — {character.title}
        </button>
      </div>
    </div>
  );
}
