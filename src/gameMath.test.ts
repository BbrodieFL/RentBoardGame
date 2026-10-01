import { describe, expect, it } from 'vitest';
import { dailyRentCoinReward, dailyRentTarget, maxCoinBalance, restTokenCost } from './gameConfig';
import {
  capCoinBalance,
  getBestStreak,
  getCurrentStreak,
  getLevelProgress,
  getLevelXpCost,
  getPaidRentDayCount,
  getRentPointsForDate,
  isDailyRentRecorded,
  isRestTokenUsedForDate,
  isRentPaidForDate,
  recordRentPaidOnce,
  recordRestTokenUseOnce,
  removeRentPaidForDate,
} from './gameMath';
import type { ActivityEntry, DailyRentResult, RestTokenUse } from './gameTypes';

function createEntry(id: string, localDate: string, rentPoints: number): ActivityEntry {
  return {
    id,
    label: 'Code for 30 minutes',
    statId: 'coding',
    hours: 0.5,
    xp: 25,
    rentPoints,
    timestamp: new Date(`${localDate}T12:00:00`).getTime(),
    timeLabel: '12:00 PM',
    localDate,
  };
}

function createRentResult(localDate: string): DailyRentResult {
  return {
    localDate,
    rentPaid: true,
    paidAt: new Date(`${localDate}T12:00:00`).getTime(),
    coinReward: dailyRentCoinReward,
  };
}

function createRestTokenUse(localDate: string): RestTokenUse {
  return {
    localDate,
    usedAt: new Date(`${localDate}T12:00:00`).getTime(),
    coinCost: restTokenCost,
  };
}

describe('game math', () => {
  it('calculates early numeric level progress from total XP', () => {
    expect(getLevelProgress(125)).toEqual({
      level: 2,
      progressXp: 25,
      neededXp: 108,
      percent: 23,
    });
  });

  it('increases level costs with a capped growth curve', () => {
    expect(getLevelXpCost(1)).toBe(100);
    expect(getLevelXpCost(2)).toBe(108);
    expect(getLevelXpCost(40)).toBe(1500);
  });

  it('adds rent points only for the requested local date', () => {
    const entries = [createEntry('today-1', '2026-09-14', 35), createEntry('yesterday-1', '2026-09-13', 70)];

    expect(getRentPointsForDate(entries, '2026-09-14')).toBe(35);
  });

  it('knows when a day reaches the rent target', () => {
    const entries = [
      createEntry('today-1', '2026-09-14', dailyRentTarget - 10),
      createEntry('today-2', '2026-09-14', 10),
    ];

    expect(isRentPaidForDate(entries, '2026-09-14')).toBe(true);
  });

  it('records rent paid once for a local date', () => {
    const firstResult = recordRentPaidOnce([], '2026-09-14', 1000);
    const secondResult = recordRentPaidOnce(firstResult, '2026-09-14', 2000);

    expect(firstResult).toEqual([
      {
        localDate: '2026-09-14',
        rentPaid: true,
        paidAt: 1000,
        coinReward: dailyRentCoinReward,
      },
    ]);
    expect(secondResult).toBe(firstResult);
    expect(isDailyRentRecorded(secondResult, '2026-09-14')).toBe(true);
  });

  it('counts unique paid rent days', () => {
    const results = [createRentResult('2026-09-13'), createRentResult('2026-09-14'), createRentResult('2026-09-14')];

    expect(getPaidRentDayCount(results)).toBe(2);
  });

  it('caps coin balances to the configured maximum', () => {
    expect(capCoinBalance(maxCoinBalance + dailyRentCoinReward)).toBe(maxCoinBalance);
    expect(capCoinBalance(-5)).toBe(0);
  });

  it('records one rest token use for a local date', () => {
    const firstUse = recordRestTokenUseOnce([], '2026-09-14', 1000);
    const secondUse = recordRestTokenUseOnce(firstUse, '2026-09-14', 2000);

    expect(firstUse).toEqual([
      {
        localDate: '2026-09-14',
        usedAt: 1000,
        coinCost: restTokenCost,
      },
    ]);
    expect(secondUse).toBe(firstUse);
    expect(isRestTokenUsedForDate(secondUse, '2026-09-14')).toBe(true);
  });

  it('removes a rent-paid record when a corrected day is no longer qualified', () => {
    const results = [createRentResult('2026-09-13'), createRentResult('2026-09-14')];

    expect(removeRentPaidForDate(results, '2026-09-14')).toEqual([createRentResult('2026-09-13')]);
  });

  it('calculates current streak through today or yesterday', () => {
    const results = [createRentResult('2026-09-12'), createRentResult('2026-09-13')];

    expect(getCurrentStreak(results, '2026-09-14')).toBe(2);
    expect(getCurrentStreak(results, '2026-09-15')).toBe(0);
  });

  it('uses rest token days to protect a streak without incrementing it', () => {
    const results = [createRentResult('2026-09-12'), createRentResult('2026-09-14')];
    const restTokenUses = [createRestTokenUse('2026-09-13')];

    expect(getCurrentStreak(results, '2026-09-14', restTokenUses)).toBe(2);
    expect(getBestStreak(results, restTokenUses)).toBe(2);
  });

  it('freezes the current streak when today is covered by a rest token', () => {
    const results = [createRentResult('2026-09-12'), createRentResult('2026-09-13')];
    const restTokenUses = [createRestTokenUse('2026-09-14')];

    expect(getCurrentStreak(results, '2026-09-14', restTokenUses)).toBe(2);
    expect(getBestStreak(results, restTokenUses)).toBe(2);
  });

  it('calculates the best streak across paid days', () => {
    const results = [
      createRentResult('2026-09-09'),
      createRentResult('2026-09-11'),
      createRentResult('2026-09-12'),
      createRentResult('2026-09-13'),
    ];

    expect(getBestStreak(results)).toBe(3);
  });
});
