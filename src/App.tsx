import { useEffect, type CSSProperties } from 'react';
import { useGame } from './ui/store/gameStore';
import { TitleScreen } from './ui/screens/TitleScreen';
import { CharacterSelectScreen } from './ui/screens/CharacterSelectScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { CodexScreen } from './ui/screens/CodexScreen';
import { RunRouter } from './ui/screens/RunRouter';
import { initAudio, setVolumes, playMusic } from './audio';

export function App() {
  const appScreen = useGame((s) => s.appScreen);
  const run = useGame((s) => s.run);
  const settings = useGame((s) => s.meta.settings);
  const act = run?.act ?? 1;

  // Initialise audio on first user gesture, then keep volumes in sync.
  useEffect(() => {
    const unlock = () => {
      initAudio();
      setVolumes({
        master: settings.masterVolume,
        sfx: settings.sfxVolume,
        music: settings.musicVolume,
      });
      playMusic(appScreen === 'run' ? act : 1);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setVolumes({
      master: settings.masterVolume,
      sfx: settings.sfxVolume,
      music: settings.musicVolume,
    });
  }, [settings.masterVolume, settings.sfxVolume, settings.musicVolume]);

  useEffect(() => {
    playMusic(appScreen === 'run' ? act : 1);
  }, [appScreen, act]);

  const rootCls = [
    'app-root',
    settings.reduceMotion ? 'reduce-motion' : '',
    settings.fastMode ? 'fast-mode' : '',
    `cb-${settings.colorblind}`,
  ]
    .filter(Boolean)
    .join(' ');

  const style = { '--text-scale': String(settings.textScale) } as CSSProperties;

  let content;
  if (appScreen === 'title') content = <TitleScreen />;
  else if (appScreen === 'characterSelect') content = <CharacterSelectScreen />;
  else if (appScreen === 'settings') content = <SettingsScreen />;
  else if (appScreen === 'codex') content = <CodexScreen />;
  else if (appScreen === 'run' && run) content = <RunRouter />;
  else content = <TitleScreen />;

  return (
    <div className={rootCls} style={style}>
      {content}
      <div className="crt-overlay" />
    </div>
  );
}
