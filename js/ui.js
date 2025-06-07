import { Game } from './game.js';
import { toggleSoundEnabled, isSoundEnabled, initAudio } from './audio.js';
import {
  loadHighScores,
  addHighScore,
  qualifiesForHighScore,
  DISPLAY_HIGH_SCORE_COUNT,
} from './scores.js';

const game = new Game();
let dragStart = null;
const boardEl = document.getElementById('game');

function updateBackground() {
  const hue = (game.level * 40) % 360;
  const nextHue = (hue + 60) % 360;
  document.body.style.background = `linear-gradient(135deg, hsl(${hue},70%,70%), hsl(${nextHue},70%,60%))`;
}

function updateUI() {
  document.getElementById('level').textContent = `Level: ${game.level}`;
  document.getElementById('score').textContent = `Score: ${Math.floor(game.totalScore)}`;
  const rem = Math.max(0, game.getThreshold() - game.levelScore);
  document.getElementById('remaining').textContent = `Next in: ${Math.ceil(rem)}`;
  const threshold = game.getThreshold();
  const percent = Math.min(100, (game.levelScore / threshold) * 100);
  const bar = document.querySelector('#progress .bar');
  if (bar) bar.style.width = `${percent}%`;
  const shufEl = document.getElementById('shuffles');
  if (shufEl) shufEl.textContent = `Shuffles: ${game.shuffles}`;
}

function renderBoard() {
  const g = boardEl;
  g.style.gridTemplateColumns = `repeat(${game.boardCols},60px)`;
  g.style.gridTemplateRows = `repeat(${game.boardRows},60px)`;

  if (g.childElementCount !== game.boardRows * game.boardCols) {
    g.innerHTML = '';
    for (let r = 0; r < game.boardRows; r++) {
      for (let c = 0; c < game.boardCols; c++) {
        const cell = document.createElement('div');
        cell.className = 'tile';
        cell.dataset.row = r;
        cell.dataset.col = c;
        g.appendChild(cell);
      }
    }
  }

  const cells = g.children;
  for (let i = 0; i < cells.length; i++) {
    cells[i].classList.remove('fading', 'falling', 'hint', 'shake');
  }
  for (let r = 0; r < game.boardRows; r++) {
    for (let c = 0; c < game.boardCols; c++) {
      const cell = cells[r * game.boardCols + c];
      if (!cell) continue;
      cell.textContent = game.board[r][c] || '';
      cell.classList.toggle(
        'selected',
        !!(
          game.selectedTile &&
          game.selectedTile.r === r &&
          game.selectedTile.c === c
        )
      );
    }
  }
  updateUI();
  if (!game.gameOver && !game.findHint()) {
    if (game.shuffles > 0) {
      showShufflePrompt();
      return;
    }
    showGameOver();
  }
}

function resetHint() {
  game.resetHintTimer(() => game.showHint(renderBoard));
}

function handleClick(r, c) {
  game.handleClick(
    r,
    c,
    renderBoard,
    resetHint,
    () =>
      game.processMatches(
        updateUI,
        renderBoard,
        game.launchConfetti.bind(game),
        updateBackground,
        resetHint
      )
  );
}

function onBoardPointerDown(e) {
  if (game.gameOver) return;
  const tile = e.target.closest('.tile');
  if (!tile) return;
  dragStart = { r: Number(tile.dataset.row), c: Number(tile.dataset.col) };
}

function onBoardPointerUp(e) {
  if (!dragStart) return;
  const tile = e.target.closest('.tile');
  const { r: sr, c: sc } = dragStart;
  dragStart = null;
  if (!tile) return;
  const r = Number(tile.dataset.row);
  const c = Number(tile.dataset.col);
  handleClick(sr, sc);
  if ((sr !== r || sc !== c) && Math.abs(sr - r) + Math.abs(sc - c) === 1) {
    handleClick(r, c);
  }
}

