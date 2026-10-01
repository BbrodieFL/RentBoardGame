import {
  characterDefaultAnimation,
  characterSpriteSheetPath,
  dailyRentTarget,
  questCompletionCoinReward,
  quickActivities,
  restTokenCost,
  spriteAnimations,
  spriteFrame,
  stats,
  type ActivityConfig,
  type SpriteAnimationId,
  type StatConfig,
  type StatId,
} from './gameConfig';
import {
  addQuest,
  logActivity,
  removeQuest,
  toggleQuestCompletion,
  undoActivity,
  useRestToken,
  type GameActionFeedback,
} from './gameActions';
import {
  getBestStreak,
  getCurrentStreak,
  getLevelProgress,
  getPaidRentDayCount,
  getRentPointsForDate,
  isDailyRentRecorded,
  isRestTokenUsedForDate,
} from './gameMath';
import type { Quest } from './gameTypes';
import { createDefaultSave, getLocalDateKey, loadGameSave, normalizeGameSave, saveGameSave } from './storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ChangeEvent, FormEvent } from 'react';

type FloatingFeedback = {
  id: string;
  text: string;
};

const questDeadline = new Date('2026-10-31T23:59:59');
const activityDurationPresets = [5, 15, 30, 45, 60];
const minimumActivityMinutes = 5;
const maximumActivityMinutes = 480;

