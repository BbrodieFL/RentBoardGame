# Game Assets

## Current Character Assets

- `OliverTyroneSprites.png` is the original source atlas.
- `oliver-sprite-sheet.png` is the normalized game sprite sheet used by React.
- `oliver-sprite-sheet.txt` documents the row order and frame size.
- `placeholder-character.svg` is the old temporary placeholder.

The app reads the sprite sheet path and animation rows from `src/gameConfig.ts`.

## Sprite Sheet Layout

Each frame is `160x220`.

Rows:

1. idleDown
2. walkDown
3. walkLeft
4. walkRight
5. walkUp
6. coding
7. running
8. reading
9. celebrate
