# Vibey Crush

A vibrant, emoji-based match-3 browser game built with HTML, CSS, and JavaScript.

Completely vibe-coded to test AI capabilities using `ChatGPT o4-mini-high` (initial codebase) and `OpenAI Codex` (additional features and improvements).

**[Play the game here](https://github.com/mDisna/Vibey-Crush/deployments/github-pages)**

## Features

- **Dynamic Board**: Grid size grows every 5 levels.
- **Cascade Bonuses**: Earn 0.5 bonus points per consecutive cascade.
- **Special Clears**:
  - Match 4 to clear an entire row or column.
  - Match 5 or more to clear every tile on the board.
- **Level Progression**: Reach a threshold to level up, unlocking extra rows/columns and a confetti celebration.
- **Colourful Level Transitions**: Each new level smoothly changes the page background colour.
- **Hint System**: After 10 seconds of inactivity, tiles fade to gold indicating a possible move.
- **Tutorial & Game Over Overlays**: First-play guidance and custom end screen with restart.
- **Smooth Animations**: Tile swaps, falls, shakes, fades, and confetti.
- **High Scores**: Submit your name after game over to save your score and the level reached. View the top results via the trophy button.
- **Random Tones**: Each match plays a random note using Tone.js.
- **Shuffles**: Earn a shuffle every 100 points to continue when no moves remain.
- **Lock Tiles from Level 30**: After matches, new tiles have a small chance to be 🔒 locks. Locks block matches until cleared by a row/column or board clear.

## Getting Started

1. **Clone or Download** this repository.
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).

## How to Play

- **Swap** two adjacent tiles to match 3 or more identical emojis.
- **Clear** tiles to earn points and fill the board.
- **Cascades**: Trigger chain reactions for bonus points.
- **Level Up**: Earn enough points to advance levels and expand the board.
- **No Moves Left**: Game ends when no valid match is possible.
- **Use Shuffles**: If you have a shuffle available on game over, you can shuffle the board and keep playing.

## Running tests

Use `npm test` to run the Node-based unit tests:

```bash
npm test
```


## License

This project is licensed under the [MIT License](LICENSE).
