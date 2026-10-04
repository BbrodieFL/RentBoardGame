import { describe, expect, it } from 'vitest';
import {
  dailyRentCoinReward,
  maxCoinBalance,
  questCompletionCoinReward,
  quickActivities,
  restTokenCost,
} from './gameConfig';
import {
  addQuest,
  calculateActivityReward,
  createActivityEntry,
  logActivity,
  removeQuest,
  toggleQuestCompletion,
  undoActivity,
  useRestToken,
} from './gameActions';
import { shouldOpenRentReflection } from './appUi';
import { getCurrentStreak } from './gameMath';
import { createDefaultSave, type GameSave } from './storage';

const codeActivity = quickActivities[0];

function createPaidRentSave(localDates: string[], coinBalance = 0): GameSave {
  return {
    ...createDefaultSave(),
    coinBalance,
    dailyRentResults: localDates.map((localDate) => ({
      localDate,
      rentPaid: true,
      paidAt: new Date(`${localDate}T12:00:00`).getTime(),
      coinReward: dailyRentCoinReward,
    })),
  };
}

describe('game actions', () => {
  it('calculates activity rewards from the selected duration', () => {
    expect(calculateActivityReward(codeActivity, 1)).toEqual({
      xp: 50,
      rentPoints: 70,
    });
  });

  it('creates an activity entry from activity config and duration', () => {
    const entry = createActivityEntry(codeActivity, 0.75, new Date('2026-09-14T12:00:00'), 'entry-1');

    expect(entry).toMatchObject({
      id: 'entry-1',
      label: codeActivity.label,
      statId: codeActivity.statId,
      hours: 0.75,
      xp: 38,
      rentPoints: 53,
      localDate: '2026-09-14',
    });
  });

  it('logs activities and awards rent coins once when the target is reached', () => {
    let save = createDefaultSave();

    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T09:00:00'), '2026-09-14').save;
    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T10:00:00'), '2026-09-14').save;
    const paidResult = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T11:00:00'), '2026-09-14');
    save = paidResult.save;
    const extraResult = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T12:00:00'), '2026-09-14');

    expect(save.activityEntries).toHaveLength(3);
    expect(save.dailyRentResults).toHaveLength(1);
    expect(save.coinBalance).toBe(dailyRentCoinReward);
    expect(paidResult.feedback?.text).toBe(`RENT PAID +${dailyRentCoinReward} coins`);
    expect(extraResult.save.coinBalance).toBe(dailyRentCoinReward);
    expect(extraResult.feedback?.text).toBe('+25 XP');
  });

  it('opens the rent reflection only when rent is newly paid', () => {
    let save = createDefaultSave();

    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T09:00:00'), '2026-09-14').save;
    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T10:00:00'), '2026-09-14').save;

    const paidResult = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T11:00:00'), '2026-09-14');
    const extraResult = logActivity(paidResult.save, codeActivity, 0.5, new Date('2026-09-14T12:00:00'), '2026-09-14');

    expect(shouldOpenRentReflection(paidResult.feedback)).toBe(true);
    expect(shouldOpenRentReflection(extraResult.feedback)).toBe(false);
  });

  it('does not award rent coins above the coin cap', () => {
    let save = {
      ...createDefaultSave(),
      coinBalance: maxCoinBalance - 10,
    };

    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T09:00:00'), '2026-09-14').save;
    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T10:00:00'), '2026-09-14').save;
    const result = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T11:00:00'), '2026-09-14');

    expect(result.save.coinBalance).toBe(maxCoinBalance);
  });

  it('undoes a rent-paying activity and refunds the rent coin reward when the day no longer qualifies', () => {
    let save = createDefaultSave();

    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T09:00:00'), '2026-09-14').save;
    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T10:00:00'), '2026-09-14').save;
    save = logActivity(save, codeActivity, 0.5, new Date('2026-09-14T11:00:00'), '2026-09-14').save;

    const result = undoActivity(save, save.activityEntries[0].id, '2026-09-14');

    expect(result.save.activityEntries).toHaveLength(2);
    expect(result.save.dailyRentResults).toHaveLength(0);
    expect(result.save.coinBalance).toBe(0);
  });

  it('uses a rest token to protect but not increment the current streak', () => {
    const save = createPaidRentSave(['2026-09-12', '2026-09-13'], restTokenCost);
    const result = useRestToken(save, '2026-09-14', new Date('2026-09-14T08:00:00'));

    expect(result.save.coinBalance).toBe(0);
    expect(result.save.restTokenUses).toHaveLength(1);
    expect(getCurrentStreak(result.save.dailyRentResults, '2026-09-14', result.save.restTokenUses)).toBe(2);
    expect(result.feedback?.text).toBe(`REST DAY -${restTokenCost} coins`);
  });

  it('adds a custom quest', () => {
    const save = createDefaultSave();
    const result = addQuest(save, '  Draft the C++ API plan  ', new Date('2026-09-14T08:00:00'), 'quest-1');

    expect(result.quests.at(-1)).toEqual({
      id: 'quest-1',
      label: 'Draft the C++ API plan',
      createdAt: new Date('2026-09-14T08:00:00').getTime(),
      deadlineAt: null,
    });
  });

  it('adds a custom quest with a deadline', () => {
    const save = createDefaultSave();
    const deadlineAt = new Date('2026-10-31T23:59:59').getTime();
    const result = addQuest(save, 'Ship the hosted app', new Date('2026-09-14T08:00:00'), 'quest-1', deadlineAt);

    expect(result.quests.at(-1)?.deadlineAt).toBe(deadlineAt);
  });

  it('does not toggle unknown quest ids', () => {
    const save = createDefaultSave();

    expect(toggleQuestCompletion(save, 'not-a-real-quest')).toBe(save);
  });

  it('awards rest-day coins when completing a quest', () => {
    const save = createDefaultSave();
    const result = toggleQuestCompletion(save, 'http-server');

    expect(result.completedQuestIds).toContain('http-server');
    expect(result.coinBalance).toBe(questCompletionCoinReward);
  });

  it('does not award quest coins above the coin cap', () => {
    const save = {
      ...createDefaultSave(),
      coinBalance: maxCoinBalance - 10,
    };
    const result = toggleQuestCompletion(save, 'http-server');

    expect(result.coinBalance).toBe(maxCoinBalance);
  });

  it('removes rest-day coins when uncompleting a quest', () => {
    const save = {
      ...createDefaultSave(),
      coinBalance: questCompletionCoinReward,
      completedQuestIds: ['http-server'],
    };
    const result = toggleQuestCompletion(save, 'http-server');

    expect(result.completedQuestIds).not.toContain('http-server');
    expect(result.coinBalance).toBe(0);
  });

  it('removes a quest and its completion state', () => {
    const save = {
      ...createDefaultSave(),
      completedQuestIds: ['http-server'],
    };
    const result = removeQuest(save, 'http-server');

    expect(result.quests.some((quest) => quest.id === 'http-server')).toBe(false);
    expect(result.completedQuestIds).not.toContain('http-server');
  });

  it('does not remove unknown quest ids', () => {
    const save = createDefaultSave();

    expect(removeQuest(save, 'not-a-real-quest')).toBe(save);
  });
});
