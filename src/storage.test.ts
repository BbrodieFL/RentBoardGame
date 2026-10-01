import { describe, expect, it } from 'vitest';
import {
  createDefaultSave,
  currentSchemaVersion,
  gameSaveKey,
  getLocalDateKey,
  loadGameSave,
  normalizeGameSave,
  saveGameSave,
} from './storage';
import { maxCoinBalance, restTokenCost, starterQuests } from './gameConfig';
import type { ActivityEntry, Quest, RestTokenUse } from './gameTypes';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

const validEntry: ActivityEntry = {
  id: 'activity-1',
  label: 'Code for 30 minutes',
  statId: 'coding',
  hours: 0.5,
  xp: 25,
  rentPoints: 35,
  timestamp: new Date('2026-09-12T14:30:00').getTime(),
  timeLabel: '2:30 PM',
  localDate: '2026-09-12',
};

const validRestTokenUse: RestTokenUse = {
  localDate: '2026-09-13',
  usedAt: new Date('2026-09-13T12:00:00').getTime(),
  coinCost: restTokenCost,
};

const validQuest: Quest = {
  id: 'write-essay',
  label: 'Write an essay',
  createdAt: new Date('2026-09-14T12:00:00').getTime(),
  deadlineAt: new Date('2026-10-01T12:00:00').getTime(),
};

describe('storage', () => {
  it('creates an empty versioned save by default', () => {
    expect(createDefaultSave()).toEqual({
      schemaVersion: currentSchemaVersion,
      activityEntries: [],
      dailyRentResults: [],
      restTokenUses: [],
      coinBalance: 0,
      currentStreak: 0,
      bestStreak: 0,
      quests: starterQuests,
      completedQuestIds: [],
      settings: {
        reduceMotion: false,
      },
    });
  });

  it('formats dates using the local calendar day', () => {
    expect(getLocalDateKey(new Date(2026, 8, 12, 23, 15))).toBe('2026-09-12');
  });

  it('saves and loads valid activity entries', () => {
    const storage = new MemoryStorage();

    saveGameSave(
      {
        schemaVersion: currentSchemaVersion,
        activityEntries: [validEntry],
        dailyRentResults: [],
        restTokenUses: [validRestTokenUse],
        coinBalance: 25,
        currentStreak: 1,
        bestStreak: 1,
        quests: [...starterQuests, validQuest],
        completedQuestIds: ['http-server'],
        settings: {
          reduceMotion: true,
        },
      },
      storage,
    );

    expect(loadGameSave(storage)).toEqual({
      schemaVersion: currentSchemaVersion,
      activityEntries: [validEntry],
      dailyRentResults: [],
      restTokenUses: [validRestTokenUse],
      coinBalance: 25,
      currentStreak: 0,
      bestStreak: 0,
      quests: [...starterQuests, validQuest],
      completedQuestIds: ['http-server'],
      settings: {
        reduceMotion: true,
      },
    });
  });

  it('migrates old saves by preserving activity entries and adding rent defaults', () => {
    const normalized = normalizeGameSave({
      schemaVersion: 1,
      activityEntries: [validEntry],
    });

    expect(normalized).toEqual({
      schemaVersion: currentSchemaVersion,
      activityEntries: [validEntry],
      dailyRentResults: [],
      restTokenUses: [],
      coinBalance: 0,
      currentStreak: 0,
      bestStreak: 0,
      quests: starterQuests,
      completedQuestIds: [],
      settings: {
        reduceMotion: false,
      },
    });
  });

  it('caps imported coin balances', () => {
    const normalized = normalizeGameSave({
      schemaVersion: currentSchemaVersion,
      activityEntries: [],
      coinBalance: maxCoinBalance + restTokenCost,
    });

    expect(normalized.coinBalance).toBe(maxCoinBalance);
  });

  it('falls back to defaults when saved JSON is broken', () => {
    const storage = new MemoryStorage();
    storage.setItem(gameSaveKey, '{not-json');

    expect(loadGameSave(storage)).toEqual(createDefaultSave());
  });

  it('drops malformed activity entries without crashing', () => {
    const normalized = normalizeGameSave({
      schemaVersion: currentSchemaVersion,
      activityEntries: [
        validEntry,
        {
          id: 'bad-entry',
          statId: 'not-a-real-stat',
        },
      ],
    });

    expect(normalized.activityEntries).toEqual([validEntry]);
  });

  it('keeps valid rest token uses and drops malformed ones', () => {
    const normalized = normalizeGameSave({
      schemaVersion: currentSchemaVersion,
      activityEntries: [],
      restTokenUses: [
        validRestTokenUse,
        {
          localDate: '2026-09-14',
          coinCost: 'free',
        },
      ],
    });

    expect(normalized.restTokenUses).toEqual([validRestTokenUse]);
  });

  it('keeps valid quests and drops malformed ones', () => {
    const normalized = normalizeGameSave({
      schemaVersion: currentSchemaVersion,
      activityEntries: [],
      quests: [
        validQuest,
        {
          id: 99,
          label: 'Bad quest',
        },
      ],
    });

    expect(normalized.quests).toEqual([...starterQuests, validQuest]);
  });
});
