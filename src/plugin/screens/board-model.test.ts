import { afterEach, expect, test } from 'vitest';
import type { Page } from '../../account-game/state';
import type { View } from '../../match/protocol';
import { fromFen, toFen, toLan } from '../../rules/setup';
import { legalMoves, setRules, status, type CardName, type Rules } from '../../rules/engine';
import { applyLan, boardActions, cardCoins, cardUseReason, draftChoices, draftTurn, replayHistory, replayLans, restoreDraft, sendActions, stripLine, timeLeft, type BoardMove } from './board-model';

const view = (fields: Partial<View> = {}): View => ({ game_id: 'game', revision: 2, created_at: '2026-10-11T00:00:00Z', abort_open: false, seat: 0, kind: 'friend', speed: 'daily', days_per_move: 3, status: 'playing', turn: 1, action: 'waiting', fen: '7k/8/8/8/8/8/P7/K7 b - - 0 1', in_check: false, legal: [], last_commands: [], opponent: null, draw_offer: null, deadline_at: '2026-10-11T00:00:01Z', server_now: '2026-10-11T00:00:00Z', ...fields });

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1';
const HASTE = '7k/p7/8/8/8/8/8/R5K1 w - - 0 1';
const FREEZE = '4k3/p7/8/3n4/8/8/P7/4K3 w - - 0 1';
const hasteRules: Partial<Rules> = { hands: [['Haste'], []], hasteCaptures: false };
const freezeRules: Partial<Rules> = { hands: [['Freeze'], []], markFree: true };
const stage = (fen: string, lans: string[], rules: Partial<Rules> = {}) => {
  setRules(rules);
  const pre = fromFen(fen), steps: BoardMove[] = [];
  let pos = pre;
  for (const lan of lans) {
    const step = applyLan(pos, lan, rules);
    if (!step) throw new Error(`Illegal test move: ${lan}`);
    steps.push(step); pos = step.pos;
  }
  return { pre, pos, steps };
};

afterEach(() => setRules());

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

test('an empty draft has no turn to send', () => {
  const { pos, steps } = stage(START, []);
  expect(draftTurn(steps, pos, 'computer', 0)).toEqual({ staged: 0, midWay: false, waits: false, ready: false, line: '' });
  expect(sendActions(steps, pos, 0)).toEqual([]);
});

test('one move waits for the press and uses the words for each game mode', () => {
  const { pos, steps } = stage(START, ['e2-e4']);
  const before = structuredClone({ pos, steps });
  expect(draftTurn(steps, pos, 'computer', 0)).toEqual({ staged: 1, midWay: false, waits: true, ready: true, line: 'Your turn is ready. Select End turn.' });
  expect(draftTurn(steps, pos, 'link', 0).line).toBe('Your turn is ready. Select Send your turn.');
  expect(sendActions(steps, pos, 0)).toEqual(['e2-e4']);
  expect({ pos, steps }).toEqual(before);
});

test('a staged check uses the check line in each game mode', () => {
  const { pos, steps } = stage('7k/8/8/8/8/8/8/K5R1 w - - 0 1', ['Rg1-h1']);
  expect(status(pos)).toBe('playing');
  expect(draftTurn(steps, pos, 'computer', 0).line).toBe('Check. Your turn is ready. Select End turn.');
  expect(draftTurn(steps, pos, 'link', 0).line).toBe('Check. Select Send your turn.');
});

test('the first Haste move permits a second move or a pass', () => {
  const { pos, steps } = stage(HASTE, ['Ra1-a4!H'], hasteRules);
  expect(draftTurn(steps, pos, 'link', 0)).toEqual({ staged: 1, midWay: true, waits: false, ready: true, line: 'Move it again, or select Send your turn.' });
  expect(sendActions(steps, pos, 0)).toEqual(['Ra1-a4!H', '--']);
});

