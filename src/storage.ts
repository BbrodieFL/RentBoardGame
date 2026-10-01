import { starterQuests, startingCoinBalance, stats, type StatId } from './gameConfig';
import { capCoinBalance, getBestStreak, getCurrentStreak } from './gameMath';
import type { ActivityEntry, DailyRentResult, Quest, RestTokenUse } from './gameTypes';

export const currentSchemaVersion = 7;
export const gameSaveKey = 'oliver-tyrone-rpg-save';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type GameSave = {
  schemaVersion: typeof currentSchemaVersion;
  activityEntries: ActivityEntry[];
  dailyRentResults: DailyRentResult[];
  restTokenUses: RestTokenUse[];
  coinBalance: number;
  currentStreak: number;
  bestStreak: number;
  quests: Quest[];
  completedQuestIds: string[];
  settings: {
    reduceMotion: boolean;
  };
};

const validStatIds = new Set<StatId>(stats.map((stat) => stat.id));

export function createDefaultSave(): GameSave {
  return {
    schemaVersion: currentSchemaVersion,
    activityEntries: [],
    dailyRentResults: [],
    restTokenUses: [],
    coinBalance: startingCoinBalance,
    currentStreak: 0,
    bestStreak: 0,
    quests: [...starterQuests],
    completedQuestIds: [],
    settings: {
      reduceMotion: false,
    },
  };
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function loadGameSave(storage: StorageLike = window.localStorage): GameSave {
  try {
    const rawSave = storage.getItem(gameSaveKey);

    if (!rawSave) {
      return createDefaultSave();
    }

    return normalizeGameSave(JSON.parse(rawSave));
  } catch {
    return createDefaultSave();
  }
}

export function saveGameSave(save: GameSave, storage: StorageLike = window.localStorage): void {
  storage.setItem(gameSaveKey, JSON.stringify(save));
}

export function clearGameSave(storage: StorageLike = window.localStorage): void {
  storage.removeItem(gameSaveKey);
}

export function normalizeGameSave(value: unknown): GameSave {
  if (!isRecord(value) || !Array.isArray(value.activityEntries)) {
    return createDefaultSave();
  }

  const activityEntries = value.activityEntries.map(normalizeActivityEntry).filter((entry) => entry !== null);
  const dailyRentResults = Array.isArray(value.dailyRentResults)
    ? value.dailyRentResults.filter(isDailyRentResult)
    : [];
  const restTokenUses = Array.isArray(value.restTokenUses) ? value.restTokenUses.filter(isRestTokenUse) : [];
  const coinBalance = typeof value.coinBalance === 'number' && Number.isFinite(value.coinBalance)
    ? capCoinBalance(value.coinBalance)
    : startingCoinBalance;
  const currentStreak = getCurrentStreak(dailyRentResults, getLocalDateKey(), restTokenUses);
  const bestStreak = getBestStreak(dailyRentResults, restTokenUses);
  const quests = mergeWithStarterQuests(Array.isArray(value.quests) ? value.quests.map(normalizeQuest).filter((quest) => quest !== null) : []);
  const completedQuestIds = Array.isArray(value.completedQuestIds)
    ? [...new Set(value.completedQuestIds.filter((questId) => typeof questId === 'string'))]
    : [];
  const settings = isRecord(value.settings)
    ? {
        reduceMotion: value.settings.reduceMotion === true,
      }
    : createDefaultSave().settings;

  return {
    schemaVersion: currentSchemaVersion,
    activityEntries,
    dailyRentResults,
    restTokenUses,
    coinBalance,
    currentStreak,
    bestStreak,
    quests,
    completedQuestIds,
    settings,
  };
}

function normalizeActivityEntry(value: unknown): ActivityEntry | null {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.label !== 'string' ||
    typeof value.statId !== 'string' ||
    !validStatIds.has(value.statId as StatId) ||
    typeof value.xp !== 'number' ||
    !Number.isFinite(value.xp) ||
    typeof value.rentPoints !== 'number' ||
    !Number.isFinite(value.rentPoints) ||
    typeof value.timestamp !== 'number' ||
    !Number.isFinite(value.timestamp) ||
    typeof value.timeLabel !== 'string' ||
    typeof value.localDate !== 'string'
  ) {
    return null;
  }

  const storedHours = typeof value.hours === 'number' && Number.isFinite(value.hours) ? value.hours : null;
  const hours = storedHours ?? value.xp / 50;

  return {
    id: value.id,
    label: value.label,
    statId: value.statId as StatId,
    hours,
    xp: value.xp,
    rentPoints: value.rentPoints,
    timestamp: value.timestamp,
    timeLabel: value.timeLabel,
    localDate: value.localDate,
  };
}

function isDailyRentResult(value: unknown): value is DailyRentResult {
  return (
    isRecord(value) &&
    typeof value.localDate === 'string' &&
    value.rentPaid === true &&
    Number.isFinite(value.paidAt) &&
    Number.isFinite(value.coinReward)
  );
}

function isRestTokenUse(value: unknown): value is RestTokenUse {
  return (
    isRecord(value) &&
    typeof value.localDate === 'string' &&
    Number.isFinite(value.usedAt) &&
    Number.isFinite(value.coinCost)
  );
}

function normalizeQuest(value: unknown): Quest | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.label !== 'string') {
    return null;
  }

  return {
    id: value.id,
    label: value.label.trim(),
    createdAt: typeof value.createdAt === 'number' && Number.isFinite(value.createdAt) ? value.createdAt : Date.now(),
    deadlineAt: typeof value.deadlineAt === 'number' && Number.isFinite(value.deadlineAt) ? value.deadlineAt : null,
  };
}

function mergeWithStarterQuests(quests: Quest[]): Quest[] {
  const questMap = new Map<string, Quest>();

  for (const quest of [...starterQuests, ...quests]) {
    if (quest.label) {
      questMap.set(quest.id, quest);
    }
  }

  return [...questMap.values()];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
