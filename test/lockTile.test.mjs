import assert from 'assert';
import { Game, lockTile, findRuns } from '../js/game.js';

function* sequence() {
  const values = [0, 1, 2, 3, 4, 5];
  let i = 0;
  while (true) {
    yield values[i % values.length] / values.length;
    i++;
  }
}

function runTests() {
  const seq = sequence();
  // first call returns 0.05 for lock generation
  const rand = () => (seq.next().value);
  const game = new Game({ level: 30, random: rand });
  game.random = () => 0.05; // force lock chance
  assert.strictEqual(game.getAddedTile(), lockTile, 'lock tile generated');

  // limit test: should not add more locks when 7% or more already present
  game.boardRows = 1;
  game.boardCols = 10;
  game.board = [
    [lockTile, 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']
  ];
  assert.notStrictEqual(game.getAddedTile(), lockTile, 'lock limit enforced');

  const board = [[lockTile, lockTile, lockTile]];
  assert.deepStrictEqual(findRuns(board, 3), [], 'no runs with locks');
  game.boardRows = 1;
  game.boardCols = 3;
  game.board = board.map(row => row.slice());
  assert.strictEqual(game.findAllMatches().length, 0, 'findAllMatches ignores locks');

  // allow lock when under limit
  game.boardRows = 1;
  game.boardCols = 10;
  game.board = [['A','B','C','D','E','F','G','H','I','J']];
  assert.strictEqual(game.getAddedTile(), lockTile, 'lock allowed under limit');

  console.log('lockTile tests passed');
}

runTests();