test.each(['Ra4-e4', '--'])('Haste ends with %s and adds no extra pass', lan => {
  const { pos, steps } = stage(HASTE, ['Ra1-a4!H', lan], hasteRules);
  expect(draftTurn(steps, pos, 'computer', 0)).toMatchObject({ staged: 2, midWay: false, waits: true, ready: true });
  expect(sendActions(steps, pos, 0)).toEqual(['Ra1-a4!H', lan]);
});

test('a Haste move at the draw limit waits and adds no pass', () => {
  const { pos, steps } = stage(HASTE.replace(' 0 1', ' 99 1'), ['Ra1-a4!H'], hasteRules);
  expect(status(pos)).toBe('draw50');
  expect(draftTurn(steps, pos, 'computer', 0)).toMatchObject({ staged: 1, midWay: true, waits: true, ready: true });
  expect(sendActions(steps, pos, 0)).toEqual(['Ra1-a4!H']);
  expect(draftChoices(view(), pos, steps)).toEqual([]);
});

test('a free Freeze permits a move or the press', () => {
  const { pos, steps } = stage(FREEZE, ['!F:d5'], freezeRules);
  expect(draftTurn(steps, pos, 'computer', 0)).toEqual({ staged: 1, midWay: true, waits: false, ready: true, line: 'Now make your move, or select End turn.' });
  const actions = sendActions(steps, pos, 0);
  expect(actions).toEqual(['!F:d5', '--']);
  const sent = stage(FREEZE, actions, freezeRules);
  expect(draftTurn(sent.steps, sent.pos, 'computer', 0)).toMatchObject({ staged: 2, midWay: false, waits: true, ready: true });
});

test('a move after Freeze makes the turn wait', () => {
  const { pos, steps } = stage(FREEZE, ['!F:d5', 'a2-a3'], freezeRules);
  expect(draftTurn(steps, pos, 'computer', 0)).toMatchObject({ staged: 2, midWay: false, waits: true, ready: true });
  expect(sendActions(steps, pos, 0)).toEqual(['!F:d5', 'a2-a3']);
});

test('Rally permits only another piece to make a quiet move', () => {
  const rules: Partial<Rules> = { hands: [['Rally'], []] };
  const { pos, steps } = stage('4k3/8/p7/8/8/2p5/8/RN2K3 w - - 0 1', ['Ra1-a5!J'], rules);
  expect(draftTurn(steps, pos, 'computer', 0).line).toBe('Move another piece, or select End turn.');
  expect(sendActions(steps, pos, 0)).toEqual(['Ra1-a5!J', '--']);
  const choices = draftChoices(view(), pos, steps).map(choice => choice.lan);
  expect(choices).toContain('Nb1-d2');
  expect(choices).not.toContain('Nb1xc3');
  expect(choices.some(lan => lan.startsWith('Ra5'))).toBe(false);
  const second = applyLan(pos, 'Nb1-d2', rules)!;
  expect(draftTurn([...steps, second], second.pos, 'computer', 0)).toMatchObject({ staged: 2, waits: true, ready: true });
});

test.each([
  ['checkmate', '7k/5Q2/6K1/8/8/8/8/8 w - - 0 1', 'Qf7-g7', 'checkmate'],
  ['king capture', '7k/8/8/8/8/8/8/K6R w - - 0 1', 'Rh1xh8', 'checkmate'],
  ['stalemate', '7k/8/6Q1/8/8/8/8/K7 w - - 0 1', 'Qg6-f7', 'stalemate'],
  ['50 moves', '7k/8/8/8/8/8/8/K6R w - - 99 1', 'Rh1-h2', 'draw50'],
  ['material draw', '7k/8/8/8/8/2b5/1B6/K7 w - - 0 1', 'Bb2xc3', 'drawMaterial'],
])('a staged %s waits for the press', (_name, fen, lan, end) => {
  const { pos, steps } = stage(fen, [lan]);
  expect(status(pos)).toBe(end);
  expect(draftTurn(steps, pos, 'computer', 0)).toMatchObject({ staged: 1, waits: true, ready: true });
  expect(draftTurn(steps, pos, 'link', 0).line).toBe(`${end === 'checkmate' ? 'Checkmate.' : end === 'stalemate' ? 'Stalemate.' : 'Draw.'} Select Send your turn.`);
  expect(sendActions(steps, pos, 0)).toEqual([lan]);
  expect(draftChoices(view(), pos, steps)).toEqual([]);
});

