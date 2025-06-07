import assert from 'assert';
import { findRuns } from '../js/game.js';

function deepEqualUnordered(actual, expected) {
  assert.strictEqual(actual.length, expected.length, 'number of runs');
  const norm = arr => arr.map(run => run.map(JSON.stringify).join('|')).sort();
  assert.deepStrictEqual(norm(actual), norm(expected));
}

function runTests() {
  // horizontal triple
  let board = [
    ['A', 'A', 'A'],
    ['B', 'C', 'D'],
  ];
  deepEqualUnordered(findRuns(board, 3), [[[0,0],[0,1],[0,2]]]);

  // vertical four
  board = [
    ['X'],
    ['X'],
    ['X'],
    ['X'],
  ];
  deepEqualUnordered(findRuns(board, 4), [[[0,0],[1,0],[2,0],[3,0]]]);

  // horizontal five
  board = [ ['Y','Y','Y','Y','Y'] ];
  deepEqualUnordered(findRuns(board,5), [[[0,0],[0,1],[0,2],[0,3],[0,4]]]);

  console.log('All tests passed');
}

runTests();
