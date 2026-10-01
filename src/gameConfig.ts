export type StatId = 'coding' | 'running' | 'reading' | 'writing';

export type StatConfig = {
  id: StatId;
  name: string;
  icon: string;
  color: string;
  startingHours: number;
};

export type ActivityConfig = {
  id: string;
  label: string;
  statId: StatId;
  suggestedHours: number;
  xpPerHour: number;
  rentPoints: number;
  previewAnimation: SpriteAnimationId;
};

export type SpriteAnimationId =
  | 'idleDown'
  | 'walkDown'
  | 'walkLeft'
  | 'walkRight'
  | 'walkUp'
  | 'coding'
  | 'running'
  | 'reading'
  | 'celebrate';

export type SpriteAnimationConfig = {
  id: SpriteAnimationId;
  label: string;
  row: number;
  frames: number;
};

export const characterSpriteSheetPath = '/assets/oliver-sprite-sheet.png';

export const spriteFrame = {
  width: 160,
  height: 220,
  columns: 4,
  rows: 9,
};

export const characterDefaultAnimation: SpriteAnimationId = 'idleDown';

export const spriteAnimations: Record<SpriteAnimationId, SpriteAnimationConfig> = {
  idleDown: { id: 'idleDown', label: 'Idle facing down', row: 0, frames: 4 },
  walkDown: { id: 'walkDown', label: 'Walk down', row: 1, frames: 4 },
  walkLeft: { id: 'walkLeft', label: 'Walk left', row: 2, frames: 4 },
  walkRight: { id: 'walkRight', label: 'Walk right', row: 3, frames: 4 },
  walkUp: { id: 'walkUp', label: 'Walk up', row: 4, frames: 4 },
  coding: { id: 'coding', label: 'Coding', row: 5, frames: 4 },
  running: { id: 'running', label: 'Running', row: 6, frames: 4 },
  reading: { id: 'reading', label: 'Reading', row: 7, frames: 4 },
  celebrate: { id: 'celebrate', label: 'Celebrating', row: 8, frames: 4 },
};

export const dailyRentTarget = 100;
export const dailyRentCoinReward = 35;
export const restTokenCost = dailyRentCoinReward * 3;
export const maxCoinBalance = restTokenCost;
export const questCompletionCoinReward = restTokenCost;
export const startingCoinBalance = 0;
export const baseLevelXp = 100;
export const levelXpGrowth = 1.08;
export const maxLevelXp = 1500;

export const stats: StatConfig[] = [
  {
    id: 'coding',
    name: 'Coding / Engineering',
    icon: 'C',
    color: '#38f2ff',
    startingHours: 0,
  },
  {
    id: 'running',
    name: 'Running / Workout',
    icon: 'R',
    color: '#ff4f8b',
    startingHours: 100,
  },
  {
    id: 'reading',
    name: 'Reading',
    icon: 'B',
    color: '#ffe45c',
    startingHours: 200,
  },
  {
    id: 'writing',
    name: 'Writing',
    icon: 'W',
    color: '#58ff78',
    startingHours: 0,
  },
];

export const quickActivities: ActivityConfig[] = [
  {
    id: 'code-30',
    label: 'Code / engineer',
    statId: 'coding',
    suggestedHours: 0.5,
    xpPerHour: 50,
    rentPoints: 35,
    previewAnimation: 'coding',
  },
  {
    id: 'run-workout',
    label: 'Run or work out',
    statId: 'running',
    suggestedHours: 0.75,
    xpPerHour: 50,
    rentPoints: 35,
    previewAnimation: 'running',
  },
  {
    id: 'read-30',
    label: 'Read',
    statId: 'reading',
    suggestedHours: 0.5,
    xpPerHour: 50,
    rentPoints: 30,
    previewAnimation: 'reading',
  },
  {
    id: 'write-30',
    label: 'Write',
    statId: 'writing',
    suggestedHours: 0.5,
    xpPerHour: 50,
    rentPoints: 35,
    previewAnimation: 'reading',
  },
];

export const starterQuests = [
  {
    id: 'http-server',
    label: 'Build an HTTP server',
    createdAt: new Date('2026-09-01T00:00:00').getTime(),
    deadlineAt: null,
  },
  {
    id: 'codeforces-div-3',
    label: 'Participate in a Codeforces Div. 3 contest',
    createdAt: new Date('2026-09-01T00:00:00').getTime(),
    deadlineAt: null,
  },
];

export const recentActivities = [
  { id: '1', label: 'Code / engineer', detail: '+0.5 hr / +35 rent', time: '8:10 AM' },
  { id: '2', label: 'Read', detail: '+0.5 hr / +30 rent', time: '7:20 AM' },
  { id: '3', label: 'Write', detail: '+0.5 hr / +35 rent', time: '6:40 AM' },
];
