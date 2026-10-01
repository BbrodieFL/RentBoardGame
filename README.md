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

"Rent" is not real money. It means doing enough meaningful work for the day. If you know me, you know I like to earn them sunsets.


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

## Future plans
Currently, this game's data is persisted in the local browser with localStorage. I can see myself eventually hosting the game in the cloud so I can show friends what I have been building.

Separately from hosting, I want the persistence layer to have a clear boundary that can support different storage backends, including local browser storage now and a backend service later.
