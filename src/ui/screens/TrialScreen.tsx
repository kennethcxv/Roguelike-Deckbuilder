import { useEffect, useRef, useState } from 'react';
import { DB, STRINGS } from '../../content';
import {
  Rng,
  canDiscard,
  canPresentArgument,
  effectiveCard,
  getArgumentFocusCost,
  scoreArgument,
} from '../../engine';
import type { EncounterState } from '../../engine';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';
import { Meter, StatusList, IntentBadge } from '../components/widgets';
import { TutorialOverlay } from '../components/TutorialOverlay';

function previewArgument(enc: EncounterState): { base: number; mult: number; doubt: number } {
  if (enc.player.argument.length === 0) return { base: 0, mult: 1, doubt: 0 };
  const clone: EncounterState = structuredClone(enc);
  const rng = new Rng((clone.rngState ^ 0x5bd1e995) >>> 0);
  const res = scoreArgument(clone, DB, rng);
  return { base: res.base, mult: res.mult, doubt: res.doubt };
}

function ScoreFlash({ enc, reduceMotion }: { enc: EncounterState; reduceMotion: boolean }) {
  const result = enc.lastScoring;
  const last = useRef<unknown>(null);
  const [active, setActive] = useState<typeof result>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (result && result !== last.current) {
      last.current = result;
      setActive(result);
      if (reduceMotion) {
        setIdx(result.steps.length);
        const t = setTimeout(() => setActive(null), 900);
        return () => clearTimeout(t);
      }
      setIdx(0);
      let i = 0;
      const step = setInterval(() => {
        i += 1;
        setIdx(i);
        if (i >= result.steps.length) clearInterval(step);
      }, 200);
      const done = setTimeout(() => setActive(null), 200 * result.steps.length + 1200);
      return () => {
        clearInterval(step);
        clearTimeout(done);
      };
    }
    return undefined;
  }, [result, reduceMotion]);

  if (!active) return null;
  const visible = active.steps.slice(0, Math.max(1, idx));
  const finished = idx >= active.steps.length;

  return (
    <div className="cascade">
      <div className="cascade-inner">
        {visible
          .filter((s) => s.kind !== 'final')
          .map((s, i) => (
            <div className="cascade-step pop" key={i}>
              <span className="muted">{s.label}</span>{' '}
              {s.baseDelta !== 0 && <span className="cascade-base">+{Math.round(s.baseDelta)} base</span>}{' '}
              {s.multDelta !== 0 && (
                <span className="cascade-mult">
                  {s.multFactor ? `×${s.multFactor}` : `+${s.multDelta.toFixed(1)}`} mult
                </span>
              )}
            </div>
          ))}
        <div className="cascade-step">
          <span className="cascade-base">{Math.round(active.base)} base</span> ×{' '}
          <span className="cascade-mult">{active.mult.toFixed(1)} mult</span>
        </div>
        {finished && <div className="cascade-total pop">+{active.doubt} Doubt</div>}
      </div>
    </div>
  );
}

