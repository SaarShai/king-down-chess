import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Game } from '../../game';
import { parseSq } from '../../rules/engine';
import { DraftTurn } from './turn';
import { readStored, rulesOf, SaveWriter, snapshot, type Prefs } from './saved';
import { clearResult, markedResult, markResult } from './result-mark';

const storage = () => {
  const items = new Map<string, string>();
  return { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => { items.set(k, v); }, removeItem: (k: string) => { items.delete(k); },
    key: (i: number) => [...items.keys()][i] ?? null, get length() { return items.size; } };
};
beforeEach(() => { vi.stubGlobal('localStorage', storage()); vi.stubGlobal('sessionStorage', storage()); });
afterEach(() => { vi.unstubAllGlobals(); });

const prefs: Prefs = { skill: 'casual', coords: true, sound: false, pace: 'normal' };
const gameOf = (fen: string) => { const game = new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []])); game.load(game.context.fromFen(fen)); return game; };
/** Write a game to the one save, as the page does at its end. */
function save(game: Game, { resigned = null as 0 | 1 | null, player = 0 as 0 | 1 } = {}) {
  const writer = new SaveWriter(() => {}), record = snapshot(new DraftTurn(game), resigned, player, 125_000);
  writer.replace(); expect(writer.game(record, prefs, true)).toBe(true);
  return record;
}
const fresh = () => new Game('RNBQKBNR', rulesOf('pieces', [null, null], [[], []]));
function played(fen: string, from: string, to: string) {
  const game = gameOf(fen), draft = new DraftTurn(game);
  draft.stage(draft.at(parseSq(from), parseSq(to))[0]); draft.commit();
  return game;
}
const mate = () => played('7k/6pp/8/8/8/R7/8/6K1 w - - 0 1', 'a3', 'a8');
const ends: [string, () => ReturnType<typeof save>, object][] = [
  ['a checkmate that the player gives', () => save(mate()), { player: 0, resigned: null, status: 'checkmate', turn: 1 }],
  ['a checkmate that the computer gives', () => save(mate(), { player: 1 }), { player: 1, resigned: null, status: 'checkmate', turn: 1 }],
  ['a draw', () => save(played('7k/8/8/8/8/8/1q6/K7 w - - 0 1', 'a1', 'b2')), { player: 0, resigned: null, status: 'drawMaterial', turn: 1 }],
  ['a resignation', () => save(played('7k/7p/8/8/8/8/P7/K7 w - - 0 1', 'a2', 'a3'), { resigned: 0 }), { player: 0, resigned: 0, status: 'playing', turn: 1 }],
];
it.each(ends)('decision 6, narrowed: %s opens its result card again while the mark stands', (_name, end, facts) => {
  const record = end();
  expect(readStored().kind).toBe('finished');
  expect(markedResult(readStored())).toBeNull(); // no mark: Home
  markResult(record);
  const before = localStorage.getItem('kingdown.save'), back = markedResult(readStored())!;
  expect({ player: back.player, resigned: back.finished.resigned, status: back.game.status, turn: back.game.pos.turn }).toEqual(facts);
  expect(back).toMatchObject({ level: 'clever', playedMs: 125_000 });
  expect(back.draft.length).toBe(0);
  expect(localStorage.getItem('kingdown.save')).toBe(before); // it writes nothing
  clearResult(); // Home
  expect(markedResult(readStored())).toBeNull();
});
it('a resignation before the first move opens its result card again; its kind stays empty', () => {
  const record = save(fresh(), { resigned: 0 });
  expect(readStored().kind).toBe('empty');
  expect(markedResult(readStored())).toBeNull(); // no mark: Home
  markResult(record);
  expect(markedResult(readStored())).toMatchObject({ player: 0, finished: { resigned: 0 }, level: 'clever' });
  clearResult(); save(fresh()); markResult(record); // no move and no resignation
  expect(markedResult(readStored())).toBeNull();
});
it('a later game with the same moves does not open the card of the first game', () => {
  const record = save(mate()); markResult(record);
  expect(markedResult(readStored())).not.toBeNull();
  save(mate()); // another tab
  expect(markedResult(readStored())).toBeNull();
  markResult(record); // the first tab shows its card again
  expect(markedResult(readStored())).toBeNull();
});
it('the mark of one game opens no other game', () => {
  markResult(save(mate()));
  save(played('7k/8/8/8/8/8/1q6/K7 w - - 0 1', 'a1', 'b2'));
  expect(markedResult(readStored())).toBeNull();
});
it('a staged mate, a kept save and a game of two people stay as they are', () => {
  const staged = new DraftTurn(gameOf('7k/6pp/8/8/8/R7/8/6K1 w - - 0 1'));
  staged.stage(staged.at(parseSq('a3'), parseSq('a8'))[0]);
  const writer = new SaveWriter(() => {}), record = snapshot(staged);
  writer.replace(); writer.game(record, prefs, true); markResult(record);
  expect(readStored().kind).toBe('resume'); expect(markedResult(readStored())).toBeNull();
  for (const change of [{ moves: ['e2-e4', 'e2-e4'] }, { black: 'human' as const }]) {
    clearResult();
    const other = { ...save(mate()), ...change };
    localStorage.setItem('kingdown.save', JSON.stringify(other)); markResult(other);
    expect(markedResult(readStored())).toBeNull();
  }
});
it('a tab that refuses its storage opens Home', () => {
  const record = save(mate()), refuse = () => { throw new Error('SecurityError'); };
  vi.stubGlobal('sessionStorage', { getItem: refuse, setItem: refuse, removeItem: refuse });
  markResult(record); clearResult();
  expect(markedResult(readStored())).toBeNull();
});
