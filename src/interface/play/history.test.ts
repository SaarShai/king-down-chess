import { expect, it } from 'vitest';
import { Game } from '../../game';
import { historyGroups, removedHistoryLine } from './history';
import { sentence } from './texts';
const game = new Game('RNBQKBNR', { kings: [null, null] });
const pos = game.pos, move = game.legal.find(m => m.from === 12 && m.to === 28)!;
const history = [{ pos, move }, { pos, move }, { pos: { ...pos, turn: 1 as const }, move }];
const groups = (steps: string[]) => historyGroups(history, steps, sentence, (n, side) => `${n}:${side}`, 'This turn');
it('puts staged steps first and reverses actions within each completed turn', () => {
  const out = groups(['first', 'last']);
  expect(out.map(g => g.key)).toEqual(['draft', 't2', 't1']);
  expect(out[0].lines.map(l => l.line)).toEqual(['last', 'first']);
  expect(out[2].lines.map(l => l.key)).toEqual(['h1', 'h0']);
  expect(out.map(g => g.title)).toEqual(['This turn', '2:1', '1:0']);
});
it('finds the exact step removed by Undo in a turn with several steps', () => {
  expect(removedHistoryLine(groups(['first', 'last']), groups(['first']))).toEqual({key:'d1',line:'last'});
  expect(removedHistoryLine(groups(['first']), groups([]))).toEqual({key:'d0',line:'first'});
});
it('omits pass lines and empty completed turns', () => {
  expect(historyGroups([{pos,move:{...move,pass:true}}], [], sentence, () => '', '')).toEqual([]);
});
