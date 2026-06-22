import { useGame } from '../store/gameStore';
import { RunHud, OverlayHost } from '../components/RunChrome';
import { MapScreen } from './MapScreen';
import { TrialScreen } from './TrialScreen';
import { RewardScreen } from './RewardScreen';
import { ShopScreen } from './ShopScreen';
import { EventScreen } from './EventScreen';
import { RestScreen } from './RestScreen';
import { RunSummaryScreen } from './RunSummaryScreen';

export function RunRouter() {
  const screen = useGame((s) => s.run!.screen);

  let body;
  switch (screen) {
    case 'map':
      body = <MapScreen />;
      break;
    case 'trial':
      body = <TrialScreen />;
      break;
    case 'reward':
      body = <RewardScreen />;
      break;
    case 'shop':
      body = <ShopScreen />;
      break;
    case 'event':
      body = <EventScreen />;
      break;
    case 'rest':
      body = <RestScreen />;
      break;
    case 'runWon':
    case 'runLost':
      return <RunSummaryScreen />;
    default:
      body = <MapScreen />;
  }

  return (
    <div className="app-screen-col">
      <RunHud />
      <div className="run-body">{body}</div>
      <OverlayHost />
    </div>
  );
}
