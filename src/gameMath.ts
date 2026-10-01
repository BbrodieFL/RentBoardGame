import {
  baseLevelXp,
  dailyRentCoinReward,
  dailyRentTarget,
  levelXpGrowth,
  maxCoinBalance,
  maxLevelXp,
  restTokenCost,
} from './gameConfig';
import type { ActivityEntry, DailyRentResult, RestTokenUse } from './gameTypes';

export function getLevelProgress(totalXp: number) {
  const safeTotalXp = Math.max(0, Math.floor(totalXp));
  let level = 1;
  let xpSpent = 0;
  let nextLevelCost = getLevelXpCost(level);

  while (safeTotalXp >= xpSpent + nextLevelCost) {
    xpSpent += nextLevelCost;
    level += 1;
    nextLevelCost = getLevelXpCost(level);
  }

  const progressXp = safeTotalXp - xpSpent;
  const percent = Math.round((progressXp / nextLevelCost) * 100);

  return {
    level,
    progressXp,
    neededXp: nextLevelCost,
    percent,
  };
}

export function getLevelXpCost(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const grownCost = Math.round(baseLevelXp * levelXpGrowth ** (safeLevel - 1));

  return Math.min(maxLevelXp, grownCost);
}

export function getRentPointsForDate(activityEntries: ActivityEntry[], localDate: string): number {
  return activityEntries
    .filter((entry) => entry.localDate === localDate)
    .reduce((total, entry) => total + entry.rentPoints, 0);
}

export function isRentPaidForDate(activityEntries: ActivityEntry[], localDate: string): boolean {
  return getRentPointsForDate(activityEntries, localDate) >= dailyRentTarget;
}

export function isDailyRentRecorded(dailyRentResults: DailyRentResult[], localDate: string): boolean {
  return dailyRentResults.some((result) => result.localDate === localDate && result.rentPaid);
}

export function getPaidRentDayCount(dailyRentResults: DailyRentResult[]): number {
  return new Set(dailyRentResults.filter((result) => result.rentPaid).map((result) => result.localDate)).size;
}

export function capCoinBalance(coinBalance: number): number {
  if (!Number.isFinite(coinBalance)) {
    return 0;
  }

  return Math.min(maxCoinBalance, Math.max(0, Math.floor(coinBalance)));
}

export function isRestTokenUsedForDate(restTokenUses: RestTokenUse[], localDate: string): boolean {
  return restTokenUses.some((restTokenUse) => restTokenUse.localDate === localDate);
}

export function recordRentPaidOnce(
  dailyRentResults: DailyRentResult[],
  localDate: string,
  paidAt: number,
): DailyRentResult[] {
  if (isDailyRentRecorded(dailyRentResults, localDate)) {
    return dailyRentResults;
  }

  return [
    ...dailyRentResults,
    {
      localDate,
      rentPaid: true,
      paidAt,
      coinReward: dailyRentCoinReward,
    },
  ].sort((a, b) => a.localDate.localeCompare(b.localDate));
}

export function recordRestTokenUseOnce(
  restTokenUses: RestTokenUse[],
  localDate: string,
  usedAt: number,
): RestTokenUse[] {
  if (isRestTokenUsedForDate(restTokenUses, localDate)) {
    return restTokenUses;
  }

  return [
    ...restTokenUses,
    {
      localDate,
      usedAt,
      coinCost: restTokenCost,
    },
  ].sort((a, b) => a.localDate.localeCompare(b.localDate));
}

export function removeRentPaidForDate(dailyRentResults: DailyRentResult[], localDate: string): DailyRentResult[] {
  return dailyRentResults.filter((result) => result.localDate !== localDate);
}

export function getBestStreak(dailyRentResults: DailyRentResult[], restTokenUses: RestTokenUse[] = []): number {
  const paidDateSet = new Set(getSortedPaidDates(dailyRentResults));
  const streakDates = getSortedCoveredDates(dailyRentResults, restTokenUses);
  let bestStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;

  for (const streakDate of streakDates) {
    runningStreak = previousDate && getDateDaysBetween(previousDate, streakDate) === 1 ? runningStreak : 0;

    if (paidDateSet.has(streakDate)) {
      runningStreak += 1;
    }

    bestStreak = Math.max(bestStreak, runningStreak);
    previousDate = streakDate;
  }

  return bestStreak;
}

export function getCurrentStreak(
  dailyRentResults: DailyRentResult[],
  todayDate: string,
  restTokenUses: RestTokenUse[] = [],
): number {
  const paidDateSet = new Set(getSortedPaidDates(dailyRentResults));
  const coveredDateSet = new Set(getSortedCoveredDates(dailyRentResults, restTokenUses));
  const streakEndDate = coveredDateSet.has(todayDate) ? todayDate : getPreviousLocalDateKey(todayDate);

  if (!coveredDateSet.has(streakEndDate)) {
    return 0;
  }

  let streak = 0;
  let cursor = streakEndDate;

  while (coveredDateSet.has(cursor)) {
    if (paidDateSet.has(cursor)) {
      streak += 1;
    }

    cursor = getPreviousLocalDateKey(cursor);
  }

  return streak;
}

function getSortedCoveredDates(dailyRentResults: DailyRentResult[], restTokenUses: RestTokenUse[]): string[] {
  return [...new Set([...getSortedPaidDates(dailyRentResults), ...restTokenUses.map((rest) => rest.localDate)])].sort();
}

function getSortedPaidDates(dailyRentResults: DailyRentResult[]): string[] {
  return [...new Set(dailyRentResults.filter((result) => result.rentPaid).map((result) => result.localDate))].sort();
}

function getDateDaysBetween(startDate: string, endDate: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${endDate}T00:00:00`) - Date.parse(`${startDate}T00:00:00`)) / millisecondsPerDay);
}

function getPreviousLocalDateKey(localDate: string): string {
  const date = new Date(`${localDate}T00:00:00`);
  date.setDate(date.getDate() - 1);

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}
