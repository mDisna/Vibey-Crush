import { playRandomTone, playJingle } from './audio.js';

export const tileTypes = ["💎", "🔶", "🔷", "🔴", "🟢", "🟣"];
export const lockTile = "🔒";

export function findRuns(board, length) {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  const runs = [];

  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c <= cols; c++) {
      if (
        c < cols &&
        board[r][c] === board[r][c - 1] &&
        board[r][c] !== null &&
        board[r][c] !== lockTile
      ) {
        run++;
      } else {
        if (run >= length) {
          const cells = [];
          for (let i = 0; i < run; i++) cells.push([r, c - run + i]);
          runs.push(cells);
        }
        run = 1;
      }
    }
  }

  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r <= rows; r++) {
      if (
        r < rows &&
        board[r][c] === board[r - 1][c] &&
        board[r][c] !== null &&
        board[r][c] !== lockTile
      ) {
        run++;
      } else {
        if (run >= length) {
          const cells = [];
          for (let i = 0; i < run; i++) cells.push([r - run + i, c]);
          runs.push(cells);
        }
        run = 1;
      }
    }
  }

  return runs;
}

export class Game {
  static boardSizeForLevel(lv) {
    let rows = 5;
    let cols = 5;
    for (let i = 2; i <= lv; i++) {
      if (i % 5 === 0) cols = Math.min(cols + 1, 20);
      if (i % 10 === 0) rows = Math.min(rows + 1, 15);
    }
    return { rows, cols };
  }

  constructor(options = {}) {
    this.random = options.random || Math.random;
    this.level = options.level || 1;
    this.levelScore = 0;
    this.totalScore = 0;
    const size = Game.boardSizeForLevel(this.level);
    this.boardRows = size.rows;
    this.boardCols = size.cols;
    this.board = [];
    this.selectedTile = null;
    this.gameOver = false;
    this.hintTimeout = null;
    this.cascadeCount = 1;
    this.shuffles = 0;
    this.shufflesEarned = 0;
    this.board = this.generateBoard();
  }

  getThreshold(lv = this.level) {
    const raw = 15 * (lv / 2);
    return Math.ceil(raw / 5) * 5;
  }

  getRandomTile() {
    return tileTypes[Math.floor(this.random() * tileTypes.length)];
  }

  getAddedTile() {
    if (this.level >= 30 && this.random() < 0.1) return lockTile;
    return this.getRandomTile();
  }

  generateBoard() {
    const b = [];
    for (let r = 0; r < this.boardRows; r++) {
      b[r] = [];
      for (let c = 0; c < this.boardCols; c++) {
        let t;
        do {
          t = this.getRandomTile();
        } while (this.isMatch(b, r, c, t));
        b[r][c] = t;
      }
    }
    return b;
  }

  isMatch(b, r, c, t) {
    if (t === lockTile) return false;
    return (
      (c >= 2 && b[r][c - 1] === t && b[r][c - 2] === t) ||
      (r >= 2 && b[r - 1][c] === t && b[r - 2][c] === t)
    );
  }

  swap(r1, c1, r2, c2) {
    [this.board[r1][c1], this.board[r2][c2]] = [
      this.board[r2][c2],
      this.board[r1][c1],
    ];
  }

  hasMatch() {
    return this.findAllMatches().length > 0;
  }

  findAllMatches() {
    const m = [];
    for (let r = 0; r < this.boardRows; r++)
      for (let c = 0; c < this.boardCols - 2; c++)
        if (
          this.board[r][c] &&
          this.board[r][c] === this.board[r][c + 1] &&
          this.board[r][c] === this.board[r][c + 2] &&
          this.board[r][c] !== lockTile
        )
          m.push([r, c], [r, c + 1], [r, c + 2]);
    for (let c = 0; c < this.boardCols; c++)
      for (let r = 0; r < this.boardRows - 2; r++)
        if (
          this.board[r][c] &&
          this.board[r][c] === this.board[r + 1][c] &&
          this.board[r][c] === this.board[r + 2][c] &&
          this.board[r][c] !== lockTile
        )
          m.push([r, c], [r + 1, c], [r + 2, c]);
    return Array.from(new Set(m.map(JSON.stringify)), JSON.parse);
  }

