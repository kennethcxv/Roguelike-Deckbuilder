import { DB } from '../../content';
import { eventOptionAvailable } from '../../engine';
import { useGame } from '../store/gameStore';

export function EventScreen() {
  const run = useGame((s) => s.run)!;
  const chooseEvent = useGame((s) => s.chooseEvent);
  const finishEvent = useGame((s) => s.finishEvent);
  const ev = DB.getEvent(run.event!.eventId);
  const resolved = run.event!.resolvedOptionIndex !== null;

  return (
    <div className="body-pad">
      <div className="panel" style={{ maxWidth: 640 }}>
        <h2 className="section-title">{ev.name}</h2>
        <p>{ev.text}</p>
        {ev.flavor && <p className="small muted" style={{ fontStyle: 'italic' }}>{ev.flavor}</p>}

        {!resolved && (
          <div className="col">
            {ev.options.map((opt, i) => {
              const available = eventOptionAvailable(run, DB, i);
              return (
                <button
                  key={i}
                  className="btn"
                  disabled={!available}
                  onClick={() => chooseEvent(i)}
                  style={{ textAlign: 'left' }}
                >
                  <strong>{opt.label}</strong>
                  <div className="small muted">{opt.description}</div>
                  {!available && <div className="small">(requirements not met)</div>}
                </button>
              );
            })}
          </div>
        )}

        {resolved && (
          <div className="col">
            <p>{run.event!.resultText}</p>
            <button className="btn btn-primary" onClick={finishEvent}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
