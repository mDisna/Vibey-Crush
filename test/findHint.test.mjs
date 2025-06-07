import assert from 'assert';
import { Game } from '../js/game.js';

function runTests() {
  const game = new Game();
  game.boardRows = 3;
  game.boardCols = 3;
  game.board = [
    ['A','B','A'],
    ['B','A','C'],
    ['D','E','F'],
  ];
  const hint = game.findHint();
  assert.deepStrictEqual(hint, { r1: 0, c1: 1, r2: 1, c2: 1 });
  console.log('findHint tests passed');
}

runTests();