  findHint() {
    for (let r = 0; r < this.boardRows; r++)
      for (let c = 0; c < this.boardCols; c++)
        for (const [dr, dc] of [
          [1, 0],
          [0, 1],
        ]) {
          const nr = r + dr,
            nc = c + dc;
          if (nr < this.boardRows && nc < this.boardCols) {
            this.swap(r, c, nr, nc);
            const ok = this.hasMatch();
            this.swap(r, c, nr, nc);
            if (ok) return { r1: r, c1: c, r2: nr, c2: nc };
          }
        }
    return null;
  }

  handleClick(r, c, renderBoard, resetHint, processMatchesCb, shakeTiles) {
    if (this.gameOver) return;
    resetHint();
    if (!this.selectedTile) {
      if (this.board[r][c] === lockTile) return;
      this.cascadeCount = 1;
      this.selectedTile = { r, c };
      return renderBoard();
    }
    const { r: sr, c: sc } = this.selectedTile;
    if (sr === r && sc === c) {
      this.selectedTile = null;
      return renderBoard();
    }
    if (Math.abs(sr - r) + Math.abs(sc - c) === 1) {
      if (this.board[sr][sc] === lockTile || this.board[r][c] === lockTile) {
        this.selectedTile = null;
        renderBoard();
        if (shakeTiles) shakeTiles([
          [sr, sc],
          [r, c],
        ]);
        return;
      }
      this.swap(sr, sc, r, c);
      if (this.findAllMatches().length > 0) {
        this.selectedTile = null;
        renderBoard();
        setTimeout(processMatchesCb, 100);
      } else {
        this.swap(sr, sc, r, c);
        this.selectedTile = null;
        renderBoard();
        if (shakeTiles) shakeTiles([
          [sr, sc],
          [r, c],
        ]);
        return; // avoid clearing shake animation
      }
    } else {
      if (this.board[r][c] !== lockTile) this.selectedTile = { r, c };
    }
    renderBoard();
  }

  checkShuffleAward() {
    const earned = Math.floor(this.totalScore / 100);
    if (earned > this.shufflesEarned) {
      this.shuffles += earned - this.shufflesEarned;
      this.shufflesEarned = earned;
      playJingle();
      return true;
    }
    return false;
  }

  processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer) {
    const allCells = Array.from({ length: this.boardRows }, (_, r) =>
      Array.from({ length: this.boardCols }, (_, c) => [r, c])
    ).flat();

    const fives = findRuns(this.board, 5);
    if (fives.length) {
      this.clearMany(allCells, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
      return;
    }

    const fours = findRuns(this.board, 4);
    if (fours.length) {
      let toClear = [];
      fours.forEach((run) => {
        const horizontal = run.every(([r]) => r === run[0][0]);
        if (horizontal) for (let i = 0; i < this.boardCols; i++) toClear.push([run[0][0], i]);
        else for (let i = 0; i < this.boardRows; i++) toClear.push([i, run[0][1]]);
      });
      toClear = Array.from(new Set(toClear.map(JSON.stringify)), JSON.parse);
      this.clearMany(toClear, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
      return;
    }

    const triples = findRuns(this.board, 3);
    if (triples.length) {
      const cells = Array.from(
        new Set(triples.flat().map(JSON.stringify)),
        JSON.parse
      );
      this.clearMany(cells, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
      return;
    }

    renderBoard();
  }

  clearMany(cells, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer) {
    const base = cells.length;
    const bonus = (this.cascadeCount - 1) * 0.5;
    this.totalScore += base + bonus;
    this.levelScore += base + bonus;
    this.cascadeCount++;
    const awarded = this.checkShuffleAward();
    if (!awarded) playRandomTone();
    if (awarded && updateUI) updateUI();

    const prevRows = this.boardRows;
    const prevCols = this.boardCols;

    let threshold = this.getThreshold();
    while (this.levelScore >= threshold) {
      this.levelScore -= threshold;
      this.level++;
      if (this.level % 5 === 0) this.boardCols = Math.min(this.boardCols + 1, 20);
      if (this.level % 10 === 0) this.boardRows = Math.min(this.boardRows + 1, 15);
      if (launchConfetti) launchConfetti();
      if (updateBackground) updateBackground();
      threshold = this.getThreshold();
    }

    if (this.boardCols > prevCols || this.boardRows > prevRows) {
      for (let r = 0; r < prevRows; r++)
        for (let c = prevCols; c < this.boardCols; c++)
          this.board[r][c] = this.getAddedTile();
      for (let r = prevRows; r < this.boardRows; r++) {
        this.board[r] = [];
        for (let c = 0; c < this.boardCols; c++) this.board[r][c] = this.getAddedTile();
      }
    }

    cells.forEach(([r, c]) =>
      document
        .querySelectorAll('.tile')[r * prevCols + c]?.classList.add('fading')
    );
    setTimeout(() => {
      cells.forEach(([r, c]) => (this.board[r][c] = null));
      this.refillBoard(updateUI, renderBoard, resetHintTimer);
      setTimeout(() => this.processMatches(updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer), 500);
    }, 400);
  }

  refillBoard(updateUI, renderBoard, resetHintTimer) {
    const fallMap = {};
    for (let c = 0; c < this.boardCols; c++) {
      let empty = 0;
      for (let r = this.boardRows - 1; r >= 0; r--) {
        if (!this.board[r][c]) empty++;
        else if (empty > 0) {
          this.board[r + empty][c] = this.board[r][c];
          this.board[r][c] = null;
          fallMap[`${r + empty},${c}`] = empty;
        }
      }
      for (let r = 0; r < empty; r++) {
        this.board[r][c] = this.getAddedTile();
        fallMap[`${r},${c}`] = empty - r;
      }
    }
    renderBoard();
    requestAnimationFrame(() => {
      document.querySelectorAll('.tile').forEach((el) => {
        const r = Number(el.dataset.row);
        const c = Number(el.dataset.col);
        const dist = fallMap[`${r},${c}`];
        if (!dist) return;
        el.style.transform = `translateY(-${dist * 64}px)`;
        el.classList.add('falling');
        setTimeout(() => (el.style.transform = ''), 20);
      });
    });
    resetHintTimer();
  }

  shuffleBoard(updateUI, renderBoard, resetHintTimer, updateBackground) {
    let attempts = 0;
    do {
      this.board = this.generateBoard();
      attempts++;
    } while (!this.findHint() && attempts < 10);
    renderBoard();
    resetHintTimer();
    setTimeout(
      () =>
        this.processMatches(
          updateUI,
          renderBoard,
          this.launchConfetti,
          updateBackground,
          resetHintTimer
        ),
      300
    );
  }

  launchConfetti() {
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

  resetHintTimer(showHint) {
    clearTimeout(this.hintTimeout);
    this.hintTimeout = setTimeout(showHint, 10000);
  }

  showHint(renderBoard) {
    const h = this.findHint();
    if (!h || this.gameOver) return;
    renderBoard();
    setTimeout(() => {
      document.querySelectorAll('.tile').forEach((el, i) => {
        if (i === h.r1 * this.boardCols + h.c1 || i === h.r2 * this.boardCols + h.c2)
          el.classList.add('hint');
      });
    }, 50);
  }

  resetGame(level = 1) {
    this.level = level;
    this.levelScore = 0;
    this.totalScore = 0;
    const size = Game.boardSizeForLevel(this.level);
    this.boardRows = size.rows;
    this.boardCols = size.cols;
    this.gameOver = false;
    this.cascadeCount = 1;
    this.shuffles = 0;
    this.shufflesEarned = 0;
    this.selectedTile = null;
    this.board = this.generateBoard();
  }
}
