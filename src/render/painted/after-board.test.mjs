import test from 'node:test';
import assert from 'node:assert/strict';
import {afterBoard,boardReady} from './after-board.mjs';

test('art loads wait for the board, then run once, in order', () => {
  const ran=[];
  afterBoard(()=>ran.push('a'));afterBoard(()=>ran.push('b'));
  assert.deepEqual(ran,[]);
  boardReady();
  assert.deepEqual(ran,['a','b']);
  boardReady();
  assert.deepEqual(ran,['a','b']);
  afterBoard(()=>ran.push('c'));
  assert.deepEqual(ran,['a','b','c']);
});
