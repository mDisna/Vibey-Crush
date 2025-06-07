import assert from 'assert';
import { Game } from '../js/game.js';

function runTests() {
  const boardNoHint = [
    ['A','B','C'],
    ['A','B','C'],
    ['D','E','F'],
  ];
  const boardWithHint = [
    ['A','B','A'],
    ['B','A','C'],
    ['D','E','F'],
  ];

  const game = new Game();
  game.boardRows = 3;
  game.boardCols = 3;
  game.board = boardNoHint.map(row => row.slice());

  let generateCalls = 0;
  game.generateBoard = () => {
    generateCalls++;
    return boardWithHint.map(row => row.slice());
  };

  const renderBoard = () => {};
  const resetHint = () => {};
  const updateBg = () => {};

  let processed = 0;
  game.processMatches = () => { processed++; };

  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); };

  game.shuffleBoard(null, renderBoard, resetHint, updateBg);

  global.setTimeout = originalSetTimeout;

  assert.deepStrictEqual(game.board, boardWithHint, 'board regenerated');
  assert.ok(game.findHint(), 'hint exists after shuffle');
  assert.strictEqual(processed, 1, 'processMatches called');
  assert.strictEqual(generateCalls, 1, 'generateBoard called once');

  console.log('shuffleBoard tests passed');
}

runTests();