export function TrialScreen() {
  const run = useGame((s) => s.run)!;
  const enc = run.encounter!;
  const toggleArgument = useGame((s) => s.toggleArgument);
  const playAction = useGame((s) => s.playAction);
  const present = useGame((s) => s.present);
  const discard = useGame((s) => s.discard);
  const endTurn = useGame((s) => s.endTurn);
  const playCombatMotion = useGame((s) => s.playCombatMotion);
  const settings = useGame((s) => s.meta.settings);

  const [discardMode, setDiscardMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const shakeRef = useRef<unknown>(null);

  useEffect(() => {
    setDiscardMode(false);
    setSelected([]);
  }, [enc.round]);

  useEffect(() => {
    if (enc.lastScoring && enc.lastScoring !== shakeRef.current) {
      shakeRef.current = enc.lastScoring;
      if (settings.screenShake && !settings.reduceMotion) {
        setShake(true);
        const t = setTimeout(() => setShake(false), 320);
        return () => clearTimeout(t);
      }
    }
    return undefined;
  }, [enc.lastScoring, settings.screenShake, settings.reduceMotion]);

  const enemy = DB.getEnemy(enc.enemyId);
  const preview = previewArgument(enc);
  const argCost = getArgumentFocusCost(enc, DB);
  const combatMotions = run.motions.filter((id) => DB.getMotion(id).usage === 'combat');

  const onHandClick = (uid: string) => {
    if (discardMode) {
      setSelected((sel) => (sel.includes(uid) ? sel.filter((x) => x !== uid) : [...sel, uid]));
      return;
    }
    const card = enc.player.hand.find((c) => c.uid === uid);
    if (!card) return;
    const def = DB.getCard(card.defId);
    if (def.kind === 'argument') toggleArgument(uid);
    else playAction(uid);
  };

  const confirmDiscard = () => {
    if (selected.length > 0) discard(selected);
    setSelected([]);
    setDiscardMode(false);
  };

  return (
    <div className={`trial ${shake ? 'shake' : ''}`} style={{ height: '100%' }}>
      <TutorialOverlay />
      <ScoreFlash enc={enc} reduceMotion={settings.reduceMotion} />

      {/* Prosecution */}
      <div className="bench">
        <div className="prosecution-box">
          <div className="row">
            <strong>{enemy.name}</strong>
            <span className="spacer" />
            <span className="small muted">
              Round {enc.round}/{enc.maxRounds}
            </span>
          </div>
          {enemy.flavor && <div className="small muted">{enemy.flavor}</div>}
          <IntentBadge intent={enc.prosecution.currentIntent} />
          <div style={{ marginTop: 8 }}>
            <Meter
              label={STRINGS.meters.conviction}
              value={enc.prosecution.conviction}
              max={enc.player.composure}
              tone="conviction"
            />
          </div>
          {enc.prosecution.witnesses.length > 0 && (
            <div className="small" style={{ marginTop: 6 }}>
              Witnesses:{' '}
              {enc.prosecution.witnesses.map((w) => `${w.name} (+${w.convictionPerRound}/rd)`).join(', ')}
            </div>
          )}
          <StatusList statuses={enc.prosecution.statuses} />
        </div>

        <div className="col" style={{ minWidth: 240 }}>
          <Meter label={`${STRINGS.meters.doubt} → Acquittal`} value={enc.doubt} max={enc.doubtTarget} tone="doubt" />
          <div className="row small wrap">
            <span className="pill">{STRINGS.meters.focus}: {enc.player.focus}/{enc.player.maxFocus}</span>
            <span className="pill">{STRINGS.meters.evidence}: {enc.player.evidence}</span>
            <span className="pill">Composure: {enc.player.composure}</span>
          </div>
          <StatusList statuses={enc.player.statuses} />
        </div>
      </div>

      {/* Argument zone */}
      <div className="col" style={{ overflow: 'auto' }}>
        <div className="center small muted">
          Your Argument —{' '}
          <span className="cascade-base">{preview.base} base</span> ×{' '}
          <span className="cascade-mult">{preview.mult.toFixed(1)} mult</span> ={' '}
          <strong>{preview.doubt} Doubt</strong> (costs {argCost} Focus)
        </div>
        <div className="argument-zone">
          {enc.player.argument.length === 0 && (
            <span className="muted">Click argument cards below to build your case.</span>
          )}
          {enc.player.argument.map((c) => (
            <CardView
              key={c.uid}
              def={DB.getCard(c.defId)}
              upgraded={c.upgraded}
              compact
              onClick={() => toggleArgument(c.uid)}
            />
          ))}
        </div>
      </div>

      {/* Hand + controls */}
      <div>
        <div className="controls">
          {!discardMode ? (
            <>
              <button
                className="btn btn-primary"
                disabled={!canPresentArgument(enc, DB)}
                onClick={present}
              >
                {STRINGS.buttons.present}
              </button>
              <button
                className="btn"
                disabled={!canDiscard(enc, DB)}
                onClick={() => setDiscardMode(true)}
              >
                {STRINGS.buttons.object}
              </button>
              {combatMotions.map((id, i) => (
                <button key={`${id}-${i}`} className="btn btn-sm" onClick={() => playCombatMotion(id)}>
                  Motion: {DB.getMotion(id).name}
                </button>
              ))}
              <button className="btn btn-danger" onClick={endTurn}>
                {STRINGS.buttons.endTurn}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" disabled={selected.length === 0} onClick={confirmDiscard}>
                Discard {selected.length} & Redraw
              </button>
              <button
                className="btn"
                onClick={() => {
                  setDiscardMode(false);
                  setSelected([]);
                }}
              >
                {STRINGS.buttons.cancel}
              </button>
            </>
          )}
        </div>
        <div className="hand-zone">
          {enc.player.hand.map((c) => {
            const def = DB.getCard(c.defId);
            const eff = effectiveCard(def, c.upgraded);
            const disabled =
              !discardMode &&
              (eff.unplayable ||
                c.overruledTurns > 0 ||
                (def.kind === 'action' && eff.focusCost > enc.player.focus));
            return (
              <CardView
                key={c.uid}
                def={def}
                upgraded={c.upgraded}
                selected={discardMode && selected.includes(c.uid)}
                disabled={disabled}
                onClick={() => onHandClick(c.uid)}
                title={c.overruledTurns > 0 ? 'Overruled this round' : undefined}
              />
            );
          })}
          {enc.player.hand.length === 0 && <span className="muted">Hand empty.</span>}
        </div>
      </div>
    </div>
  );
}