function populateScores(listEl, limit = DISPLAY_HIGH_SCORE_COUNT) {
  const scores = loadHighScores();
  listEl.innerHTML = '';
  scores.slice(0, limit).forEach((s) => {
    const lvl = s.level !== undefined ? s.level : '?';
    const li = document.createElement('li');
    li.textContent = `${s.name}: ${s.score} (Level ${lvl})`;
    listEl.appendChild(li);
  });
}

function submitScore() {
  const input = document.getElementById('player-name');
  const name = input.value.trim() || 'Anonymous';
  addHighScore(name, Math.floor(game.totalScore), game.level);
  input.value = '';
  restartGame();
  showScores();
}

function showScores() {
  const overlay = document.getElementById('scores-overlay');
  const list = document.getElementById('scores-list');
  populateScores(list, DISPLAY_HIGH_SCORE_COUNT);
  overlay.classList.add('visible');
}

function closeScores() {
  document.getElementById('scores-overlay').classList.remove('visible');
}

function updateSoundToggle() {
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = isSoundEnabled() ? '🔊' : '🔇';
}

function toggleSound() {
  toggleSoundEnabled();
  updateSoundToggle();
}

function showGameOver() {
  game.gameOver = true;
  clearTimeout(game.hintTimeout);
  const scoreVal = Math.floor(game.totalScore);
  const qualifies = qualifiesForHighScore(scoreVal);
  if (qualifies) {
    populateScores(
      document.getElementById('scores-list-gameover'),
      DISPLAY_HIGH_SCORE_COUNT
    );
    const entry = document.getElementById('name-entry');
    if (entry) entry.style.display = '';
    document.getElementById('gameover-overlay').classList.add('visible');
    document.getElementById('player-name').focus();
  } else {
    const entry = document.getElementById('name-entry');
    if (entry) entry.style.display = 'none';
    restartGame();
    showScores();
  }
}

function showShufflePrompt() {
  const text = document.getElementById('shuffle-text');
  if (text)
    text.textContent = `No moves left! Use a shuffle to continue? (${game.shuffles} available)`;
  document.getElementById('shuffle-overlay').classList.add('visible');
  clearTimeout(game.hintTimeout);
  game.gameOver = true;
}

function hideShufflePrompt() {
  document.getElementById('shuffle-overlay').classList.remove('visible');
}

export async function startGame() {
  document.getElementById('tutorial-overlay').classList.remove('visible');
  if (typeof Tone !== 'undefined') {
    await Tone.start();
  }
  initAudio();
  restartGame();
}

export function restartGame() {
  document.getElementById('gameover-overlay').classList.remove('visible');
  document.getElementById('shuffle-overlay').classList.remove('visible');
  game.resetGame();
  updateBackground();
  renderBoard();
  resetHint();
  setTimeout(
    () =>
      game.processMatches(
        updateUI,
        renderBoard,
        game.launchConfetti.bind(game),
        updateBackground,
        resetHint
      ),
    300
  );
}

updateSoundToggle();
document.getElementById('sound-toggle').onclick = toggleSound;
document.getElementById('shuffle-use').onclick = () => {
  hideShufflePrompt();
  game.shuffles--;
  game.gameOver = false;
  game.shuffleBoard(updateUI, renderBoard, resetHint, updateBackground);
};
document.getElementById('shuffle-end').onclick = () => {
  hideShufflePrompt();
  showGameOver();
};

boardEl.addEventListener('pointerdown', onBoardPointerDown);
boardEl.addEventListener('pointerup', onBoardPointerUp);

// Initial setup
game.resetGame();
renderBoard();
resetHint();
setTimeout(
  () =>
    game.processMatches(
      updateUI,
      renderBoard,
      game.launchConfetti.bind(game),
      updateBackground,
      resetHint
    ),
  300
);
updateBackground();

// Expose for HTML inline handlers
window.startGame = startGame;
window.submitScore = submitScore;
window.showScores = showScores;
window.closeScores = closeScores;
