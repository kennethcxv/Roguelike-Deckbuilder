import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useGame } from '../store/gameStore';
import { scoreTick, countTick, scorePayoff } from '../../audio';
import type { ScoreStep } from '../../engine';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

function Burst({ power }: { power: number }) {
  const count = Math.min(60, 14 + Math.floor(power / 6));
  const pieces = Array.from({ length: count }, (_, i) => {
    const ang = (Math.PI * 2 * i) / count + Math.random();
    const dist = 120 + Math.random() * (180 + power);
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist;
    const colors = ['#f0c869', '#d8a84b', '#e06a5a', '#4aa8a0', '#ece1c6'];
    return (
      <span
        key={i}
        className="burst-piece"
        style={
          {
            background: colors[i % colors.length],
            ['--dx' as string]: `${dx}px`,
            ['--dy' as string]: `${dy}px`,
            animationDelay: `${Math.random() * 0.08}s`,
          } as CSSProperties
        }
      />
    );
  });
  return <div className="burst">{pieces}</div>;
}

type Phase = 'reveal' | 'count' | 'done';

export function CascadeOverlay() {
  const cascade = useGame((s) => s.cascade);
  const clearCascade = useGame((s) => s.clearCascade);
  const settings = useGame((s) => s.meta.settings);

  const [shown, setShown] = useState(0);
  const [base, setBase] = useState(0);
  const [mult, setMult] = useState(1);
  const [doubt, setDoubt] = useState(0);
  const [phase, setPhase] = useState<Phase>('reveal');
  const [boom, setBoom] = useState(false);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!cascade) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const result = cascade.result;
    const steps = result.steps.filter((s) => s.kind !== 'start' && s.kind !== 'final');
    const reduce = settings.reduceMotion;
    const fast = settings.fastMode;
    const STEP = fast ? 55 : 110;
    const HOLD = reduce ? 500 : fast ? 450 : 850;

    setShown(0);
    setBase(0);
    setMult(1);
    setDoubt(0);
    setPhase('reveal');
    setBoom(false);

    const finish = () => {
      if (cancelled) return;
      setPhase('done');
      setBoom(true);
      scorePayoff(result.doubt);
      timers.push(setTimeout(() => !cancelled && clearCascade(), HOLD));
    };

    const jumpToEnd = () => {
      setShown(steps.length);
      setBase(result.base);
      setMult(result.mult);
      setDoubt(result.doubt);
    };

    skipRef.current = () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      jumpToEnd();
      setPhase('done');
      setBoom(true);
      scorePayoff(result.doubt);
      setTimeout(() => clearCascade(), 220);
    };

    if (reduce) {
      jumpToEnd();
      finish();
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    const startCount = () => {
      if (cancelled) return;
      setPhase('count');
      const total = result.doubt;
      const COUNT = fast ? 240 : 560;
      const start = performance.now();
      const tick = () => {
        if (cancelled) return;
        const p = Math.min(1, (performance.now() - start) / COUNT);
        setDoubt(Math.round(total * easeOutCubic(p)));
        if (p < 1) {
          if (Math.random() < 0.6) countTick(p);
          timers.push(setTimeout(tick, 30));
        } else {
          setDoubt(total);
          finish();
        }
      };
      tick();
    };

    let i = 0;
    const revealNext = () => {
      if (cancelled) return;
      if (i >= steps.length) {
        startCount();
        return;
      }
      const step = steps[i]!;
      setShown(i + 1);
      setBase(step.baseAfter);
      setMult(step.multAfter);
      const kind: 'base' | 'mult' | 'special' =
        step.kind === 'precedent' ? 'special' : step.multDelta !== 0 ? 'mult' : 'base';
      scoreTick(i, kind);
      i += 1;
      timers.push(setTimeout(revealNext, STEP));
    };
    timers.push(setTimeout(revealNext, STEP));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cascade]);

  if (!cascade) return null;
  const result = cascade.result;
  const chips = result.steps.filter((s) => s.kind !== 'start' && s.kind !== 'final');
  const reached = cascade.fromDoubt + result.doubt >= cascade.target;

  return (
    <div
      className={`cascade-overlay ${boom ? 'cascade-boom' : ''}`}
      onClick={() => skipRef.current()}
      role="presentation"
    >
      <div className={`cascade-panel ${phase}`}>
        <div className="cascade-eq">
          <span className="cascade-num base">{fmt(base)}</span>
          <span className="cascade-op">×</span>
          <span className="cascade-num mult">{round1(mult)}</span>
        </div>
        <div className={`cascade-big ${phase !== 'reveal' ? 'live' : ''}`}>
          +{fmt(doubt)}
          <span className="cascade-big-label">Doubt</span>
        </div>
        <div className="cascade-chips">
          {chips.slice(0, shown).map((s: ScoreStep, idx) => (
            <span key={idx} className={`cascade-chip kind-${s.kind} chip-pop`}>
              <span className="chip-label">{s.label}</span>
              {s.baseDelta !== 0 && <span className="chip-base">+{Math.round(s.baseDelta)}</span>}
              {s.multDelta !== 0 && (
                <span className="chip-mult">
                  {s.multFactor ? `×${s.multFactor}` : `+${round1(s.multDelta)}`}
                </span>
              )}
            </span>
          ))}
        </div>
        {phase === 'done' && (
          <div className={`cascade-verdict ${reached ? 'good' : ''}`}>
            {reached ? 'Reasonable Doubt!' : 'Argument presented'}
          </div>
        )}
        <div className="cascade-hint">click to skip</div>
      </div>
      {boom && !settings.reduceMotion && <Burst power={result.doubt} />}
    </div>
  );
}