test.each([
  [HASTE, 'Ra1-a4!H', hasteRules, 'Move it again'],
  [FREEZE, '!F:d5', freezeRules, 'Now make your move'],
] as const)('a saved half turn with no draft steps can send a pass (%s)', (fen, lan, rules, next) => {
  const { pos } = stage(fen, [lan], rules);
  expect(draftTurn([], pos, 'computer', 0)).toEqual({ staged: 0, midWay: true, waits: false, ready: true, line: `${next}, or select End turn.` });
  expect(draftTurn([], pos, 'link', 0).line).toBe(`${next.replace('Now make', 'Make')}, or select Send your turn.`);
  expect(sendActions([], pos, 0)).toEqual(['--']);
});

test.each([
  [0, 'computer'], [0, 'link'], [1, 'computer'], [1, 'link'],
] as const)('only seat %s can send its saved half turn in %s mode', (seat, mode) => {
  const fen = seat === 0 ? HASTE : 'r5k1/8/8/8/8/8/P7/7K b - - 0 1';
  const lan = seat === 0 ? 'Ra1-a4!H' : 'Ra8-b8!H';
  const { pos } = stage(fen, [lan], { hands: [['Haste'], ['Haste']], hasteCaptures: false });
  expect(pos.turn).toBe(seat);
  expect(draftTurn([], pos, mode, seat)).toMatchObject({ staged: 0, midWay: true, ready: true });
  expect(sendActions([], pos, seat)).toEqual(['--']);
  const opponent = seat === 0 ? 1 : 0;
  expect(draftTurn([], pos, mode, opponent)).toMatchObject({ staged: 0, midWay: true, ready: false });
  expect(sendActions([], pos, opponent)).toEqual([]);
});

test('a half turn cannot send a pass that leaves its king in check', () => {
  const { pos, steps } = stage('7k/8/8/8/8/8/r7/K6R w - - 0 1 u1.0/f', [], freezeRules);
  expect(draftTurn(steps, pos, 'computer', 0).ready).toBe(false);
  expect(sendActions(steps, pos, 0)).toEqual([]);
});

test('the lab double first turn has no pass and needs the second move', () => {
  const rules = { secondPlayerDoubleFirstTurn: true };
  const { pos, steps } = stage(START.replace(' w ', ' b '), ['e7-e5'], rules);
  expect(draftTurn(steps, pos, 'computer', 1)).toMatchObject({ staged: 1, midWay: false, waits: false, ready: false });
  expect(sendActions(steps, pos, 1)).toEqual(['e7-e5']);
  const second = applyLan(pos, 'd7-d6', rules)!;
  expect(draftTurn([...steps, second], second.pos, 'computer', 1)).toMatchObject({ staged: 2, waits: true, ready: true });
  expect(sendActions([...steps, second], second.pos, 1)).toEqual(['e7-e5', 'd7-d6']);
});

test('Undo restores the mark, spent card and coin state from the prior position', () => {
  const { pre, steps } = stage(FREEZE, ['!F:d5', 'a2-a3'], freezeRules);
  const before = structuredClone(pre), hand = freezeRules.hands![0];
  let pos = steps.pop()!.pre;
  expect(pos.marks?.[0]).toEqual(steps[0].pos.marks?.[0]);
  expect(cardCoins(pos, 0, hand, legalMoves(pos))[0].spent).toBe(true);
  pos = steps.pop()!.pre;
  expect(pos).toEqual(before);
  expect(pos.marks).toBeUndefined();
  expect(cardCoins(pos, 0, hand, legalMoves(pos))[0]).toMatchObject({ spent: false, moves: expect.arrayContaining([expect.objectContaining({ power: 'freeze' })]) });
  expect(draftTurn(steps, pos, 'computer', 0).staged).toBe(0);
});

