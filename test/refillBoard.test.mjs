import assert from 'assert';
import { Game } from '../js/game.js';

// A deterministic sequence generator for predictable “random” values
function* sequence() {
  const values = [0, 1, 2, 3, 4, 5];
  let i = 0;
  while (true) {
    yield values[i % values.length] / values.length;
    i++;
  }
}

// Helper to create a Game with a seeded RNG and a custom board
function createGame(board) {
  const seq = sequence();
  const game = new Game({ random: () => seq.next().value });
  game.boardRows = board.length;
  game.boardCols = board[0].length;
  game.board = board.map(row => row.slice());
  return game;
}

function runTests() {
  // ——— Test #1: basic refillBoard + hint-timer reset ———
  {
    // set up
    const game = new Game();
    game.boardRows = 3;
    game.boardCols = 3;
    game.board = [
      ['A', 'B', null],
      ['C', null, null],
      ['D', 'E', 'F'],
    ];

    // stub out DOM & RAF
    const originalDoc = global.document;
    const originalRAF = global.requestAnimationFrame;
    global.document = { querySelectorAll: () => [] };
    global.requestAnimationFrame = fn => fn();

    // track hint timer resets
    let hintResets = 0;
    const resetHintTimer = () => { hintResets++; };

    // run
    game.refillBoard(() => {}, () => {}, resetHintTimer);

    // assertions
    assert.strictEqual(game.board.length, game.boardRows, 'row count');
    assert.strictEqual(game.board[0].length, game.boardCols, 'col count');
    for (let r = 0; r < game.boardRows; r++) {
      for (let c = 0; c < game.boardCols; c++) {
        assert.notStrictEqual(game.board[r][c], null, `null at ${r},${c}`);
      }
    }
    assert.strictEqual(hintResets, 1, 'resetHintTimer called once');

    // restore
    global.document = originalDoc;
    global.requestAnimationFrame = originalRAF;
  }

  // ——— Test #2: refillBoard with deterministic RNG ———
  {
    const board = [
      ['A', null, 'B'],
      [null, 'C', null],
      ['D', null, 'E'],
    ];
    const game = createGame(board);

    // stub out DOM & RAF
    const originalDoc = global.document;
    const originalRAF = global.requestAnimationFrame;
    global.document = { querySelectorAll: () => [] };
    global.requestAnimationFrame = fn => fn();

    // run (we don't care about callbacks here)
    game.refillBoard(() => {}, () => {}, () => {});

    // assert no nulls remain
    game.board.forEach(row => {
      row.forEach(cell => {
        assert.notStrictEqual(cell, null, 'board should not contain null after refill');
      });
    });

    // restore
    global.document = originalDoc;
    global.requestAnimationFrame = originalRAF;
  }

  console.log('refillBoard tests passed');
}

runTests();
