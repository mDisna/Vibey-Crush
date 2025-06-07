import assert from 'assert';
import { Game } from '../js/game.js';

function* sequence() {
  const values = [0, 1, 2, 3, 4, 5];
  let i = 0;
  while (true) {
    yield values[i % values.length] / values.length;
    i++;
  }
}

function createGame(board) {
  const seq = sequence();
  const game = new Game({ random: () => seq.next().value });
  game.boardRows = board.length;
  game.boardCols = board[0].length;
  game.board = board.map(row => row.slice());
  return game;
}

function runTests() {
  const board = [
    ['A', null, 'B'],
    [null, 'C', null],
    ['D', null, 'E'],
  ];
  const game = createGame(board);

  const originalDoc = global.document;
  const originalRAF = global.requestAnimationFrame;
  global.document = { querySelectorAll: () => [] };
  global.requestAnimationFrame = fn => fn();

  game.refillBoard(() => {}, () => {}, () => {});

  game.board.forEach(row => row.forEach(cell => {
    assert.notStrictEqual(cell, null, 'board should not contain null after refill');
  }));

  global.document = originalDoc;
  global.requestAnimationFrame = originalRAF;
  console.log('refillBoard tests passed');
}

runTests();
