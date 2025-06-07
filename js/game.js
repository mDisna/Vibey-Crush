import { playRandomTone, playJingle } from './audio.js';

export const tileTypes = ["💎", "🔶", "🔷", "🔴", "🟢", "🟣"];
export let level = 1,
  levelScore = 0,
  totalScore = 0;
export let boardRows = 5,
  boardCols = 5,
  board = [];
export let selectedTile = null,
  gameOver = false,
  hintTimeout;
export let cascadeCount = 1;
export let shuffles = 0;
let shufflesEarned = 0;

export function getThreshold(lv) {
  const raw = 15 * (lv / 2);
  return Math.ceil(raw / 5) * 5;
}

function getRandomTile() {
  return tileTypes[Math.floor(Math.random() * tileTypes.length)];
}

export function generateBoard() {
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

export function swap(r1, c1, r2, c2) {
  [board[r1][c1], board[r2][c2]] = [board[r2][c2], board[r1][c1]];
}

function hasMatch() {
  return findAllMatches().length > 0;
}

export function findAllMatches() {
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

export function findHint() {
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

export function handleClick(r, c, renderBoard, resetHint, processMatchesCb, shakeTiles) {
  if (gameOver) return;
  resetHint();
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
    if (findAllMatches().length > 0) {
      selectedTile = null;
      renderBoard();
      setTimeout(processMatchesCb, 100);
    } else {
      swap(sr, sc, r, c);
      selectedTile = null;
      renderBoard();
      if (shakeTiles) shakeTiles([
        [sr, sc],
        [r, c],
      ]);
    }
  } else {
    selectedTile = { r, c };
  }
  renderBoard();
}
function checkShuffleAward() {
  const earned = Math.floor(totalScore / 100);
  if (earned > shufflesEarned) {
    shuffles += earned - shufflesEarned;
    shufflesEarned = earned;
    playJingle();
    return true;
  }
  return false;
}

export function processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer) {
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
        clearMany(
          Array.from({ length: boardRows }, (_, rr) =>
            Array.from({ length: boardCols }, (_, cc) => [rr, cc])
          ).flat(),
          updateUI,
          renderBoard,
          launchConfetti,
          updateBackground,
          resetHintTimer
        );
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
        clearMany(
          Array.from({ length: boardRows }, (_, rr) =>
            Array.from({ length: boardCols }, (_, cc) => [rr, cc])
          ).flat(),
          updateUI,
          renderBoard,
          launchConfetti,
          updateBackground,
          resetHintTimer
        );
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
    clearMany(toClear, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
    return;
  }
  // Check for 3 in a row/column
  const triples = findAllMatches();
  if (triples.length) {
    clearMany(triples, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
    return;
  }
  // No matches, render and schedule hint
  renderBoard();
}

export function clearMany(cells, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer) {
  playRandomTone();
  const base = cells.length;
  const bonus = (cascadeCount - 1) * 0.5;
  totalScore += base + bonus;
  levelScore += base + bonus;
  cascadeCount++;
  const awarded = checkShuffleAward();
  if (awarded && updateUI) updateUI();

  const prevRows = boardRows;
  const prevCols = boardCols;

  let threshold = getThreshold(level);
  while (levelScore >= threshold) {
    levelScore -= threshold;
    level++;
    if (level % 5 === 0) boardCols = Math.min(boardCols + 1, 20);
    if (level % 10 === 0) boardRows = Math.min(boardRows + 1, 15);
    if (launchConfetti) launchConfetti();
    if (updateBackground) updateBackground();
    threshold = getThreshold(level);
  }

  if (boardCols > prevCols || boardRows > prevRows) {
    for (let r = 0; r < prevRows; r++)
      for (let c = prevCols; c < boardCols; c++)
        board[r][c] = getRandomTile();
    for (let r = prevRows; r < boardRows; r++) {
      board[r] = [];
      for (let c = 0; c < boardCols; c++) board[r][c] = getRandomTile();
    }
  }

  cells.forEach(([r, c]) =>
    document
      .querySelectorAll('.tile')[r * prevCols + c]?.classList.add('fading')
  );
  setTimeout(() => {
    cells.forEach(([r, c]) => (board[r][c] = null));
    refillBoard(updateUI, renderBoard, resetHintTimer);
    setTimeout(() => processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer), 500);
  }, 400);
}

export function refillBoard(updateUI, renderBoard, resetHintTimer) {
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
    document.querySelectorAll('.tile').forEach((el, i) => {
      const f = fall[i];
      if (!f) return;
      const dist = (f.to - f.from) * 64;
      el.style.transform = `translateY(-${dist}px)`;
      el.classList.add('falling');
      setTimeout(() => (el.style.transform = ''), 20);
    });
  });
  resetHintTimer();
}

export function shuffleBoard(updateUI, renderBoard, resetHintTimer) {
  let attempts = 0;
  do {
    board = generateBoard();
    attempts++;
  } while (!findHint() && attempts < 10);
  renderBoard();
  resetHintTimer();
  setTimeout(() => processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer), 300);
}

export function launchConfetti() {
  const container = document.getElementById('confetti-container');
  for (let i = 0; i < 100; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.left = `${Math.random() * 100}vw`;
    el.style.background = `hsl(${Math.random() * 360},80%,60%)`;
    el.style.animationDelay = `${Math.random()}s`;
    container.appendChild(el);
  }
  setTimeout(() => (container.innerHTML = ''), 2000);
}

export function resetHintTimer(showHint) {
  clearTimeout(hintTimeout);
  hintTimeout = setTimeout(showHint, 10000);
}

export function showHint(renderBoard) {
  const h = findHint();
  if (!h || gameOver) return;
  renderBoard();
  setTimeout(() => {
    document.querySelectorAll('.tile').forEach((el, i) => {
      if (i === h.r1 * boardCols + h.c1 || i === h.r2 * boardCols + h.c2)
        el.classList.add('hint');
    });
  }, 50);
}
export function resetGame() {
  level = 1;
  levelScore = 0;
  totalScore = 0;
  boardRows = 5;
  boardCols = 5;
  gameOver = false;
  cascadeCount = 1;
  shuffles = 0;
  shufflesEarned = 0;
  selectedTile = null;
  board = generateBoard();
}


