# Oliver Tyrone Game

A local-first React RPG for turning daily productive activity into a game loop.

This is a personal game about becoming the engineer, athlete, and reader I want to be. Real activities are logged as in-game actions: they grant XP, contribute to paying the day's metaphorical rent, maintain streaks, and earn coins.

## The Loop

1. Do meaningful work in real life.
2. Log the activity in the game.
3. Gain XP in the matching stat.
4. Add points toward today's rent.
5. Pay rent to protect the streak and earn coins.
6. Spend coins on recovery or future upgrades.

"Rent" is not real money. It means doing enough meaningful work for the day.

## Current Features

- Quick activity logging for coding, running/workout, reading, and writing.
- Duration selection with presets and custom minutes before logging an activity.
- Activity logging logic is separated from the UI through game actions.
- XP, levels, and stat progress.
- Daily rent meter.
- Coins awarded once when rent is paid.
- Rest days bought with coins.
- Rest days protect a streak without increasing it.
- Current and best streaks derived from rent/rest records.
- Persistent quest checklist with custom quest creation.
- Local browser persistence.
- JSON export/import/reset.
- Pixel apartment and character presentation.

## Current Architecture

The app is still browser-only, but the game rules are being separated from the React UI.

The basic shape is:

```txt
React UI
  -> game actions
    -> game math
      -> updated save object
        -> localStorage
```

`src/App.tsx` should mostly handle UI state, rendering, clicks, and feedback.

`src/gameActions.ts` owns game transactions:

- log an activity
- create activity entries
- calculate activity rewards from duration
- award rent coins once
- undo activity entries
- spend rest tokens
- add custom quests
- toggle quest completion

`src/gameMath.ts` owns smaller rules and calculations:

- rent totals
- rent-paid checks
- streak calculation
- rest-token date checks
- level progress

This separation makes it easier to add new input UIs without duplicating game rules.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build for production:

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Important Files

- `src/App.tsx`: main game screen and event handlers.
- `src/gameActions.ts`: game actions for logging activities, undoing entries, using rest tokens, and toggling quests.
- `src/gameConfig.ts`: stats, quick activities, rent target, coin rewards, rest-token cost, and sprite config.
- `src/gameMath.ts`: leveling, rent, rest-token, and streak rules.
- `src/storage.ts`: local save loading, saving, schema versioning, and normalization.
- `src/gameTypes.ts`: shared game data types.
- `src/styles.css`: pixel arcade visual styling.
- `ARCHITECTURE.md`: where to make changes and how the modules fit together.
- `public/assets/oliver-sprite-sheet.png`: current character sprite sheet.
- `EngineeringQuests.MD`: future engineering quests, including the possible C++ API backend.

## Current Data Model

The app currently stores one versioned save object in browser `localStorage`.

Facts are stored:

- activity entries
- daily rent results
- rest-token uses
- quests
- completed quest IDs
- coin balance
- settings

Status is derived:

- today's rent points
- whether today's rent is paid
- current streak
- best streak
- stat totals
- level progress

## Rest Day Rule

Rest days are recovery insurance.

- Paying rent increments the streak.
- Buying a rest day protects the streak.
- A rest day does not increment the streak.
- Missing a day without rent or a rest day breaks the streak.

The rest day cost is currently three rent-paid days worth of coins.

## Activity Logging Flow

Activity logging is duration-based.

The flow is:

```txt
click activity
  -> choose or enter duration
  -> call logActivity(save, activity, hours)
```

Duration is collected as minutes in the UI and converted to hours when calling `logActivity(...)`.

The duration card does not show projected rewards. XP and rent feedback appears after logging.

## Save Data

The save is managed in `src/storage.ts`.

In the app, use the Save File panel to:

- export progress as JSON
- import a saved JSON file
- reset local progress after confirmation

## Project Notes

This project is not mainly about shipping software for other people. It is a fun engineering environment for building agency, learning React/TypeScript, and eventually exploring APIs and C++ through a game-shaped project.

Future direction lives in `EngineeringQuests.MD`.