test('a Beast chain is one draft step', () => {
  const { pre, pos, steps } = stage('k7/8/8/4r3/3p4/4S3/8/4K3 w - - 0 1', ['Se3xd4xe5']);
  expect(steps[0].move.captures).toHaveLength(2);
  expect(draftTurn(steps, pos, 'computer', 0)).toMatchObject({ staged: 1, waits: true, ready: true });
  expect(sendActions(steps, pos, 0)).toEqual(['Se3xd4xe5']);
  expect(steps.pop()!.pre).toBe(pre);
});

test('choices use the server list at the start, local moves after it, and none while waiting', () => {
  const { pre, pos, steps } = stage(HASTE, ['Ra1-a4!H'], hasteRules);
  const base = view({ legal: ['Ra1-a4!H', 'bad LAN'] });
  expect(draftChoices(base, pre, []).map(choice => choice.lan)).toEqual(['Ra1-a4!H']);
  const choices = draftChoices(base, pos, steps);
  expect(choices.map(choice => choice.lan)).toContain('Ra4-e4');
  expect(choices.map(choice => choice.move)).toEqual(legalMoves(pos));
  const second = applyLan(pos, 'Ra4-e4', hasteRules)!;
  expect(draftChoices(base, second.pos, [...steps, second])).toEqual([]);
});

test('restore keeps a legal draft across a new revision with the same tag and FEN', () => {
  const { steps } = stage(HASTE, ['Ra1-a4!H', 'Ra4-e4'], hasteRules);
  const base = view({ game_id: '12345678-private', fen: HASTE, turn: 0, action: 'ready', legal: ['Ra1-a4!H'] });
  const saved = { game_tag: '12345678', fen: HASTE, lans: steps.map(step => step.lan) };
  const before = structuredClone({ base, saved });
  setRules({});
  expect(restoreDraft(base, saved, hasteRules)).toEqual(steps);
  expect(restoreDraft({ ...base, revision: 9, draw_offer: 1 }, saved, hasteRules)).toEqual(steps);
  expect({ base, saved }).toEqual(before);
  expect(restoreDraft(base, { ...saved, lans: [] }, hasteRules)).toEqual([]);
  expect(restoreDraft(base, undefined, hasteRules)).toBeUndefined();
});

test('restore sets the rules before it reads a FEN with castling rights', () => {
  const rules = { classicChess: true };
  const { pre, steps } = stage('4k3/8/8/8/8/8/8/4K2R w K - 0 1', ['O-O'], rules);
  const fen = toFen(pre), base = view({ fen, action: 'ready', legal: ['O-O'] });
  setRules({});
  expect(restoreDraft(base, { game_tag: 'game', fen, lans: ['O-O'] }, rules)).toEqual(steps);
});

test.each([
  { game_id: 'another-game' },
  { fen: START },
  { fen: '7k/8/p7/8/8/8/8/R5K1 w - - 0 1' },
  { status: 'finished' as const },
  { action: 'waiting' as const },
  { action: 'done' as const },
  { legal: [] },
])('restore drops a draft when the base does not agree: %j', fields => {
  const base = view({ fen: HASTE, action: 'ready', legal: ['Ra1-a4!H'], ...fields });
  expect(restoreDraft(base, { game_tag: 'game', fen: HASTE, lans: ['Ra1-a4!H'] }, hasteRules)).toBeUndefined();
});

test.each([
  { lans: ['bad LAN'] },
  { lans: ['Ra1-a4!H', 'Ra4-a9'] },
  { lans: ['Ra1-a4!H', 'Ra4-e4', 'Kh8-h7'] },
])('restore drops the whole draft for a refused replay: %j', ({ lans }) => {
  const base = view({ fen: HASTE, action: 'ready', legal: ['Ra1-a4!H'] });
  expect(restoreDraft(base, { game_tag: 'game', fen: HASTE, lans }, hasteRules)).toBeUndefined();
});


