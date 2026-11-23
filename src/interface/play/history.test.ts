import { expect, it } from 'vitest';
import { Game } from '../../game';
import { historyGroups, historyPreview, removedHistoryLine } from './history';
import { gameLayout, panelBox } from './layout';
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

it('the closed scroll shows exactly the newest two records across turn boundaries', () => {
  expect(historyPreview(groups([])).map(l => l.key)).toEqual(['h2', 'h1']);
  expect(historyPreview(groups(['first', 'last'])).map(l => l.line)).toEqual(['last', 'first']);
  expect(historyPreview(groups(['staged'])).map(l => l.key)).toEqual(['d0', 'h2']);
  expect(historyPreview([])).toEqual([]);
  expect(historyPreview([{ key: 'one', title: '', lines: [{ key: 'h0', line: 'Only record' }] }])).toHaveLength(1);
});
it('Undo wipes only the removed record and keeps the next record in view', () => {
  const erased = { key: 'd1', line: 'removed' };
  expect(historyPreview(groups(['kept']), erased).map(l => l.line)).toEqual(['removed', 'kept']);
});
it('the open History in the wide rail covers the turn text and stops 8 px above the command tray', () => {
  for (const [w, h] of [[1280, 800], [1440, 900]] as const) {
    const l = gameLayout(w, h, 'both');
    expect(panelBox(l.actionY, l.readerY, l.readerY)).toEqual({ top: l.readerY, height: 306 });
  }
});
