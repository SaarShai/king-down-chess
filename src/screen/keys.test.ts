import { afterEach, expect, it, vi } from 'vitest';
import { connectKeys, type KeysPlay } from './keys';
import { fromFen } from '../rules/setup';
import { Game } from '../game';
import { pieceText } from '../ui/guide';
import { P } from '../rules/engine';

afterEach(() => vi.unstubAllGlobals());

it('keeps the web cursor words, selection message and piece read', () => {
  const node = new EventTarget(), board = node as HTMLElement, live = { textContent: '' };
  Object.assign(board, { matches: () => true });
  vi.stubGlobal('addEventListener', vi.fn());
  vi.stubGlobal('document', { getElementById: () => live, activeElement: board, querySelector: () => null });
  const pos = fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1');
  const game = new Game(); game.load(pos);
  let selected: number | null = null, inspected: number | null = null;
  const play: KeysPlay = {
    game: () => game, shownPos: () => pos, selected: () => selected,
    pending: () => [], inspected: () => inspected, candidates: () => [{ from: 8, to: 16, captures: [] }],
    flipped: () => false, drawMarks: vi.fn(),
  };
  const keys = connectKeys(board, play, {
    blocked: () => false, click: square => { selected = square; }, read: square => { inspected = square; keys.say(); },
    escape: vi.fn(), undo: vi.fn(), step: vi.fn(),
  });
  const key = (value: string) => node.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: value }));
  keys.focus(true);
  expect(live.textContent).toBe('e2, empty');
  for (let i = 0; i < 4; i++) key('ArrowLeft');
  expect(live.textContent).toBe('a2, white pawn');
  key('Enter');
  expect(live.textContent).toBe('a2 selected. It can go to a3.');
  keys.say(); expect(live.textContent).toBe('a2, white pawn, selected');
  key('ArrowUp'); expect(live.textContent).toBe('a3, empty, can go here');
  key('ArrowRight'); expect(live.textContent).toBe('b3, empty');
  key('ArrowLeft'); key('ArrowDown'); selected = null; key('i');
  expect(live.textContent).toBe(`a2, white pawn. ${pieceText(P)}`);
});
