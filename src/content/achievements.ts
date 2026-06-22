export interface AchievementDef {
  id: string;
  name: string;
  description: string;
}

/** Achievements. Unlock logic lives in /save (checked against run stats). */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'firstAcquittal', name: 'First Acquittal', description: 'Win your first run.' },
  { id: 'clearAct1', name: 'Small Claims, Big Win', description: 'Defeat the Act 1 boss.' },
  { id: 'clearAct2', name: 'Moving Up', description: 'Defeat the Act 2 boss.' },
  {
    id: 'showstopper',
    name: 'Showstopper',
    description: 'Score a single argument worth 500+ Doubt.',
  },
  {
    id: 'closer',
    name: 'The Closer',
    description: 'Win a run in 24 total rounds or fewer.',
  },
  {
    id: 'appellate',
    name: 'Appellate Specialist',
    description: 'Win a run at Appeal 5 or higher.',
  },
  {
    id: 'librarian',
    name: 'Well-Read',
    description: 'Hold 8 or more Precedents in a single run.',
  },
  {
    id: 'allRise',
    name: 'All Rise',
    description: 'Win a run with each of the three attorneys.',
  },
];
