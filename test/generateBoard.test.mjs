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

function runTests() {
  const seq = sequence();
  const game = new Game({ random: () => seq.next().value });
  // ensure board dimensions
  assert.strictEqual(game.board.length, game.boardRows, 'row count');
  assert.strictEqual(game.board[0].length, game.boardCols, 'col count');
  // board should start without any matches
  assert.strictEqual(game.findAllMatches().length, 0, 'no initial matches');
  console.log('generateBoard tests passed');
}

runTests();