test('a card with no Use action gives one reason; a usable card gives no reason', () => {
  const move = {} as import('../../rules/engine').Move, card = { spent: false, moves: [move] }, game = view({ turn: 0, action: 'ready' }), pos = { turn: 0 as const };
  const page: Page = { screen: 'board', view: game, connected: true, mounting: false, writing: false };
  expect(cardUseReason(card, 0, game, pos, true, page)).toBe('');
  expect(cardUseReason({ ...card, spent: true }, 0, game, pos, true, page)).toBe('This card is spent.');
  expect(cardUseReason(card, 1, game, pos, true, page)).toBe("This is your opponent's card.");
  expect(cardUseReason(card, 0, { ...game, status: 'finished' }, pos, true, page)).toBe('This game has ended.');
  expect(cardUseReason(card, 0, { ...game, turn: 1 }, { turn: 1 }, false, page)).toBe('Use this card on your turn.');
  expect(cardUseReason(card, 0, game, { turn: 1 }, false, page)).toBe('Finish your turn before you use this card.');
  expect(cardUseReason(card, 0, game, pos, false, { ...page, writing: true })).toBe('Wait for the current action to finish.');
  expect(cardUseReason(card, 0, game, pos, false, page)).toBe('Finish your turn before you use this card.');
  expect(cardUseReason({ ...card, moves: [] }, 0, game, pos, true, page)).toBe('This card has no move now.');
  const pending = { name: 'kingdown_draw', args: {}, game_tag: 'game', error: 'Request failed' };
  expect(cardUseReason(card, 0, game, pos, false, { ...page, pending })).toBe('Close this sheet and select Retry.');
  const stale: Page = { ...page, notice: { kind: 'read', game: game.game_id, text: 'Read failed' } };
  expect(cardUseReason(card, 0, game, pos, false, stale)).toBe('Close this sheet and select Try again.');
  expect(cardUseReason(card, 0, game, pos, false, { ...stale, mounting: true })).toBe('Wait for the current action to finish.');
});

test('a failed ordinary move send names Retry for an unused card after the draft turn changes', () => {
  const { pre, pos, steps } = stage(HASTE, ['Ra1-a2'], hasteRules);
  const game = view({ turn: pre.turn, fen: HASTE, action: 'ready' });
  const coin = cardCoins(pos, 0, hasteRules.hands![0], [])[0];
  const page: Page = { screen: 'board', view: game, connected: true, mounting: false, writing: false,
    pending: { name: 'kingdown_move', args: { actions: sendActions(steps, pos, 0) }, game_tag: 'game', error: 'Request failed' } };
  expect(pos.turn).toBe(1);
  expect(coin.spent).toBe(false);
  expect(cardUseReason(coin, 0, game, pos, false, page)).toBe('Close this sheet and select Retry.');
  expect(cardUseReason(coin, 0, game, pos, false, { ...page, writing: true })).toBe('Wait for the current action to finish.');
});

test('a scoped draft requires the complete account, game, revision and rules', () => {
  const { steps } = stage(HASTE, ['Ra1-a4!H'], hasteRules);
  const base = view({ game_id: '12345678-private-a', fen: HASTE, turn: 0, action: 'ready', legal: ['Ra1-a4!H'] });
  const saved = { game_tag: '12345678', fen: HASTE, lans: ['Ra1-a4!H'], scope: { account: 'account-a', game: base.game_id, revision: base.revision, rules: JSON.stringify(hasteRules) } };
  expect(restoreDraft(base, saved, hasteRules, 'account-a')).toEqual(steps);
  expect(restoreDraft(base, saved, hasteRules, 'account-b')).toBeUndefined();
  expect(restoreDraft({ ...base, game_id: '12345678-private-b' }, saved, hasteRules, 'account-a')).toBeUndefined();
  expect(restoreDraft({ ...base, revision: base.revision + 1 }, saved, hasteRules, 'account-a')).toBeUndefined();
  expect(restoreDraft(base, saved, { ...hasteRules, hasteCaptures: true }, 'account-a')).toBeUndefined();
});
