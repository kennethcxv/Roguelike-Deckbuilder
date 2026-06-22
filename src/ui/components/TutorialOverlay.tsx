import { useState } from 'react';
import { useGame } from '../store/gameStore';

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Welcome, Counselor',
    body: 'This is a trial. Win by building DOUBT up to the Acquittal target before the prosecution’s CONVICTION reaches your COMPOSURE.',
  },
  {
    title: 'Build an Argument',
    body: 'Click argument cards in your hand to stage them into your argument. Watch the live preview: base × mult = Doubt.',
  },
  {
    title: 'Rest Your Case',
    body: 'When ready, press “Rest Your Case” to score the argument and add Doubt. Each card costs Focus to include.',
  },
  {
    title: 'Action Cards & Objections',
    body: 'Action cards (like Research or Objection) resolve immediately when clicked. Use “Object” to discard cards and redraw.',
  },
  {
    title: 'The Prosecution',
    body: 'The badge shows the prosecution’s next move. After your turn, press “End Turn” — they will add Conviction and press their case. Good luck!',
  },
];

export function TutorialOverlay() {
  const tutorialDone = useGame((s) => s.meta.tutorialDone);
  const updateMeta = useGame((s) => s.updateMeta);
  const [i, setI] = useState(0);

  if (tutorialDone) return null;
  const step = STEPS[i]!;
  const finish = () =>
    updateMeta((m) => {
      m.tutorialDone = true;
    });

  return (
    <div className="overlay-backdrop" style={{ zIndex: 400 }}>
      <div className="panel" style={{ maxWidth: 520 }}>
        <h2 className="section-title">Tutorial — {step.title}</h2>
        <p>{step.body}</p>
        <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={finish}>
            Skip tutorial
          </button>
          <div className="row">
            {i > 0 && (
              <button className="btn btn-sm" onClick={() => setI(i - 1)}>
                Back
              </button>
            )}
            {i < STEPS.length - 1 ? (
              <button className="btn btn-primary btn-sm" onClick={() => setI(i + 1)}>
                Next
              </button>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={finish}>
                Got it!
              </button>
            )}
          </div>
        </div>
        <p className="small muted center">
          {i + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
