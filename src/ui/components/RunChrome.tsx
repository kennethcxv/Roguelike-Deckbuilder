import { DB, STRINGS } from '../../content';
import { useGame } from '../store/gameStore';
import { Meter } from './widgets';
import { CardView } from './CardView';

export function RunHud() {
  const run = useGame((s) => s.run)!;
  const setOverlay = useGame((s) => s.setOverlay);
  return (
    <div className="hud">
      <span className="pill">
        {STRINGS.acts[run.act - 1] ?? `Act ${run.act}`} · Appeal {run.appeal}
      </span>
      <div style={{ width: 180 }}>
        <Meter label="Composure" value={run.composure} max={run.maxComposure} tone="composure" />
      </div>
      <span className="pill retainer">{STRINGS.currencyShort} {run.retainer}</span>
      <div className="spacer" />
      <button className="btn btn-sm" onClick={() => setOverlay('deck')}>
        Deck ({run.deck.length})
      </button>
      <button className="btn btn-sm" onClick={() => setOverlay('precedents')}>
        Precedents ({run.precedents.length})
      </button>
      <button className="btn btn-sm" onClick={() => setOverlay('help')}>
        Help
      </button>
      <button className="btn btn-sm" onClick={() => setOverlay('settings')}>
        Menu
      </button>
    </div>
  );
}

export function OverlayHost() {
  const overlay = useGame((s) => s.overlay);
  const setOverlay = useGame((s) => s.setOverlay);
  const run = useGame((s) => s.run);
  const abandonRun = useGame((s) => s.abandonRun);
  if (!overlay || !run) return null;

  const close = () => setOverlay(null);

  return (
    <div className="overlay-backdrop" onClick={close}>
      <div className="panel overlay-panel" onClick={(e) => e.stopPropagation()}>
        {overlay === 'deck' && (
          <>
            <h2 className="section-title">Your Deck ({run.deck.length})</h2>
            <div className="card-grid">
              {run.deck.map((c) => (
                <CardView key={c.uid} def={DB.getCard(c.defId)} upgraded={c.upgraded} compact />
              ))}
            </div>
          </>
        )}
        {overlay === 'precedents' && (
          <>
            <h2 className="section-title">Precedents ({run.precedents.length})</h2>
            {run.precedents.length === 0 && <p className="muted">No precedents yet.</p>}
            <div className="col">
              {run.precedents.map((pid) => {
                const p = DB.getPrecedent(pid);
                return (
                  <div key={pid} className="panel" style={{ background: 'rgba(0,0,0,0.05)' }}>
                    <strong>{p.name}</strong> <span className="small muted">({p.rarity})</span>
                    <div className="small">{p.text}</div>
                  </div>
                );
              })}
            </div>
            {run.motions.length > 0 && (
              <>
                <h3 className="section-title" style={{ marginTop: 12 }}>
                  Motions ({run.motions.length})
                </h3>
                <MotionsTray />
              </>
            )}
          </>
        )}
        {overlay === 'help' && <HelpGlossary />}
        {overlay === 'settings' && (
          <>
            <h2 className="section-title">Menu</h2>
            <div className="col">
              <p className="small muted">Seed: {run.seedLabel} · Mode: {run.mode}</p>
              <button className="btn" onClick={close}>
                Resume
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (confirm('Abandon this run? Progress will be lost.')) abandonRun();
                }}
              >
                Abandon Run
              </button>
            </div>
          </>
        )}
        <div className="row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
          <button className="btn btn-sm" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function MotionsTray() {
  const run = useGame((s) => s.run)!;
  const playMapMotion = useGame((s) => s.playMapMotion);
  const inTrial = run.screen === 'trial';
  return (
    <div className="col">
      {run.motions.map((id, i) => {
        const m = DB.getMotion(id);
        const usableHere = m.usage === 'map' && !inTrial;
        return (
          <div key={`${id}-${i}`} className="panel" style={{ background: 'rgba(0,0,0,0.05)' }}>
            <strong>{m.name}</strong> <span className="small muted">({m.usage})</span>
            <div className="small">{m.text}</div>
            {m.usage === 'map' && (
              <button
                className="btn btn-sm"
                disabled={!usableHere}
                onClick={() => playMapMotion(id)}
              >
                Use
              </button>
            )}
            {m.usage === 'combat' && <span className="small muted">Use during a trial.</span>}
          </div>
        );
      })}
    </div>
  );
}

function HelpGlossary() {
  return (
    <>
      <h2 className="section-title">How to Win</h2>
      <p className="small">
        Each trial, build <strong>Doubt</strong> to the Acquittal target before the prosecution&apos;s{' '}
        <strong>Conviction</strong> reaches your <strong>Composure</strong>. Play argument cards
        into your argument, then <em>Rest Your Case</em> to score{' '}
        <span className="cascade-base">base</span> × <span className="cascade-mult">mult</span>.
        Action cards resolve immediately. <em>Object</em> to discard and redraw.
      </p>
      <h3 className="section-title">Keywords</h3>
      <div className="col">
        {KEYWORD_ORDER.map((id) => {
          const k = DB.getKeywordOrNull(id);
          if (!k) return null;
          return (
            <div key={id}>
              <strong className={`status-${k.tone}`}>{k.name}</strong>:{' '}
              <span className="small">{k.description}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

const KEYWORD_ORDER = [
  'sustained',
  'overruled',
  'hearsay',
  'contempt',
  'rattled',
  'composure',
  'evidence',
  'leading',
  'witness',
  'stricken',
];
