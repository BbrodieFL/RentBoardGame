# Agent Notes

This is a personal local-first React game for turning real daily activity into an RPG feedback loop. Treat the project as both a game and a learning environment. The user cares about understanding the code, not just receiving finished output.

## Project Intent

The player is a pixel-art version of Oliver Tyrone living in a small apartment. Productive real-life activities are logged as game actions. Activities grant XP, contribute to paying the day's metaphorical rent, maintain streaks, and award coins.

The project is influenced by C. Thi Nguyen's *Games and the Art of Agency*: the game lets the user temporarily assume the character of the engineer, athlete, and reader they want to become.

See also:

- `ProjectRequirments.MD` for the original product spec.
- `ProjectRules.MD` for the learning/collaboration mode.
- `EngineeringQuests.MD` for the longer-term "fun engineering" roadmap, including a possible C++ API quest.

## Current Stack

- React
- TypeScript
- Vite
- Vitest
- Browser `localStorage` persistence

Useful commands:

```bash
npm run dev
npm test
npm run build
```

## Important Files

- `src/App.tsx`: main UI and event handlers.
- `src/gameActions.ts`: domain actions that apply game transactions to a save.
- `src/gameConfig.ts`: activities, stats, rewards, rent target, rest-token cost, sprite config.
- `src/gameMath.ts`: level, rent, rest-token, and streak rules.
- `src/storage.ts`: save loading, saving, schema version, and normalization.
- `src/gameTypes.ts`: core data types.
- `src/styles.css`: pixel arcade presentation.
- `public/assets/oliver-sprite-sheet.png`: current character sprite sheet.

## Data Principles

Log facts first. Derive status from facts.

Facts:

- `activityEntries`
- `dailyRentResults`
- `restTokenUses`
- `quests`
- `completedQuestIds`

Derived values:

- today's rent points
- rent-paid status
- current streak
- best streak
- stat totals
- levels and XP progress

Do not reintroduce trusted saved counters for streaks. `currentStreak` and `bestStreak` may still exist in the save shape for compatibility, but the application should derive the displayed values from rent/rest facts.

## Streak and Rest Token Rules

The streak counts paid-rent days.

Rest-token days protect the streak but do not increment it:

- Paid rent day: streak count increases.
- Rest token day: streak remains alive, count stays the same.
- Missed day with no rent and no rest token: streak breaks.

The rest token cost is derived in `gameConfig.ts` as three rent-paid rewards:

```ts
restTokenCost = dailyRentCoinReward * 3
```

## Save Data

The app is currently local-first and browser-only. Persistence is handled by `src/storage.ts` using `localStorage`.

Save behavior should remain forgiving:

- Include a schema version.
- Normalize imported or older saves.
- Drop malformed records instead of crashing.
- Preserve earned progress when possible.

## Development Guidance

- Inspect existing files before changing behavior.
- Keep changes scoped and understandable.
- Prefer small, named game-rule functions in `gameMath.ts` over hiding rules in JSX.
- Put tunable values in `gameConfig.ts`.
- Avoid adding large abstractions before they are needed.
- When changing game rules, add or update focused tests.
- Run `npm test` and `npm run build` before reporting completion when code changes are made.

## UX Guidance

The UI should feel like a colorful local RPG, not a generic productivity dashboard.

- Keep the pixel/arcade visual language.
- Keep actions fast to use.
- Make state changes immediately visible.
- Avoid harsh punishment mechanics.
- Recovery should be supported, not treated as failure.

## Learning Guidance

The user is learning React, TypeScript, C++, and API design through this project. When explaining changes, prefer plain language about:

- where state lives
- what is stored versus derived
- how data moves through the app
- why a rule belongs in `gameMath.ts`, `storage.ts`, or `gameConfig.ts`

Do not overbuild. The project is personal, playful, and intentionally shaped around learning.
