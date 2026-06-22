import { type CSSProperties } from 'react';
import { useGame } from './ui/store/gameStore';
import { TitleScreen } from './ui/screens/TitleScreen';
import { CharacterSelectScreen } from './ui/screens/CharacterSelectScreen';
import { SettingsScreen } from './ui/screens/SettingsScreen';
import { CodexScreen } from './ui/screens/CodexScreen';
import { RunRouter } from './ui/screens/RunRouter';

export function App() {
  const appScreen = useGame((s) => s.appScreen);
  const run = useGame((s) => s.run);
  const settings = useGame((s) => s.meta.settings);

  const rootCls = [
    'app-root',
    settings.reduceMotion ? 'reduce-motion' : '',
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
