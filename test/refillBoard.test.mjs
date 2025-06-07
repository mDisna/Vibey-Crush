import assert from 'assert';
import { Game } from '../js/game.js';

function runTests() {
  const game = new Game();
  game.boardRows = 3;
  game.boardCols = 3;
  game.board = [
    ['A', 'B', null],
    ['C', null, null],
    ['D', 'E', 'F'],
  ];

  global.document = { querySelectorAll: () => [] };
  global.requestAnimationFrame = (fn) => fn();

  const renderBoard = () => {};
  let hintResets = 0;
  const resetHintTimer = () => { hintResets++; };

  game.refillBoard(() => {}, renderBoard, resetHintTimer);

  assert.strictEqual(game.board.length, game.boardRows, 'row count');
  assert.strictEqual(game.board[0].length, game.boardCols, 'col count');
  for (let r = 0; r < game.boardRows; r++)
    for (let c = 0; c < game.boardCols; c++)
      assert.notStrictEqual(game.board[r][c], null, `null at ${r},${c}`);

  assert.strictEqual(hintResets, 1, 'resetHintTimer called');
  console.log('refillBoard tests passed');
}

runTests();
