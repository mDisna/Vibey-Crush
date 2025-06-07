const tileTypes = ["💎", "🔶", "🔷", "🔴", "🟢", "🟣"];
let level = 1,
  levelScore = 0,
  totalScore = 0;
let boardRows = 5,
  boardCols = 5,
  board = [];
let selectedTile = null,
  gameOver = false,
  hintTimeout;
let dragStart = null;
let cascadeCount = 1;
let shuffles = 0;
let shufflesEarned = 0;
const HIGH_SCORES_KEY = "vibey_high_scores";
const SOUND_ENABLED_KEY = "vibey_sound_enabled";
let soundEnabled = true;
try {
  const saved = localStorage.getItem(SOUND_ENABLED_KEY);
  if (saved !== null) soundEnabled = saved === "true";
} catch {}

// Tone.js setup
let synth = null;
const notes = ["C4", "D4", "E4", "G4", "A4", "B4", "C5"];
if (typeof Tone !== "undefined") {
  synth = new Tone.Synth().toDestination();
}

function playRandomTone() {
  if (!synth || !soundEnabled) return;
  const note = notes[Math.floor(Math.random() * notes.length)];
  synth.triggerAttackRelease(note, "8n");
}

function playJingle() {
  if (!synth || !soundEnabled) return;
  synth.triggerAttackRelease("C5", "8n");
  setTimeout(() => synth.triggerAttackRelease("E5", "8n"), 150);
  setTimeout(() => synth.triggerAttackRelease("G5", "8n"), 300);
}

function checkShuffleAward() {
  const earned = Math.floor(totalScore / 100);
  if (earned > shufflesEarned) {
    shuffles += earned - shufflesEarned;
    shufflesEarned = earned;
    playJingle();
    updateUI();
  }
}

function getThreshold(lv) {
  const raw = 15 * (lv / 2);
  return Math.ceil(raw / 5) * 5;
}
function getRandomTile() {
  return tileTypes[Math.floor(Math.random() * tileTypes.length)];
}

function updateBackground() {
  const hue = (level * 40) % 360;
  const nextHue = (hue + 60) % 360;
  document.body.style.background = `linear-gradient(135deg, hsl(${hue},70%,70%), hsl(${nextHue},70%,60%))`;
}

function updateUI() {
  document.getElementById("level").textContent = `Level: ${level}`;
  document.getElementById("score").textContent = `Score: ${Math.floor(
    totalScore
  )}`;
  const rem = Math.max(0, getThreshold(level) - levelScore);
  document.getElementById("remaining").textContent = `Next in: ${Math.ceil(
    rem
  )}`;
  const threshold = getThreshold(level);
  const percent = Math.min(100, (levelScore / threshold) * 100);
  const bar = document.querySelector("#progress .bar");
  if (bar) bar.style.width = `${percent}%`;
  const shufEl = document.getElementById("shuffles");
  if (shufEl) shufEl.textContent = `Shuffles: ${shuffles}`;
}

function generateBoard() {
  const b = [];
  for (let r = 0; r < boardRows; r++) {
    b[r] = [];
    for (let c = 0; c < boardCols; c++) {
      let t;
      do {
        t = getRandomTile();
      } while (isMatch(b, r, c, t));
      b[r][c] = t;
    }
  }
  return b;
}

function isMatch(b, r, c, t) {
  return (
    (c >= 2 && b[r][c - 1] === t && b[r][c - 2] === t) ||
    (r >= 2 && b[r - 1][c] === t && b[r - 2][c] === t)
  );
}

