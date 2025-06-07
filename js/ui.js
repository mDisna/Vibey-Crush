import {
  level,
  levelScore,
  totalScore,
  boardRows,
  boardCols,
  board,
  selectedTile,
  gameOver,
  hintTimeout,
  shuffles,
  handleClick as gameHandleClick,
  processMatches,
  findHint,
  launchConfetti,
  shuffleBoard,
  resetHintTimer as gameResetHintTimer,
  showHint as gameShowHint,
  resetGame
} from './game.js';
import {
  toggleSoundEnabled,
  isSoundEnabled
} from './audio.js';
import {
  loadHighScores,
  addHighScore,
  qualifiesForHighScore,
  DISPLAY_HIGH_SCORE_COUNT
} from './scores.js';

let dragStart = null;

function updateBackground() {
  const hue = (level * 40) % 360;
  const nextHue = (hue + 60) % 360;
  document.body.style.background = `linear-gradient(135deg, hsl(${hue},70%,70%), hsl(${nextHue},70%,60%))`;
}

function getThreshold(lv) {
  const raw = 15 * (lv / 2);
  return Math.ceil(raw / 5) * 5;
}

function updateUI() {
  document.getElementById('level').textContent = `Level: ${level}`;
  document.getElementById('score').textContent = `Score: ${Math.floor(totalScore)}`;
  const rem = Math.max(0, getThreshold(level) - levelScore);
  document.getElementById('remaining').textContent = `Next in: ${Math.ceil(rem)}`;
  const threshold = getThreshold(level);
  const percent = Math.min(100, (levelScore / threshold) * 100);
  const bar = document.querySelector('#progress .bar');
  if (bar) bar.style.width = `${percent}%`;
  const shufEl = document.getElementById('shuffles');
  if (shufEl) shufEl.textContent = `Shuffles: ${shuffles}`;
}

function renderBoard() {
  const game = document.getElementById('game');
  game.style.gridTemplateColumns = `repeat(${boardCols},60px)`;
  game.style.gridTemplateRows = `repeat(${boardRows},60px)`;
  game.innerHTML = '';
  for (let r = 0; r < boardRows; r++) {
    for (let c = 0; c < boardCols; c++) {
      const cell = document.createElement('div');
      cell.className = 'tile';
      cell.textContent = board[r][c] || '';
      if (selectedTile && selectedTile.r === r && selectedTile.c === c)
        cell.classList.add('selected');
      if (!gameOver) {
        cell.onpointerdown = () => {
          dragStart = { r, c };
        };
        cell.onpointerup = () => {
          if (dragStart) {
            const { r: sr, c: sc } = dragStart;
            dragStart = null;
            handleClick(sr, sc);
            if ((sr !== r || sc !== c) && Math.abs(sr - r) + Math.abs(sc - c) === 1) {
              handleClick(r, c);
            }
          }
        };
      }
      game.appendChild(cell);
    }
  }
  updateUI();
  if (!gameOver && !findHint()) {
    if (shuffles > 0) {
      showShufflePrompt();
      return;
    }
    showGameOver();
  }
}

function resetHint() {
  gameResetHintTimer(() => gameShowHint(renderBoard));
}

function handleClick(r, c) {
  gameHandleClick(
    r,
    c,
    renderBoard,
    resetHint,
    () => processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHint)
  );
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
  addHighScore(name, Math.floor(totalScore), level);
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
  gameOver = true;
  clearTimeout(hintTimeout);
  const scoreVal = Math.floor(totalScore);
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
    text.textContent = `No moves left! Use a shuffle to continue? (${shuffles} available)`;
  document.getElementById('shuffle-overlay').classList.add('visible');
  clearTimeout(hintTimeout);
  gameOver = true;
}

function hideShufflePrompt() {
  document.getElementById('shuffle-overlay').classList.remove('visible');
}

export function startGame() {
  document.getElementById('tutorial-overlay').classList.remove('visible');
  if (typeof Tone !== 'undefined') Tone.start();
  restartGame();
}

export function restartGame() {
  document.getElementById('gameover-overlay').classList.remove('visible');
  document.getElementById('shuffle-overlay').classList.remove('visible');
  resetGame();
  updateBackground();
  renderBoard();
  resetHint();
  setTimeout(() => processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHint), 300);
}

updateSoundToggle();
document.getElementById('sound-toggle').onclick = toggleSound;
document.getElementById('shuffle-use').onclick = () => {
  hideShufflePrompt();
  shuffles--;
  gameOver = false;
  shuffleBoard(updateUI, renderBoard, resetHint);
};
document.getElementById('shuffle-end').onclick = () => {
  hideShufflePrompt();
  showGameOver();
};

// Initial setup
resetGame();
renderBoard();
resetHint();
setTimeout(() => processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHint), 300);
updateBackground();

// Expose for HTML inline handlers
window.startGame = startGame;
window.submitScore = submitScore;
window.showScores = showScores;
window.closeScores = closeScores;
