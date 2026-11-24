import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { afterEach, expect, it, vi } from 'vitest';
import { Game } from '../../game';
import { historyGroups, historyPreview, newLine, removedHistoryLine } from './history';
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

const main = readFileSync(new URL('./main.ts', import.meta.url), 'utf8');
const page = transformSync('main.ts', parseSync('main.ts', main).program.body
  .filter(node => node.type === 'FunctionDeclaration' && ['historyRows', 'renderHistory', 'openGameHistory', 'toggleScroll'].includes(node.id?.name ?? ''))
  .map(node => main.slice(node.start, node.end)).join('\n')).code;
afterEach(() => { vi.useRealTimers(); });
/** The play screen's real History drawing with stub nodes: `ink` holds each line that moves and its place in the 160 ms. */
function historyScreen({ reduce = false } = {}) {
  vi.useFakeTimers({ now: 0, toFake: ['performance'] });
  const ink: [string, number][] = [];
  const node = (className = '', words = '') => ({
    className, textContent: words, dataset: {} as Record<string, string>, hidden: false, tabIndex: 0, id: '',
    append() {}, replaceChildren() {}, setAttribute() {}, cloneNode() { return node(); }, querySelector: (): unknown => node(), contains: () => false, focus() {},
    animate: () => { const motion = { set currentTime(ms: number) { ink.push([words, ms]); } }; return motion; },
  });
  const game = { history: [] as string[] };
  const scope: Record<string, unknown> = {
    document: { querySelector: () => null, activeElement: null }, performance, historyStrip: node(), historyButton: node(), historyCompact: node(), scrollPanel: node(), scrollOpen: null,
    game, text: { history: 'History', noHistory: 'No moves.' }, el: (_: string, name: string, words: string) => node(name, words), line: node, icon: node, closeX: node, calm: () => true, matchMedia: () => ({ matches: true }),
    currentHistory: () => game.history.map((words, i) => ({ key: `t${i}`, title: `Turn ${i}`, lines: [{ key: `h${i}`, line: words }] })).reverse(),
    reducedMotion: () => reduce, time: (ms: number) => ms, freshLine: newLine(), closeFloating() {}, placeFloating() {}, showGameDialog() {}, closeGameDialog() {},
  };
  runInNewContext(page, scope);
  return { ink, game, scope, draw: scope.renderHistory as () => void, wait: (ms: number) => vi.advanceTimersByTime(ms) };
}
it('only the new history line takes its ink, one time; a redraw keeps its place in the 160 ms and starts nothing again', () => {
  const { ink, game, draw, wait } = historyScreen();
  game.history.push('e2 to e4'); draw(); // the first draw of a game: Continue, a reload
  expect(ink).toEqual([]);
  game.history.push('e7 to e5'); draw();
  expect(ink).toEqual([['e7 to e5', 0]]);
  wait(60); draw(); // a resize or a notice in the 160 ms
  expect(ink.slice(1)).toEqual([['e7 to e5', 60]]);
  wait(100); draw(); wait(5000); draw(); // Replay, a resize, a notice later
  expect(ink).toHaveLength(2);
});
it('an opened History shows its lines still; a line that comes while it is open takes its ink there too', () => {
  const { ink, game, draw, wait, scope } = historyScreen();
  game.history.push('e2 to e4'); draw(); game.history.push('e7 to e5'); draw(); wait(200); ink.length = 0;
  (scope.openGameHistory as () => void)(); (scope.toggleScroll as (kind: string, source: unknown) => void)('history', scope.historyButton);
  expect(scope.scrollOpen).toBe('history');
  expect(ink).toEqual([]);
  game.history.push('g1 to f3'); draw();
  expect(ink).toEqual([['g1 to f3', 0], ['g1 to f3', 0]]); // the strip and the open panel
});
it('reduced motion and a shorter history move no line', () => {
  const still = historyScreen({ reduce: true });
  still.draw(); still.game.history.push('e2 to e4'); still.draw();
  expect(still.ink).toEqual([]);
  vi.useRealTimers();
  const back = historyScreen();
  back.game.history.push('e2 to e4', 'e7 to e5'); back.draw(); back.game.history.pop(); back.draw();
  expect(back.ink).toEqual([]);
});
it('a game that opens starts with no new line', () => {
  expect(main.slice(main.indexOf('async function start('), main.indexOf('historyStrip = el('))).toContain('freshLine = newLine();');
});