function App() {
  const todayDate = getLocalDateKey();
  const [gameSave, setGameSave] = useState(() => loadGameSave());
  const [activeAnimation, setActiveAnimation] = useState<SpriteAnimationId>(characterDefaultAnimation);
  const [floatingFeedback, setFloatingFeedback] = useState<FloatingFeedback | null>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [selectedActivity, setSelectedActivity] = useState<ActivityConfig | null>(null);
  const animationResetTimer = useRef<number | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const { activityEntries, dailyRentResults, restTokenUses, coinBalance, quests, completedQuestIds } = gameSave;
  const displayCurrentStreak = getCurrentStreak(dailyRentResults, todayDate, restTokenUses);
  const displayBestStreak = getBestStreak(dailyRentResults, restTokenUses);
  const paidRentDayCount = getPaidRentDayCount(dailyRentResults);

  const todaysActivityEntries = useMemo(
    () => activityEntries.filter((entry) => entry.localDate === todayDate),
    [activityEntries, todayDate],
  );
  const todayRentPoints = useMemo(() => getRentPointsForDate(activityEntries, todayDate), [activityEntries, todayDate]);
  const rentPercent = Math.min(100, Math.round((todayRentPoints / dailyRentTarget) * 100));
  const isTodayRentPaid = isDailyRentRecorded(dailyRentResults, todayDate);
  const isTodayRested = isRestTokenUsedForDate(restTokenUses, todayDate);
  const isTodayStreakCovered = isTodayRentPaid || isTodayRested;
  const canUseRestToken = coinBalance >= restTokenCost && !isTodayStreakCovered;

  const statHoursById = useMemo(() => {
    const totals = Object.fromEntries(stats.map((stat) => [stat.id, stat.startingHours])) as Record<StatId, number>;

    for (const entry of activityEntries) {
      totals[entry.statId] += entry.hours;
    }

    return totals;
  }, [activityEntries]);
  const statXpById = useMemo(() => {
    const totals = Object.fromEntries(stats.map((stat) => [stat.id, stat.startingHours * 50])) as Record<StatId, number>;

    for (const entry of activityEntries) {
      totals[entry.statId] += entry.xp;
    }

    return totals;
  }, [activityEntries]);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    saveGameSave(gameSave);
  }, [gameSave]);

  function handleActivitySelect(activity: ActivityConfig) {
    setSelectedActivity(activity);
  }

  function handleActivityLog(activity: ActivityConfig, minutes: number) {
    const result = logActivity(gameSave, activity, minutes / 60, new Date(), todayDate);

    setGameSave(result.save);
    setSelectedActivity(null);
    showGameFeedback(result.feedback);
  }

  function handleUndo(entryId: string) {
    const result = undoActivity(gameSave, entryId, todayDate);

    setGameSave(result.save);
    showGameFeedback(result.feedback);
  }

  function handleUseRestToken() {
    const result = useRestToken(gameSave, todayDate, new Date());

    setGameSave(result.save);
    showGameFeedback(result.feedback);
  }

  function handleExportSave() {
    const exportText = JSON.stringify(gameSave, null, 2);
    const exportUrl = URL.createObjectURL(new Blob([exportText], { type: 'application/json' }));
    const exportLink = document.createElement('a');
    exportLink.href = exportUrl;
    exportLink.download = `oliver-tyrone-save-${todayDate}.json`;
    exportLink.click();
    URL.revokeObjectURL(exportUrl);
  }

  function handleImportClick() {
    importInputRef.current?.click();
  }

  function handleImportSave(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    file
      .text()
      .then((contents) => {
        setGameSave(normalizeGameSave(JSON.parse(contents)));
        setFloatingFeedback({ id: `import-${Date.now()}`, text: 'Save imported' });
      })
      .catch(() => {
        setFloatingFeedback({ id: `import-error-${Date.now()}`, text: 'Import failed' });
      });
  }

  function handleResetSave() {
    if (!window.confirm('Reset all saved progress for this browser?')) {
      return;
    }

    setGameSave(createDefaultSave());
    setFloatingFeedback({ id: `reset-${Date.now()}`, text: 'Save reset' });
  }

  function handleQuestToggle(questId: string) {
    setGameSave((save) => toggleQuestCompletion(save, questId));
  }

  function handleQuestRemove(questId: string) {
    setGameSave((save) => removeQuest(save, questId));
  }

  function handleQuestAdd(label: string, deadlineAt: number | null) {
    setGameSave((save) => addQuest(save, label, new Date(), undefined, deadlineAt));
  }

  function showGameFeedback(feedback: GameActionFeedback | null) {
    if (!feedback) {
      setFloatingFeedback(null);
      return;
    }

    setActiveAnimation(feedback.animation);
    setFloatingFeedback({ id: feedback.id, text: feedback.text });

    if (animationResetTimer.current) {
      window.clearTimeout(animationResetTimer.current);
    }

    animationResetTimer.current = window.setTimeout(() => {
      setActiveAnimation(characterDefaultAnimation);
      setFloatingFeedback(null);
    }, 1800);
  }

  return (
    <main className="shell">
      <section className="topBar" aria-label="Player status">
        <div>
          <p className="eyebrow">Local RPG Tracker</p>
          <h1>Oliver Tyrone</h1>
        </div>
        <div className="statusCluster">
          <StatusChip label="Coins" value={coinBalance.toString()} />
          <StatusChip label="Days Paid" value={paidRentDayCount.toString()} />
          <StatusChip label="Streak" value={`${displayCurrentStreak} days`} />
          <StatusChip label="Best" value={`${displayBestStreak} days`} />
          <StatusChip label="Rest" value={`${restTokenCost} coins`} />
        </div>
      </section>

      <section className="gameGrid">
        <ApartmentScene
          activeAnimation={activeAnimation}
          feedback={floatingFeedback}
          isRentPaid={isTodayRentPaid}
        />

        <aside className="rentPanel pixelPanel" aria-labelledby="rent-title">
          <div className="panelHeader">
            <p className="eyebrow">Today</p>
            <h2 id="rent-title">Rent Meter</h2>
          </div>
          <div className="rentStatus" aria-label="Rent status">
            <span>{todayRentPoints}</span>
            <small>/ {dailyRentTarget} pts</small>
          </div>
          <ProgressBar value={rentPercent} color="#58ff78" label="Rent progress" />
          <p className={`rentBadge${isTodayStreakCovered ? ' paid' : ''}`}>
            {isTodayRentPaid ? 'RENT PAID' : isTodayRested ? 'REST DAY' : 'Rent in progress'}
          </p>
          <div className="restTokenBox">
            <button type="button" onClick={handleUseRestToken} disabled={!canUseRestToken}>
              Buy Rest Day
            </button>
            <small>
              {isTodayStreakCovered
                ? 'Today is covered'
                : coinBalance >= restTokenCost
                  ? 'Spend coins to protect today'
                  : `${restTokenCost - coinBalance} coins short`}
            </small>
          </div>
        </aside>

        <section className="actions pixelPanel" aria-labelledby="actions-title">
          <div className="panelHeader">
            <p className="eyebrow">Quick Log</p>
            <h2 id="actions-title">Choose Activity</h2>
          </div>
          <div className="actionList">
            {quickActivities.map((activity) => (
              <ActivityButton
                key={activity.id}
                activity={activity}
                isSelected={selectedActivity?.id === activity.id}
                onSelect={handleActivitySelect}
              />
            ))}
          </div>
          {selectedActivity ? (
            <ActivityDurationCard
              activity={selectedActivity}
              key={selectedActivity.id}
              onCancel={() => setSelectedActivity(null)}
              onLog={handleActivityLog}
            />
          ) : null}
        </section>

        <section className="statsGrid" aria-label="Stats">
          {stats.map((stat) => (
            <StatCard key={stat.id} stat={stat} totalHours={statHoursById[stat.id]} totalXp={statXpById[stat.id]} />
          ))}
        </section>

        <QuestLog
          completedQuestIds={completedQuestIds}
          currentTime={currentTime}
          deadline={questDeadline}
          onQuestAdd={handleQuestAdd}
          onQuestRemove={handleQuestRemove}
          onQuestToggle={handleQuestToggle}
          quests={quests}
        />

        <section className="activityLog pixelPanel" aria-labelledby="log-title">
          <div className="panelHeader">
            <p className="eyebrow">Today</p>
            <h2 id="log-title">Activity Log</h2>
          </div>
          {todaysActivityEntries.length > 0 ? (
            <ol>
              {todaysActivityEntries.map((activity) => (
                <li key={activity.id}>
                  <span>
                    <strong>{activity.label}</strong>
                    <small>
                      +{activity.xp} XP ({formatHours(activity.hours)}) / +{activity.rentPoints} rent
                    </small>
                  </span>
                  <time dateTime={new Date(activity.timestamp).toISOString()}>{activity.timeLabel}</time>
                  <button className="undoButton" type="button" onClick={() => handleUndo(activity.id)}>
                    Undo
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="emptyLog">No activities logged yet today.</p>
          )}
        </section>

        <details className="savePanel pixelPanel">
          <summary>
            <span>
              <small className="eyebrow">Save File</small>
              <strong id="save-title">Import / Export</strong>
            </span>
          </summary>
          <div className="saveActions" aria-labelledby="save-title">
            <button type="button" onClick={handleExportSave}>
              Export
            </button>
            <button type="button" onClick={handleImportClick}>
              Import
            </button>
            <button className="dangerButton" type="button" onClick={handleResetSave}>
              Reset
            </button>
          </div>
          <input
            accept="application/json,.json"
            aria-label="Import save JSON"
            className="visuallyHidden"
            onChange={handleImportSave}
            ref={importInputRef}
            type="file"
          />
        </details>
      </section>
    </main>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="statusChip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function QuestLog({
  completedQuestIds,
  currentTime,
  deadline,
  onQuestAdd,
  onQuestRemove,
  onQuestToggle,
  quests,
}: {
  completedQuestIds: string[];
  currentTime: Date;
  deadline: Date;
  onQuestAdd: (label: string, deadlineAt: number | null) => void;
  onQuestRemove: (questId: string) => void;
  onQuestToggle: (questId: string) => void;
  quests: Quest[];
}) {
  const [newQuestLabel, setNewQuestLabel] = useState('');
  const [newQuestDeadline, setNewQuestDeadline] = useState('');
  const timeLeft = getCountdownParts(currentTime, deadline);
  const completedQuestIdSet = new Set(completedQuestIds);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newQuestLabel.trim()) {
      return;
    }

    const parsedDeadline = newQuestDeadline ? new Date(newQuestDeadline).getTime() : null;

    onQuestAdd(newQuestLabel, Number.isFinite(parsedDeadline) ? parsedDeadline : null);
    setNewQuestLabel('');
    setNewQuestDeadline('');
  }

  return (
    <details className="questPanel pixelPanel">
      <summary>
        <span>
          <small className="eyebrow">Quest Log</small>
          <strong>Every Second Counts</strong>
        </span>
      </summary>
      <div className="countdown" aria-label="Time until October 31, 2026">
        <span>{timeLeft.days}</span>
        <small>days</small>
        <span>{timeLeft.hours}</span>
        <small>hrs</small>
        <span>{timeLeft.minutes}</span>
        <small>min</small>
        <span>{timeLeft.seconds}</span>
        <small>sec</small>
      </div>
      <p className="questReward">Quest reward: +{questCompletionCoinReward} coins</p>
      <ul className="questList">
        {quests.map((quest) => (
          <li key={quest.id}>
            <label>
              <input
                checked={completedQuestIdSet.has(quest.id)}
                onChange={() => onQuestToggle(quest.id)}
                type="checkbox"
              />
              <span>
                <strong>{quest.label}</strong>
                {quest.deadlineAt ? (
                  <small className="questDeadline">{formatQuestCountdown(currentTime, quest.deadlineAt)}</small>
                ) : null}
              </span>
            </label>
            <button
              aria-label={`Remove ${quest.label}`}
              className="questRemoveButton"
              type="button"
              onClick={() => onQuestRemove(quest.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form className="questAddForm" onSubmit={handleSubmit}>
        <input
          aria-label="New quest"
          onChange={(event) => setNewQuestLabel(event.target.value)}
          placeholder="Add a quest"
          type="text"
          value={newQuestLabel}
        />
        <input
          aria-label="Quest deadline"
          onChange={(event) => setNewQuestDeadline(event.target.value)}
          type="datetime-local"
          value={newQuestDeadline}
        />
        <button type="submit">Add</button>
      </form>
    </details>
  );
}

function ApartmentScene({
  activeAnimation,
  feedback,
  isRentPaid,
}: {
  activeAnimation: SpriteAnimationId;
  feedback: FloatingFeedback | null;
  isRentPaid: boolean;
}) {
  return (
    <section className={`apartment pixelPanel${isRentPaid ? ' rentPaid' : ''}`} aria-label="Pixel apartment">
      <div className="roomWall">
        <div className="window" />
        <div className="neonSign">Rent Board</div>
        <div aria-label="NYC map" className="nycMap" title="NYC map" />
        <figure className="wallQuote" aria-label="Apartment quote">
          <blockquote>"And now that you don't have to be perfect, you can be good."</blockquote>
          <figcaption>John Steinbeck</figcaption>
        </figure>
        <div aria-label="Bookshelf" className="roomItem bookshelf" title="Bookshelf" />
      </div>
      {feedback ? (
        <div className="floatingFeedback" key={feedback.id} aria-live="polite">
          {feedback.text}
        </div>
      ) : null}
      <Sprite animationId={activeAnimation} className="characterSprite" />
      <div className="desk">
        <span>Battle Station</span>
      </div>
      <div className="floorGlow" />
    </section>
  );
}

function ActivityButton({
  activity,
  isSelected,
  onSelect,
}: {
  activity: ActivityConfig;
  isSelected: boolean;
  onSelect: (activity: ActivityConfig) => void;
}) {
  return (
    <button
      className={`activityButton${isSelected ? ' selected' : ''}`}
      type="button"
      onClick={() => onSelect(activity)}
    >
      <Sprite animationId={activity.previewAnimation} className="activitySprite" />
      <span>
        <strong>{activity.label}</strong>
        <small>{formatHours(activity.suggestedHours)} suggested</small>
      </span>
    </button>
  );
}

function ActivityDurationCard({
  activity,
  onCancel,
  onLog,
}: {
  activity: ActivityConfig;
  onCancel: () => void;
  onLog: (activity: ActivityConfig, minutes: number) => void;
}) {
  const defaultMinutes = Math.round(activity.suggestedHours * 60);
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const [customMinutes, setCustomMinutes] = useState(`${defaultMinutes}`);
  const parsedCustomMinutes = Number(customMinutes);
  const isValidCustomMinutes =
    Number.isInteger(parsedCustomMinutes) &&
    parsedCustomMinutes >= minimumActivityMinutes &&
    parsedCustomMinutes <= maximumActivityMinutes;
  const canLog =
    isValidCustomMinutes && selectedMinutes >= minimumActivityMinutes && selectedMinutes <= maximumActivityMinutes;

  function handlePresetClick(minutes: number) {
    setSelectedMinutes(minutes);
    setCustomMinutes(`${minutes}`);
  }

  function handleCustomMinutesChange(value: string) {
    setCustomMinutes(value);

    const minutes = Number(value);

    if (Number.isInteger(minutes)) {
      setSelectedMinutes(minutes);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canLog) {
      return;
    }

    onLog(activity, selectedMinutes);
  }

  return (
    <form className="activityDurationCard" onSubmit={handleSubmit}>
      <div className="durationHeader">
        <span>
          <small className="eyebrow">Selected</small>
          <strong>{activity.label}</strong>
        </span>
        <button className="durationCancelButton" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <div className="durationPresetList" aria-label="Activity duration presets">
        {activityDurationPresets.map((minutes) => (
          <button
            className={selectedMinutes === minutes ? 'selected' : ''}
            key={minutes}
            type="button"
            onClick={() => handlePresetClick(minutes)}
          >
            {formatMinutes(minutes)}
          </button>
        ))}
      </div>
      <label className="customDurationField">
        <span>Custom minutes</span>
        <input
          aria-invalid={!isValidCustomMinutes}
          inputMode="numeric"
          min={minimumActivityMinutes}
          max={maximumActivityMinutes}
          onChange={(event) => handleCustomMinutesChange(event.target.value)}
          step={1}
          type="number"
          value={customMinutes}
        />
      </label>
      {!isValidCustomMinutes ? (
        <p className="durationError">
          Enter {minimumActivityMinutes}-{maximumActivityMinutes} minutes.
        </p>
      ) : null}
      <button className="durationLogButton" type="submit" disabled={!canLog}>
        Log Activity
      </button>
    </form>
  );
}

function Sprite({ animationId, className }: { animationId: SpriteAnimationId; className: string }) {
  const animation = spriteAnimations[animationId];
  const rowPosition = (animation.row / (spriteFrame.rows - 1)) * 100;
  const spriteStyle = {
    '--sprite-sheet': `url(${characterSpriteSheetPath})`,
    '--sprite-row': `${rowPosition}%`,
    '--sprite-frames': animation.frames,
  } as CSSProperties;

  return <div className={className} role="img" aria-label={animation.label} style={spriteStyle} />;
}

function StatCard({ stat, totalHours, totalXp }: { stat: StatConfig; totalHours: number; totalXp: number }) {
  const progress = getLevelProgress(totalXp);

  return (
    <details className="statCard pixelPanel">
      <summary className="statSummary">
        <div className="statTop">
          <span className="statIcon" style={{ '--accent': stat.color } as CSSProperties}>
            {stat.icon}
          </span>
          <div>
            <h3>{stat.name}</h3>
            <p>Level {progress.level}</p>
          </div>
        </div>
        <ProgressBar value={progress.percent} color={stat.color} label={`${stat.name} XP progress`} />
        <div className="statMeta">
          <span>
            {progress.progressXp}/{progress.neededXp} XP
          </span>
          <span>{totalXp} total XP</span>
        </div>
      </summary>
      <p className="statHours">{formatHours(totalHours)} tracked</p>
    </details>
  );
}

function ProgressBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} role="meter">
      <span style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

function formatHours(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hr`;
}

function formatMinutes(minutes: number): string {
  return minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`;
}

function getCountdownParts(currentTime: Date, deadline: Date) {
  const remainingMilliseconds = Math.max(0, deadline.getTime() - currentTime.getTime());
  const totalSeconds = Math.floor(remainingMilliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours: `${hours}`.padStart(2, '0'),
    minutes: `${minutes}`.padStart(2, '0'),
    seconds: `${seconds}`.padStart(2, '0'),
  };
}

function formatQuestCountdown(currentTime: Date, deadlineAt: number): string {
  const deadline = new Date(deadlineAt);
  const timeLeft = getCountdownParts(currentTime, deadline);
  const isDone = deadlineAt <= currentTime.getTime();

  if (isDone) {
    return 'Deadline reached';
  }

  return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`;
}

export default App;
