import { playRandomTone, playJingle } from './audio.js';

export const tileTypes = ["💎", "🔶", "🔷", "🔴", "🟢", "🟣"];

export class Game {
  constructor() {
    this.level = 1;
    this.levelScore = 0;
    this.totalScore = 0;
    this.boardRows = 5;
    this.boardCols = 5;
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
    return tileTypes[Math.floor(Math.random() * tileTypes.length)];
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
          this.board[r][c] === this.board[r][c + 2]
        )
          m.push([r, c], [r, c + 1], [r, c + 2]);
    for (let c = 0; c < this.boardCols; c++)
      for (let r = 0; r < this.boardRows - 2; r++)
        if (
          this.board[r][c] &&
          this.board[r][c] === this.board[r + 1][c] &&
          this.board[r][c] === this.board[r + 2][c]
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
      }
    } else {
      this.selectedTile = { r, c };
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
    for (let r = 0; r < this.boardRows; r++) {
      let run = 1;
      for (let c = 1; c <= this.boardCols; c++) {
        if (
          c < this.boardCols &&
          this.board[r][c] === this.board[r][c - 1] &&
          this.board[r][c] !== null
        ) {
          run++;
        } else if (run >= 5) {
          this.clearMany(
            Array.from({ length: this.boardRows }, (_, rr) =>
              Array.from({ length: this.boardCols }, (_, cc) => [rr, cc])
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
    for (let c = 0; c < this.boardCols; c++) {
      let run = 1;
      for (let r = 1; r <= this.boardRows; r++) {
        if (
          r < this.boardRows &&
          this.board[r][c] === this.board[r - 1][c] &&
          this.board[r][c] !== null
        ) {
          run++;
        } else if (run >= 5) {
          this.clearMany(
            Array.from({ length: this.boardRows }, (_, rr) =>
              Array.from({ length: this.boardCols }, (_, cc) => [rr, cc])
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

    let toClear = [];
    for (let r = 0; r < this.boardRows; r++) {
      let run = 1;
      for (let c = 1; c <= this.boardCols; c++) {
        if (
          c < this.boardCols &&
          this.board[r][c] === this.board[r][c - 1] &&
          this.board[r][c] !== null
        ) {
          run++;
        } else if (run === 4) {
          for (let i = 0; i < this.boardCols; i++) toClear.push([r, i]);
          run = 1;
        } else {
          run = 1;
        }
      }
    }
    for (let c = 0; c < this.boardCols; c++) {
      let run = 1;
      for (let r = 1; r <= this.boardRows; r++) {
        if (
          r < this.boardRows &&
          this.board[r][c] === this.board[r - 1][c] &&
          this.board[r][c] !== null
        ) {
          run++;
        } else if (run === 4) {
          for (let i = 0; i < this.boardRows; i++) toClear.push([i, c]);
          run = 1;
        } else {
          run = 1;
        }
      }
    }
    if (toClear.length) {
      this.clearMany(toClear, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
      return;
    }
    const triples = this.findAllMatches();
    if (triples.length) {
      this.clearMany(triples, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer);
      return;
    }
    renderBoard();
  }

  clearMany(cells, updateUI, renderBoard, launchConfetti, updateBackground, resetHintTimer) {
    playRandomTone();
    const base = cells.length;
    const bonus = (this.cascadeCount - 1) * 0.5;
    this.totalScore += base + bonus;
    this.levelScore += base + bonus;
    this.cascadeCount++;
    const awarded = this.checkShuffleAward();
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
          this.board[r][c] = this.getRandomTile();
      for (let r = prevRows; r < this.boardRows; r++) {
        this.board[r] = [];
        for (let c = 0; c < this.boardCols; c++) this.board[r][c] = this.getRandomTile();
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
    const fall = [];
    for (let c = 0; c < this.boardCols; c++) {
      let empty = 0;
      for (let r = this.boardRows - 1; r >= 0; r--) {
        if (!this.board[r][c]) empty++;
        else if (empty > 0) {
          this.board[r + empty][c] = this.board[r][c];
          this.board[r][c] = null;
          fall.push({ from: r, to: r + empty, c });
        }
      }
      for (let r = 0; r < empty; r++) {
        this.board[r][c] = this.getRandomTile();
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

  resetGame() {
    this.level = 1;
    this.levelScore = 0;
    this.totalScore = 0;
    this.boardRows = 5;
    this.boardCols = 5;
    this.gameOver = false;
    this.cascadeCount = 1;
    this.shuffles = 0;
    this.shufflesEarned = 0;
    this.selectedTile = null;
    this.board = this.generateBoard();
  }
}
