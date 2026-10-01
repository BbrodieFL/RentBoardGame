import {
  dailyRentCoinReward,
  questCompletionCoinReward,
  restTokenCost,
  type ActivityConfig,
  type SpriteAnimationId,
} from './gameConfig';
import {
  capCoinBalance,
  getBestStreak,
  getCurrentStreak,
  isDailyRentRecorded,
  isRentPaidForDate,
  isRestTokenUsedForDate,
  recordRentPaidOnce,
  recordRestTokenUseOnce,
  removeRentPaidForDate,
} from './gameMath';
import type { ActivityEntry } from './gameTypes';
import { getLocalDateKey, type GameSave } from './storage';

export type ActivityReward = {
  xp: number;
  rentPoints: number;
};

export type GameActionFeedback = {
  id: string;
  text: string;
  animation: SpriteAnimationId;
};

export type GameActionResult = {
  save: GameSave;
  feedback: GameActionFeedback | null;
};

export function calculateActivityReward(activity: ActivityConfig, hours: number): ActivityReward {
  const rentPointsPerHour = activity.rentPoints / activity.suggestedHours;

  return {
    xp: Math.round(hours * activity.xpPerHour),
    rentPoints: Math.round(hours * rentPointsPerHour),
  };
}

export function createActivityEntry(
  activity: ActivityConfig,
  hours: number,
  now: Date,
  entryId = createActivityEntryId(now, activity.id),
): ActivityEntry {
  const reward = calculateActivityReward(activity, hours);

  return {
    id: entryId,
    label: activity.label,
    statId: activity.statId,
    hours,
    xp: reward.xp,
    rentPoints: reward.rentPoints,
    timestamp: now.getTime(),
    timeLabel: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    localDate: getLocalDateKey(now),
  };
}

export function logActivity(
  save: GameSave,
  activity: ActivityConfig,
  hours = activity.suggestedHours,
  now = new Date(),
  todayDate = getLocalDateKey(now),
): GameActionResult {
  const entry = createActivityEntry(activity, hours, now);
  const nextActivityEntries = [entry, ...save.activityEntries];

  if (!isRentPaidForDate(nextActivityEntries, entry.localDate)) {
    return {
      save: {
        ...save,
        activityEntries: nextActivityEntries,
      },
      feedback: {
        id: entry.id,
        text: `+${entry.xp} XP`,
        animation: activity.previewAnimation,
      },
    };
  }

  const nextDailyRentResults = recordRentPaidOnce(save.dailyRentResults, entry.localDate, entry.timestamp);
  const wasAlreadyPaid = nextDailyRentResults === save.dailyRentResults;

  return {
    save: {
      ...save,
      activityEntries: nextActivityEntries,
      dailyRentResults: nextDailyRentResults,
      coinBalance: wasAlreadyPaid ? save.coinBalance : capCoinBalance(save.coinBalance + dailyRentCoinReward),
      currentStreak: getCurrentStreak(nextDailyRentResults, todayDate, save.restTokenUses),
      bestStreak: getBestStreak(nextDailyRentResults, save.restTokenUses),
    },
    feedback: {
      id: entry.id,
      text: wasAlreadyPaid ? `+${entry.xp} XP` : `RENT PAID +${dailyRentCoinReward} coins`,
      animation: wasAlreadyPaid ? activity.previewAnimation : 'celebrate',
    },
  };
}

export function undoActivity(save: GameSave, entryId: string, todayDate = getLocalDateKey()): GameActionResult {
  const removedEntry = save.activityEntries.find((entry) => entry.id === entryId);
  const nextActivityEntries = save.activityEntries.filter((entry) => entry.id !== entryId);

  if (!removedEntry || isRentPaidForDate(nextActivityEntries, removedEntry.localDate)) {
    return {
      save: {
        ...save,
        activityEntries: nextActivityEntries,
      },
      feedback: null,
    };
  }

  const removedRentResult = save.dailyRentResults.find((result) => result.localDate === removedEntry.localDate);
  const nextDailyRentResults = removeRentPaidForDate(save.dailyRentResults, removedEntry.localDate);

  return {
    save: {
      ...save,
      activityEntries: nextActivityEntries,
      dailyRentResults: nextDailyRentResults,
      coinBalance: Math.max(0, save.coinBalance - (removedRentResult?.coinReward ?? 0)),
      currentStreak: getCurrentStreak(nextDailyRentResults, todayDate, save.restTokenUses),
      bestStreak: getBestStreak(nextDailyRentResults, save.restTokenUses),
    },
    feedback: null,
  };
}

export function useRestToken(save: GameSave, todayDate = getLocalDateKey(), now = new Date()): GameActionResult {
  if (
    save.coinBalance < restTokenCost ||
    isDailyRentRecorded(save.dailyRentResults, todayDate) ||
    isRestTokenUsedForDate(save.restTokenUses, todayDate)
  ) {
    return {
      save,
      feedback: null,
    };
  }

  const usedAt = now.getTime();
  const nextRestTokenUses = recordRestTokenUseOnce(save.restTokenUses, todayDate, usedAt);

  return {
    save: {
      ...save,
      restTokenUses: nextRestTokenUses,
      coinBalance: save.coinBalance - restTokenCost,
      currentStreak: getCurrentStreak(save.dailyRentResults, todayDate, nextRestTokenUses),
      bestStreak: getBestStreak(save.dailyRentResults, nextRestTokenUses),
    },
    feedback: {
      id: `rest-${usedAt}`,
      text: `REST DAY -${restTokenCost} coins`,
      animation: 'celebrate',
    },
  };
}

export function toggleQuestCompletion(save: GameSave, questId: string): GameSave {
  if (!save.quests.some((quest) => quest.id === questId)) {
    return save;
  }

  const isCompleted = save.completedQuestIds.includes(questId);

  return {
    ...save,
    coinBalance: isCompleted
      ? Math.max(0, save.coinBalance - questCompletionCoinReward)
      : capCoinBalance(save.coinBalance + questCompletionCoinReward),
    completedQuestIds: isCompleted
      ? save.completedQuestIds.filter((completedQuestId) => completedQuestId !== questId)
      : [...save.completedQuestIds, questId],
  };
}

export function removeQuest(save: GameSave, questId: string): GameSave {
  if (!save.quests.some((quest) => quest.id === questId)) {
    return save;
  }

  return {
    ...save,
    quests: save.quests.filter((quest) => quest.id !== questId),
    completedQuestIds: save.completedQuestIds.filter((completedQuestId) => completedQuestId !== questId),
  };
}

export function addQuest(
  save: GameSave,
  label: string,
  now = new Date(),
  questId = createQuestId(now),
  deadlineAt: number | null = null,
): GameSave {
  const trimmedLabel = label.trim();

  if (!trimmedLabel) {
    return save;
  }

  return {
    ...save,
    quests: [
      ...save.quests,
      {
        id: questId,
        label: trimmedLabel,
        createdAt: now.getTime(),
        deadlineAt,
      },
    ],
  };
}

function createActivityEntryId(now: Date, activityId: string): string {
  return globalThis.crypto?.randomUUID?.() ?? `${now.getTime()}-${activityId}`;
}

function createQuestId(now: Date): string {
  return globalThis.crypto?.randomUUID?.() ?? `quest-${now.getTime()}`;
}
