import { expect, test } from 'vitest';
import type { View } from '../../match/protocol';
import { fromFen, toFen, toLan } from '../../rules/setup';
import { legalMoves, setRules, type CardName } from '../../rules/engine';
import { applyLan, boardActions, cardCoins, replayHistory, replayLans, stripLine, timeLeft } from './board-model';

const view = (fields: Partial<View> = {}): View => ({ game_id: 'game', revision: 2, created_at: '2026-10-11T00:00:00Z', abort_open: false, seat: 0, kind: 'friend', speed: 'daily', days_per_move: 3, status: 'playing', turn: 1, action: 'waiting', fen: '7k/8/8/8/8/8/P7/K7 b - - 0 1', in_check: false, legal: [], last_commands: [], opponent: null, draw_offer: null, deadline_at: '2026-10-11T00:00:01Z', server_now: '2026-10-11T00:00:00Z', ...fields });

test('a missed first turn ends with no result; a later turn permits a win claim', () => {
  expect(boardActions(view({ abort_open: true }), 1000)).toEqual({ abort: true, claim: 'end' });
  expect(boardActions(view(), 1000)).toEqual({ abort: false, claim: 'win' });
  expect(boardActions(view(), 999).claim).toBeNull();
  expect(boardActions(view({ turn: 0 }), 1000).claim).toBeNull();
  expect(boardActions(view({ status: 'finished' }), 1000)).toEqual({ abort: false, claim: null });
});

test('each strip names its rating and colour, or the computer level', () => {
  expect(stripLine(0, { rating: 1499.6, provisional: true })).toBe('New player · White');
  expect(stripLine(1, { rating: 1540, provisional: false })).toBe('1540 · Black');
  expect(stripLine(1)).toBe('Black');
  expect(stripLine(1, undefined, 'club')).toBe('Club');
});

test('the open hand spends Mirror B itself and keeps the copied card', () => {
  const hand: CardName[] = ['March', 'MirrorB', 'Freeze', 'IceWall'];
  const rules = { hands: [hand, hand] as const };
  setRules(rules);
  const pre = { ...fromFen('7k/8/8/4p3/8/8/P7/K7 w - - 0 1'), used: [1, 0] as const };
  const legal = legalMoves(pre);
  expect(cardCoins(pre, 0, hand, legal).map(coin => coin.spent)).toEqual([true, false, false, false]);
  const copy = cardCoins(pre, 0, hand, legal)[1].moves.find(move => move.power === 'freeze')!;
  expect(copy.via).toBe('mirrorb');
  const after = applyLan(pre, toLan(pre, copy), rules)!.pos;
  expect(cardCoins(after, 0, hand, []).map(coin => coin.spent)).toEqual([true, true, false, false]);
  expect(cardCoins(after, 1, hand, []).map(coin => coin.spent)).toEqual([false, false, false, false]);
});

test('server LANs replay only when the complete reply reaches its stated position', () => {
  const before = view({ revision: 0, fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1' });
  const next = view({ revision: 2, fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w - - 0 2', last_commands: [
    { seq: 1, seat: 0, at: before.server_now, action: { type: 'turn', actions: ['e2-e4'] } },
    { seq: 2, seat: 0, at: before.server_now, action: { type: 'computer', actions: ['e7-e5'] } },
  ] });
  expect(replayLans(before, next, {})?.map(step => step.words)).toEqual(['White pawn e2 to e4.', 'Black pawn e7 to e5.']);
  expect(replayLans(before, { ...next, fen: before.fen }, {})).toBeUndefined();
  expect(replayLans(before, { ...next, last_commands: next.last_commands.slice(1) }, {})).toBeUndefined();
  expect(replayLans(before, { ...next, game_id: 'another' }, {})).toBeUndefined();
});

test('a shown move uses the server legal list and keeps its prior position for rollback', () => {
  setRules({});
  const pre = fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
  const shown = applyLan(pre, 'e2-e4', {}, ['e2-e4']);
  expect(shown?.words).toBe('White pawn e2 to e4.');
  expect(shown && toFen(shown.pos)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b - - 0 1');
  expect(shown?.pre).toBe(pre);
  expect(toFen(pre)).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1');
  expect(applyLan(pre, 'e2-e4', {}, ['e2-e3'])).toBeUndefined();
});


test('a full read restores every move beyond the recent command window', () => {
  const initial_fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
  const actions = ['a2-a3','a7-a6','b2-b3','b7-b6','c2-c3','c7-c6','d2-d3','d7-d6','e2-e3','e7-e6','f2-f3','f7-f6'];
  let pos = fromFen(initial_fen);
  for (const lan of actions) pos = applyLan(pos, lan, {})!.pos;
  const next = view({fen:toFen(pos),history:{initial_fen,actions},last_commands:[]});
  expect(replayHistory(next, {})?.map(step => step.lan)).toEqual(actions);
  expect(replayHistory({...next,fen:initial_fen}, {})).toBeUndefined();
});

test('Firewall names the card action on the shared move text path', () => {
  const rules = {hands:[['Firewall'],['Firewall']] as const};
  setRules(rules);
  const pre = fromFen('7k/8/8/8/8/8/P7/K7 w - - 0 1');
  expect(applyLan(pre, '!P', rules)?.words).toBe('White uses Firewall to protect all its pieces until its next turn.');
});


test('time left uses server time and elapsed time, with no deadline after the game ends', () => {
  const daily = view({deadline_at:'2026-10-11T18:00:00Z'});
  expect(timeLeft(daily)).toBe('18 h left');
  expect(timeLeft(daily, 17 * 3600000 + 30 * 60000)).toBe('30 min left');
  expect(timeLeft(daily, 18 * 3600000)).toBe('Time is up');
  expect(timeLeft({...daily, status:'finished'})).toBe('');
  expect(timeLeft({...daily, deadline_at:null})).toBe('');
  expect(timeLeft({...daily, deadline_at:'bad'})).toBe('');
});
