import type { ColorblindMode, SettingsState } from '../../save';
import { useGame } from '../store/gameStore';

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="slider-row">
      <span>
        {label}: {Math.round(value * 100) / 100}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export function SettingsScreen() {
  const meta = useGame((s) => s.meta);
  const updateMeta = useGame((s) => s.updateMeta);
  const setAppScreen = useGame((s) => s.setAppScreen);
  const run = useGame((s) => s.run);
  const s = meta.settings;

  const patch = (p: Partial<SettingsState>) =>
    updateMeta((m) => {
      m.settings = { ...m.settings, ...p };
    });

  const back = () => setAppScreen(run && run.result === null ? 'run' : 'title');

  return (
    <div className="screen center-col fade-in">
      <h2 className="section-title">Settings</h2>
      <div className="panel" style={{ minWidth: 420, color: 'var(--parchment-ink)' }}>
        <Slider label="Master Volume" value={s.masterVolume} min={0} max={1} step={0.05} onChange={(v) => patch({ masterVolume: v })} />
        <Slider label="SFX Volume" value={s.sfxVolume} min={0} max={1} step={0.05} onChange={(v) => patch({ sfxVolume: v })} />
        <Slider label="Music Volume" value={s.musicVolume} min={0} max={1} step={0.05} onChange={(v) => patch({ musicVolume: v })} />
        <Slider label="Text Scale" value={s.textScale} min={0.8} max={1.4} step={0.1} onChange={(v) => patch({ textScale: v })} />

        <label className="toggle">
          <input type="checkbox" checked={s.reduceMotion} onChange={(e) => patch({ reduceMotion: e.target.checked })} />
          Reduce motion (disable animations)
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.screenShake} onChange={(e) => patch({ screenShake: e.target.checked })} />
          Screen shake
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.fastMode} onChange={(e) => patch({ fastMode: e.target.checked })} />
          Fast mode (snappier animations)
        </label>
        <div className="slider-row">
          <span>Colorblind palette</span>
          <select
            value={s.colorblind}
            onChange={(e) => patch({ colorblind: e.target.value as ColorblindMode })}
          >
            <option value="off">Off</option>
            <option value="deuteranopia">Deuteranopia</option>
            <option value="protanopia">Protanopia</option>
            <option value="tritanopia">Tritanopia</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" onClick={back}>
        Back
      </button>
    </div>
  );
}