function renderBoard() {
  const game = document.getElementById("game");
  game.style.gridTemplateColumns = `repeat(${boardCols},60px)`;
  game.style.gridTemplateRows = `repeat(${boardRows},60px)`;
  game.innerHTML = "";
  for (let r = 0; r < boardRows; r++) {
    for (let c = 0; c < boardCols; c++) {
      const cell = document.createElement("div");
      cell.className = "tile";
      cell.textContent = board[r][c] || "";
      if (selectedTile && selectedTile.r === r && selectedTile.c === c)
        cell.classList.add("selected");
      if (!gameOver) {
        cell.onpointerdown = () => {
          dragStart = { r, c };
        };
        cell.onpointerup = () => {
          if (dragStart) {
            const { r: sr, c: sc } = dragStart;
            dragStart = null;
            handleClick(sr, sc);
            if (
              (sr !== r || sc !== c) &&
              Math.abs(sr - r) + Math.abs(sc - c) === 1
            ) {
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

function handleClick(r, c) {
  if (gameOver) return;
  resetHintTimer();
  if (!selectedTile) {
    cascadeCount = 1;
    selectedTile = { r, c };
    return renderBoard();
  }
  const { r: sr, c: sc } = selectedTile;
  if (sr === r && sc === c) {
    selectedTile = null;
    return renderBoard();
  }
  if (Math.abs(sr - r) + Math.abs(sc - c) === 1) {
    swap(sr, sc, r, c);
    if (hasMatch()) {
      selectedTile = null;
      renderBoard();
      setTimeout(processMatches, 100);
    } else {
      swap(sr, sc, r, c);
      selectedTile = null;
      renderBoard();
      shakeTiles([
        [sr, sc],
        [r, c],
      ]);
    }
  } else {
    selectedTile = { r, c };
  }
  renderBoard();
}

function swap(r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
}
function hasMatch() {
  return findAllMatches().length > 0;
}
function findAllMatches() {
  const m = [];
  for (let r = 0; r < boardRows; r++)
    for (let c = 0; c < boardCols - 2; c++)
      if (
        board[r][c] &&
        board[r][c] === board[r][c + 1] &&
        board[r][c] === board[r][c + 2]
      )
        m.push([r, c], [r, c + 1], [r, c + 2]);
  for (let c = 0; c < boardCols; c++)
    for (let r = 0; r < boardRows - 2; r++)
      if (
        board[r][c] &&
        board[r][c] === board[r + 1][c] &&
        board[r][c] === board[r + 2][c]
      )
        m.push([r, c], [r + 1, c], [r + 2, c]);
  return Array.from(new Set(m.map(JSON.stringify)), JSON.parse);
}

function findHint() {
  for (let r = 0; r < boardRows; r++)
    for (let c = 0; c < boardCols; c++)
      for (const [dr, dc] of [
        [1, 0],
        [0, 1],
      ]) {
        const nr = r + dr,
          nc = c + dc;
        if (nr < boardRows && nc < boardCols) {
          swap(r, c, nr, nc);
          const ok = hasMatch();
          swap(r, c, nr, nc);
          if (ok) return { r1: r, c1: c, r2: nr, c2: nc };
        }
      }
  return null;
}

function processMatches() {
  // Check for 5+ in a row
  for (let r = 0; r < boardRows; r++) {
    let run = 1;
    for (let c = 1; c <= boardCols; c++) {
      if (
        c < boardCols &&
        board[r][c] === board[r][c - 1] &&
        board[r][c] !== null
      ) {
        run++;
      } else if (run >= 5) {
        clearMany(Array.from({ length: boardCols }, (_, i) => [r, i]));
        return;
      } else {
        run = 1;
      }
    }
  }
  // Check for 5+ in a column
  for (let c = 0; c < boardCols; c++) {
    let run = 1;
    for (let r = 1; r <= boardRows; r++) {
      if (
        r < boardRows &&
        board[r][c] === board[r - 1][c] &&
        board[r][c] !== null
      ) {
        run++;
      } else if (run >= 5) {
        clearMany(Array.from({ length: boardRows }, (_, i) => [i, c]));
        return;
      } else {
        run = 1;
      }
    }
  }
  // Check for 4 in a row/column
  let toClear = [];
  // Rows
  for (let r = 0; r < boardRows; r++) {
    let run = 1;
    for (let c = 1; c <= boardCols; c++) {
      if (
        c < boardCols &&
        board[r][c] === board[r][c - 1] &&
        board[r][c] !== null
      ) {
        run++;
      } else if (run === 4) {
        for (let i = 0; i < boardCols; i++) toClear.push([r, i]);
        run = 1;
      } else {
        run = 1;
      }
    }
  }
  // Columns
  for (let c = 0; c < boardCols; c++) {
    let run = 1;
    for (let r = 1; r <= boardRows; r++) {
      if (
        r < boardRows &&
        board[r][c] === board[r - 1][c] &&
        board[r][c] !== null
      ) {
        run++;
      } else if (run === 4) {
        for (let i = 0; i < boardRows; i++) toClear.push([i, c]);
        run = 1;
      } else {
        run = 1;
      }
    }
  }
  if (toClear.length) {
    clearMany(toClear);
    return;
  }
  // Check for 3 in a row/column
  const triples = findAllMatches();
  if (triples.length) {
    clearMany(triples);
    return;
  }
  // No matches, render and schedule hint
  renderBoard();
}

function clearMany(cells) {
  playRandomTone();
  const base = cells.length;
  const bonus = (cascadeCount - 1) * 0.5;
  totalScore += base + bonus;
  levelScore += base + bonus;
  cascadeCount++;
  checkShuffleAward();

  let threshold = getThreshold(level);
  while (levelScore >= threshold) {
    levelScore -= threshold;
    level++;
    if (level % 5 === 0) boardCols = Math.min(boardCols + 1, 20);
    if (level % 10 === 0) boardRows = Math.min(boardRows + 1, 15);
    launchConfetti();
    updateBackground();
    threshold = getThreshold(level);
  }

  cells.forEach(([r, c]) =>
    document
      .querySelectorAll(".tile")
      [r * boardCols + c]?.classList.add("fading")
  );
  setTimeout(() => {
    cells.forEach(([r, c]) => (board[r][c] = null));
    refillBoard();
    setTimeout(processMatches, 500);
  }, 400);
}

function refillBoard() {
  const fall = [];
  for (let c = 0; c < boardCols; c++) {
    let empty = 0;
    for (let r = boardRows - 1; r >= 0; r--) {
      if (!board[r][c]) empty++;
      else if (empty > 0) {
        board[r + empty][c] = board[r][c];
        board[r][c] = null;
        fall.push({ from: r, to: r + empty, c });
      }
    }
    for (let r = 0; r < empty; r++) {
      board[r][c] = getRandomTile();
      fall.push({ from: -1 - r, to: r, c });
    }
  }
  renderBoard();
  requestAnimationFrame(() => {
    document.querySelectorAll(".tile").forEach((el, i) => {
      const f = fall[i];
      if (!f) return;
      const dist = (f.to - f.from) * 64;
      el.style.transform = `translateY(-${dist}px)`;
      el.classList.add("falling");
      setTimeout(() => (el.style.transform = ""), 20);
    });
  });
  resetHintTimer();
}

function shuffleBoard() {
  let attempts = 0;
  do {
    board = generateBoard();
    attempts++;
  } while (!findHint() && attempts < 10);
  renderBoard();
  resetHintTimer();
  setTimeout(processMatches, 300);
}

function launchConfetti() {
  const container = document.getElementById("confetti-container");
  for (let i = 0; i < 100; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = `hsl(${Math.random() * 360},80%,60%)`;
    el.style.animationDelay = `${Math.random()}s`;
    container.appendChild(el);
  }
  setTimeout(() => (container.innerHTML = ""), 2000);
}

function resetHintTimer() {
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(showHint, 10000);
}
function showHint() {
  const h = findHint();
  if (!h || gameOver) return;
  renderBoard();
  setTimeout(() => {
    document.querySelectorAll(".tile").forEach((el, i) => {
      if (i === h.r1 * boardCols + h.c1 || i === h.r2 * boardCols + h.c2)
        el.classList.add("hint");
    });
  }, 50);
}

function loadHighScores() {
  try {
    return JSON.parse(localStorage.getItem(HIGH_SCORES_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHighScores(scores) {
  localStorage.setItem(HIGH_SCORES_KEY, JSON.stringify(scores));
}

function addHighScore(name, score, reachedLevel) {
  const scores = loadHighScores();
  scores.push({ name, score, level: reachedLevel });
  scores.sort((a, b) => b.score - a.score);
  if (scores.length > 10) scores.length = 10;
  saveHighScores(scores);
}

function populateScores(listEl) {
  const scores = loadHighScores();
  listEl.innerHTML = scores
    .map((s) => {
      const lvl = s.level !== undefined ? s.level : "?";
      return `<li>${s.name}: ${s.score} (Level ${lvl})</li>`;
    })
    .join("");
}

function submitScore() {
  const input = document.getElementById("player-name");
  const name = input.value.trim() || "Anonymous";
  addHighScore(name, Math.floor(totalScore), level);
  input.value = "";
  restartGame();
  showScores();
}

function showScores() {
  const overlay = document.getElementById("scores-overlay");
  const list = document.getElementById("scores-list");
  populateScores(list);
  overlay.classList.add("visible");
}

function closeScores() {
  document.getElementById("scores-overlay").classList.remove("visible");
}

function updateSoundToggle() {
  const btn = document.getElementById("sound-toggle");
  if (btn) btn.textContent = soundEnabled ? "🔊" : "🔇";
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundToggle();
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, soundEnabled);
  } catch {}
}

function showGameOver() {
  gameOver = true;
  clearTimeout(hintTimeout);
  populateScores(document.getElementById("scores-list-gameover"));
  document.getElementById("gameover-overlay").classList.add("visible");
  document.getElementById("player-name").focus();
}

function showShufflePrompt() {
  const text = document.getElementById("shuffle-text");
  if (text)
    text.textContent = `No moves left! Use a shuffle to continue? (${shuffles} available)`;
  document.getElementById("shuffle-overlay").classList.add("visible");
  clearTimeout(hintTimeout);
  gameOver = true;
}

function hideShufflePrompt() {
  document.getElementById("shuffle-overlay").classList.remove("visible");
}

function startGame() {
  document.getElementById("tutorial-overlay").classList.remove("visible");
  if (typeof Tone !== "undefined") Tone.start();
  restartGame();
}
function restartGame() {
  document.getElementById("gameover-overlay").classList.remove("visible");
  document.getElementById("shuffle-overlay").classList.remove("visible");
  level = 1;
  levelScore = 0;
  totalScore = 0;
  boardRows = 5;
  boardCols = 5;
  gameOver = false;
  cascadeCount = 1;
  shuffles = 0;
  shufflesEarned = 0;
  updateBackground();
  board = generateBoard();
  renderBoard();
  resetHintTimer();
  setTimeout(processMatches, 300);
}

// Initial setup
board = generateBoard();
renderBoard();
resetHintTimer();
setTimeout(processMatches, 300);
updateBackground();

updateSoundToggle();
document.getElementById("sound-toggle").onclick = toggleSound;
document.getElementById("shuffle-use").onclick = () => {
  hideShufflePrompt();
  shuffles--;
  gameOver = false;
  shuffleBoard();
};
document.getElementById("shuffle-end").onclick = () => {
  hideShufflePrompt();
  showGameOver();
};

