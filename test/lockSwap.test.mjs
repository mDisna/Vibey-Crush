import assert from 'assert';
import { Game, lockTile } from '../js/game.js';

function createGame(board) {
  const g = new Game();
  g.boardRows = board.length;
  g.boardCols = board[0].length;
  g.board = board.map(row => row.slice());
  return g;
}

function runTests() {
  const board = [
    ['A', lockTile],
    ['A', 'A']
  ];
  const game = createGame(board);
  let shaken = null;
  const shake = coords => { shaken = coords; };
  const render = () => {};
  const reset = () => {};
  const process = () => {};
  const originalTimeout = global.setTimeout;
  global.setTimeout = fn => fn();

  // attempt to select lock tile
  game.handleClick(0,1, render, reset, process, shake);
  assert.strictEqual(game.selectedTile, null, 'lock tile not selectable');

  // select normal tile then try swapping with lock
  game.handleClick(0,0, render, reset, process, shake);
  game.handleClick(0,1, render, reset, process, shake);
  assert.deepStrictEqual(game.board, board, 'board unchanged after lock swap attempt');
  assert.deepStrictEqual(shaken, [[0,0],[0,1]], 'shake on invalid lock swap');

  global.setTimeout = originalTimeout;
  console.log('lockSwap tests passed');
}

runTests();
