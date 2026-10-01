# Architecture

This document is for future-you making changes without needing an assistant.

The app is a local-first React game. React renders the screen, game actions apply transactions, game math calculates rules, and storage saves the resulting facts.

## Mental Model

```txt
User clicks something
  -> App.tsx handler
    -> gameActions.ts function
      -> gameMath.ts helpers
        -> next GameSave
          -> storage.ts persists to localStorage
```

`App.tsx` should answer: "What is on screen, and what happened in the UI?"

`gameActions.ts` should answer: "Given the current save and a player action, what is the next save?"

`gameMath.ts` should answer: "How do the game rules calculate one specific thing?"

`storage.ts` should answer: "How do we load, normalize, and save data safely?"

## Stored Facts vs Derived Status

Store facts. Derive status.

Stored facts:

- `activityEntries`
- `dailyRentResults`
- `restTokenUses`
- `quests`
- `completedQuestIds`
- `coinBalance`
- `settings`

Derived status:

- today's rent points
- whether today's rent is paid
- current streak
- best streak
- stat XP totals
- stat hour totals
- level progress

This matters because derived values can be recalculated when the rules change. Do not make saved counters the source of truth for streaks or levels.

## File Responsibilities

### `src/App.tsx`

The main React screen.

Change this when:

- adding UI controls
- changing layout
- changing visible labels
- connecting a button/form to an existing game action

Avoid putting game rules here. If a handler starts calculating coins, streaks, XP, or save updates directly, that logic probably belongs in `gameActions.ts` or `gameMath.ts`.

### `src/gameActions.ts`

The transaction layer for player actions.

Change this when:

- a click/form should update the save
- adding a new player action
- changing what happens when an activity is logged
- changing quest creation/completion behavior
- changing rest-token spending behavior

Examples:

- `logActivity(save, activity, hours, now)`
- `undoActivity(save, entryId)`
- `useRestToken(save, todayDate, now)`
- `addQuest(save, label, now)`
- `toggleQuestCompletion(save, questId)`

### `src/gameMath.ts`

Small rule/calculation helpers.

Change this when:

- changing rent-paid logic
- changing streak logic
- changing level progress
- adding a calculation that should be easy to test without React

Examples:

- `getRentPointsForDate(...)`
- `isRentPaidForDate(...)`
- `getCurrentStreak(...)`
- `getBestStreak(...)`

### `src/gameConfig.ts`

Tunable game data.

Change this when:

- adding a stat
- adding a quick activity
- changing rent target
- changing coin reward
- changing rest-token cost rule
- changing sprite animation config
- changing starter quests

### `src/storage.ts`

Save-file boundary.

Change this when:

- adding a new saved field
- changing schema version
- normalizing old/malformed saves
- changing localStorage key
- preparing to swap persistence later

If the save shape changes, update:

- `GameSave`
- `currentSchemaVersion`
- `createDefaultSave`
- `normalizeGameSave`
- storage tests

### `src/gameTypes.ts`

Shared domain types.

Change this when adding a new kind of saved record or changing the shape of an existing one.

### `src/styles.css`

Visual presentation.

Change this when adjusting layout, colors, responsive behavior, or pixel panel styling.

## Common Change Recipes

### Add A New Stat

1. Add the stat ID to `StatId` in `src/gameConfig.ts`.
2. Add an entry to `stats`.
3. Add one or more `quickActivities` that use the new stat.
4. Run `npm test`.
5. Run `npm run build`.

The stats UI should render it automatically.

### Add A New Quick Activity

1. Add an entry to `quickActivities` in `src/gameConfig.ts`.
2. Choose `statId`, `suggestedHours`, `xpPerHour`, `rentPoints`, and `previewAnimation`.
3. Run tests/build.

The activity button should appear automatically.

### Change Activity Rewards

Edit `quickActivities` in `src/gameConfig.ts`.

Reward calculation for variable durations lives in `calculateActivityReward(...)` in `src/gameActions.ts`.

### Add A New Player Action

1. Add a function to `src/gameActions.ts`.
2. Make it accept a `GameSave` and return the next `GameSave` or `GameActionResult`.
3. Add tests in `src/gameActions.test.ts`.
4. Call it from `App.tsx`.

### Add A Saved Field

1. Add the type in `src/gameTypes.ts` if needed.
2. Add the field to `GameSave` in `src/storage.ts`.
3. Bump `currentSchemaVersion`.
4. Add a default value in `createDefaultSave`.
5. Normalize old/malformed data in `normalizeGameSave`.
6. Update storage tests.

### Change Streak Rules

1. Update `getCurrentStreak` and/or `getBestStreak` in `src/gameMath.ts`.
2. Add focused tests in `src/gameMath.test.ts`.
3. Make sure rest-token days still protect but do not increment the streak unless intentionally changing that rule.

## Current Rest Rule

- Paid rent day: increments streak.
- Rest-token day: protects streak but does not increment it.
- Missed day with neither: breaks streak.

## Current Quest Rule

- Quests are saved records.
- Starter quests are merged into saves during normalization.
- Completed quests are stored separately as `completedQuestIds`.
- Unknown quest IDs should not be toggled complete.

## Verification

After code changes:

```bash
npm test
npm run build
```

For UI changes, also run:

```bash
npm run dev
```

Then click through the affected flow manually.
