import assert from 'assert';
import { Game } from '../js/game.js';

function createGameWithBoard(board) {
  const game = new Game();
  game.boardRows = board.length;
  game.boardCols = board[0].length;
  game.board = board.map(row => row.slice());
  return game;
}

function runTests() {
  let renderCalls = 0;
  const renderBoard = () => { renderCalls++; };
  const resetHint = () => {};

  // swap leading to match
  const matchBoard = [
    ['A','A','B'],
    ['B','B','C'],
    ['D','E','F'],
  ];
  const game1 = createGameWithBoard(matchBoard);
  let processed = 0;
  const processMatches = () => { processed++; };
  let shaken = null;
  const shakeTiles = coords => { shaken = coords; };
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); };

  game1.handleClick(0,2, renderBoard, resetHint, processMatches, shakeTiles);
  assert.ok(game1.selectedTile, 'tile selected');
  game1.handleClick(1,2, renderBoard, resetHint, processMatches, shakeTiles);
  assert.strictEqual(game1.selectedTile, null, 'selection cleared');
  assert.strictEqual(game1.board[0][2], 'C');
  assert.strictEqual(game1.board[1][2], 'B');
  assert.strictEqual(processed, 1, 'processMatches called');
  assert.strictEqual(shaken, null, 'no shake on valid move');

  // invalid swap
  const game2 = createGameWithBoard(matchBoard);
  let processed2 = 0;
  let shaken2 = null;
  game2.handleClick(0,1, renderBoard, resetHint, () => processed2++, coords => shaken2 = coords);
  game2.handleClick(0,2, renderBoard, resetHint, () => processed2++, coords => shaken2 = coords);
  assert.strictEqual(game2.board[0][1], 'A');
  assert.strictEqual(game2.board[0][2], 'B');
  assert.strictEqual(processed2, 0, 'processMatches not called');
  assert.deepStrictEqual(shaken2, [[0,1],[0,2]], 'shakeTiles called with swapped coords');

  global.setTimeout = originalSetTimeout;
  console.log('handleClick tests passed');
}

runTests();
