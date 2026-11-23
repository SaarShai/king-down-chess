import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { parseSync, transformSync } from 'rolldown/utils';
import { afterEach, expect, it } from 'vitest';
import { fixtureService } from '../../../tools/plugin-protocol-fixture';
import { createMatch, loadMatch, type MatchSetup } from '../../match';
import { onlineClient } from '../../online/client';
import { findKing, parseSq, sqName, type Move, type Position } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { peopleController, type PeopleController, type PeopleState } from '../people/controller';
import { fakeServer, memoryStorage } from '../people/fake-server';
import { lastTurnOf } from '../people/replica';
import { peopleServer } from '../people/server';
import { lastReplySteps, replayController, undoReplayState } from './replay';
import { castOf } from './cast';
import { stateMarks } from './marks';
import { DraftTurn } from './turn';

const filename = new URL('./main.ts', import.meta.url);
const source = readFileSync(filename, 'utf8');
const names = ['receiveOnline', 'skipBoard', 'tap', 'undoOrReplay', 'playReply', 'replyMotion', 'newCheck', 'holdMate', 'armResult', 'castBeat'];
const declarations = parseSync(filename.pathname, source).program.body
  .filter(node => node.type === 'FunctionDeclaration' && names.includes(node.id?.name ?? ''));
// Run the play screen's real live-update and Replay handlers with a recording board.
const page = transformSync(filename.pathname, declarations.map(node => source.slice(node.start, node.end)).join('\n')).code;

const playLabel = (move: Move) => [sqName(move.from), sqName(move.to), move.swap ? 'swap' : move.power].filter(Boolean).join(' ');
const settle = () => new Promise<void>(resolve => setImmediate(resolve));
const services: ReturnType<typeof fixtureService>[] = [];
afterEach(async () => { await Promise.all(services.splice(0).map(service => service.close())); });

async function match({ hand, ...setup }: MatchSetup = { backRank: 'RBNMQKNR' }) {
  const games = fixtureService({ createMatch: input => createMatch({ ...input, hand }), loadMatch });
  services.push(games);
  const id = await games.seedPosition(setup, true);
  const server = fakeServer(games);
  const pageEngine = (await games.view('bob', id)).engine_fingerprint ?? undefined;
  async function open(actor: string) {
    const api = onlineClient({ token: async () => actor, fetch: server.fetch, wait: async () => {} });
    const client = peopleController({ server: peopleServer(api), userId: actor, storage: memoryStorage(), pageEngine });
    await client.open(id);
    expect(client.state().engine).toBe('local');
    return client;
  }
  return { light: await open('bob'), dark: await open('alice'), open, server, games, id };
}

function boardFor(previous: PeopleState, { mount = false, reduce = '', inApp = false } = {}) {
  const plays: string[] = [], positions: string[] = [], falls: string[] = [], checks: string[] = [], casts: string[] = [], cancels: string[] = [], noop = () => {};
  let shown = toFen(previous.position!), complete: (() => void) | undefined;
  let animation = 0, hold = false;
  // The real hold and deadline timers run on this clock; `tick` moves it.
  const timers = new Map<number, { run: () => void; at: number }>(), listeners = new Set<() => void>();
  let clock = 0, ids = 0;
  const tick = (ms: number) => { clock += ms; for (const [id, timer] of [...timers].sort((a, b) => a[1].at - b[1].at)) if (timer.at <= clock && timers.delete(id)) timer.run(); };
  const document = {
    hidden: false, querySelector: () => null, documentElement: { dataset: { motion: reduce === 'page' ? 'reduce' : '' } },
    addEventListener: (_: string, run: () => void, { signal }: { signal: AbortSignal }) => { listeners.add(run); signal.addEventListener('abort', () => listeners.delete(run)); },
  };
  const scope = {
    receiveOnline(_state: PeopleState) {}, undoOrReplay() {}, tap(_square: number) {},
    onlineActive: true, onlineState: previous, shownRevision: mount ? -1 : previous.view!.revision,
    onlineReconnecting: false, thinking: !previous.draft, generation: 1, reading: 'normal', ended: previous.phase === 'over',
    mountingOnline: false, inApp, pieceView: reduce === 'symbols' ? 'symbols' : 'figures', motion: 'normal', fault: null, selected: null,
    board: {
      setPosition(pos: Position) { shown = toFen(pos); positions.push(shown); },
      async play(move: Move, after: Position, land?: () => void) {
        const own = animation;
        plays.push(playLabel(move));
        if (hold) await new Promise<void>(resolve => { complete = resolve; });
        if (own === animation) { shown = toFen(after); land?.(); }
      },
      skip() { animation++; },
    },
    screen: { dataset: { replaying: 'false' } }, detail: { dataset: {}, querySelectorAll: () => [] }, document,
    lastReplySteps, lastTurnOf, undoReplayState, DraftTurn, toFen, boardReplay: replayController(),
    cpu: () => (previous.view!.seat ^ 1), calm: () => document.documentElement.dataset.motion === 'reduce',
    matchMedia: () => ({ matches: reduce === 'system' }),
    takeOnlineNotice: () => '', clearChoice: noop, turnActions: () => [], turnText: () => '',
    update: noop, announce: noop, arrangementWaiting: () => false, replyText: () => '',
    onlineRecovery: noop, automaticReady: noop, closeFloating: noop, drawMarks: noop,
    beat: undefined, casting: undefined, castOf, castIn: (family: string, tiles: { square: number }[]) => { const cast = `${family} ${tiles.map(t => sqName(t.square)).join(' ')}`; casts.push(cast); return { cancel: () => cancels.push(cast), finish: noop }; }, nodes: { title: {} }, rewind: undefined, endCardFlight: noop, cancelCheckPulse: noop, endReply: null,
    passTurn: noop, endSeal: noop, onlineResult: () => 'You win.', closeStaleDialogs: noop, playOnlineKingResult: () => falls.push(shown),
    findKing, stateMarks, drawCheckIn: (pos: Position) => checks.push(toFen(pos)), endResult: undefined, mateHold: undefined,
    setTimeout: (run: () => void, ms: number) => { timers.set(++ids, { run, at: clock + ms }); return ids; }, clearTimeout: (id: number) => timers.delete(id),
    AbortController, closeIn: () => ({ cancel: noop, finish: noop }), reducedMotion: () => false,
    refuse: (error: string) => { throw new Error(error); },
    cells: Array.from({ length: 64 }, (_, square) => ({ square, getBoundingClientRect: () => ({}), classList: { remove: noop } })), armedResource: noop, gameHelp: undefined, choice: [], refusalReason: noop,
    cue: noop, freezeArmed: () => false, typeOf: () => 1, colorOf: () => previous.view!.seat,
    PLAIN_KINGS: [], learningEntry: () => ({ short: '' }), nameOf: () => 'Pawn', sqName, text: {},
  };
  runInNewContext(page, scope, { filename: filename.pathname });
  const hide = () => { document.hidden = true; listeners.forEach(run => run()); };
  return { scope, plays, positions, falls, checks, casts, cancels, tick, hide, timers: () => timers.size + listeners.size, shown: () => shown, hold: () => { hold = true; }, complete: () => complete?.() };
}

async function send(client: PeopleController, moves: readonly (readonly [string, string])[], arm?: string) {
  if (arm) client.arm(arm);
  for (const [from, to] of moves) {
    const move = client.state().draft!.at(parseSq(from), parseSq(to))[0];
    expect(move, `${from} ${to}`).toBeDefined();
    client.stage(move);
  }
  expect(await client.send()).toBe(true);
}

const opening = [['c1', 'd3'], ['c8', 'd6']] as const;
const turns: { name: string; setup?: MatchSetup; moves: [string, string][]; plays: string[]; casts?: string[]; prefix?: readonly (readonly [string, string])[]; arm?: string }[] = [
  { name: 'Light pawn swap', moves: [['d1', 'd2']], plays: ['d1 d2 swap'], prefix: opening },
  { name: 'Dark pawn swap', moves: [['d8', 'd7']], plays: ['d8 d7 swap'], prefix: [...opening, ['d1', 'd2'], ['d6', 'c8'], ['d3', 'c1']] },
  { name: 'Maester and queen swap', moves: [['d1', 'e1']], plays: ['d1 e1 swap'], prefix: opening },
  { name: 'normal move', moves: [['a2', 'a3']], plays: ['a2 a3'], prefix: opening },
  { name: 'Haste turn', moves: [['b1', 'c3'], ['c3', 'd5']], plays: ['b1 c3 haste', 'c3 d5'], casts: ['shift b1 c3'], arm: 'haste',
    setup: { fen: '7k/7p/8/8/8/8/7P/KN6 w - - 0 1', kings: 'Flame:Haste,none' } },
  { name: 'Curse card', moves: [['d5', 'c5']], plays: ['d5 c5 curse'], casts: ['shift d5 c5'], arm: 'curse',
    setup: { fen: '7k/7p/8/3n4/8/8/7P/K7 w - - 0 1', hand: ['Curse'] } },
];

it.each(turns)('plays a new $name once, from the prior position to the server position', async turn => {
  const { light, dark, games, id } = await match(turn.setup);
  let sender = light, receiver = dark;
  for (const move of turn.prefix ?? []) {
    await send(sender, [move]);
    await receiver.refresh();
    [sender, receiver] = [receiver, sender];
  }
  const start = receiver.state();
  const board = boardFor(start), echo = boardFor(sender.state());
  receiver.subscribe(board.scope.receiveOnline);
  sender.subscribe(echo.scope.receiveOnline);
  await send(sender, turn.moves, turn.arm);
  await receiver.refresh();
  await settle();
  const server = await games.view(sender === light ? 'alice' : 'bob', id);
  expect(board.plays).toEqual(turn.plays);
  expect(board.positions[0]).toBe(toFen(start.position!));
  expect(board.shown()).toBe(server.fen);
  expect(toFen(sender.state().position!)).toBe(server.fen);
  expect(echo.plays).toEqual([]);
  // The opponent's card plays its cast beat once (a Haste at its first move); a repeated revision plays none, Replay plays it again.
  const casts = turn.casts ?? [];
  expect(board.casts).toEqual(casts);
  expect(echo.casts).toEqual([]);
  await receiver.refresh();
  expect(board.plays).toEqual(turn.plays);
  expect(board.casts).toEqual(casts);
  board.scope.undoOrReplay();
  await settle();
  expect(board.plays).toEqual([...turn.plays, ...turn.plays]);
  expect(board.casts).toEqual([...casts, ...casts]);
  expect(board.shown()).toBe(server.fen);
}, 15_000);

it('the second move of an online Haste clears the beat of the first', async () => {
  const { light, dark } = await match(turns.find(turn => turn.name === 'Haste turn')!.setup);
  const board = boardFor(dark.state());
  board.hold();
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['b1', 'c3'], ['c3', 'd5']], 'haste');
  await dark.refresh();
  await settle();
  board.complete();
  await settle();
  // The second move travels now: the first move's beat has gone.
  expect(board.plays).toEqual(['b1 c3 haste', 'c3 d5']);
  expect(board.casts).toEqual(['shift b1 c3']);
  expect(board.cancels).toEqual(['shift b1 c3']);
  board.complete();
}, 15_000);

it('Replay in the Symbols view, where moves show at once, plays no cast beat', async () => {
  const { light, dark } = await match(turns.find(turn => turn.name === 'Curse card')!.setup);
  const board = boardFor(dark.state(), { reduce: 'symbols' });
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['d5', 'c5']], 'curse');
  await dark.refresh();
  board.scope.undoOrReplay();
  await settle();
  expect(board.plays).toEqual(['d5 c5 curse']);
  expect(board.casts).toEqual([]);
}, 15_000);

it.each(['page', 'system', 'symbols', 'app'])('shows the server board at once with %s settings', async setting => {
  const { light, dark } = await match();
  const board = boardFor(dark.state(), { reduce: setting, inApp: setting === 'app' });
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['a2', 'a3']]);
  await dark.refresh();
  const final = toFen(dark.state().position!);
  expect(board.plays).toEqual([]);
  expect(board.positions).toEqual([final]);
});

it('opens a reload on the server board and leaves the turn available for Replay', async () => {
  const { light, open } = await match();
  await send(light, [['a2', 'a3']]);
  const dark = await open('alice'), board = boardFor(dark.state(), { mount: true });
  board.scope.receiveOnline(dark.state());
  expect(board.plays).toEqual([]);
  expect(board.positions).toEqual([toFen(dark.state().position!)]);
  board.scope.undoOrReplay();
  await settle();
  expect(board.plays).toEqual(['a2 a3']);
});

it('shows the final board when a turn arrives on reconnect', async () => {
  const { light, dark } = await match();
  const board = boardFor(dark.state()), net = new EventTarget(), stop = dark.start({ net });
  dark.subscribe(board.scope.receiveOnline);
  try {
    net.dispatchEvent(new Event('offline'));
    await send(light, [['a2', 'a3']]);
    const arrived = new Promise<void>(resolve => dark.subscribe(state => { if (state.received) resolve(); }));
    net.dispatchEvent(new Event('online'));
    await arrived;
    expect(board.plays).toEqual([]);
    expect(board.positions).toEqual([toFen(dark.state().position!)]);
  } finally { stop(); }
});

it('plays one new turn when a draw offer arrives with it', async () => {
  const { light, dark } = await match();
  const board = boardFor(dark.state());
  dark.subscribe(board.scope.receiveOnline);
  expect(await light.offerDraw()).toBe(true);
  await send(light, [['a2', 'a3']]);
  await dark.refresh();
  await settle();
  expect(board.plays).toEqual(['a2 a3']);
  expect(board.shown()).toBe(toFen(dark.state().position!));
});

async function heldHaste() {
  const { light, dark } = await match(turns[4].setup);
  const board = boardFor(dark.state());
  board.hold();
  const unsubscribe = dark.subscribe(board.scope.receiveOnline);
  await send(light, [['b1', 'c3'], ['c3', 'd5']], 'haste');
  await dark.refresh();
  expect(board.plays).toEqual(['b1 c3 haste']);
  return { light, dark, board, unsubscribe };
}

it('ends playback on a board tap and acts on that tap', async () => {
  const { dark, board } = await heldHaste();
  const pawn = parseSq('h7');
  board.scope.tap(pawn);
  expect(board.scope.selected).toBe(pawn);
  expect(board.shown()).toBe(toFen(dark.state().position!));
  board.complete();
  await settle();
  expect(board.plays).toEqual(['b1 c3 haste']);
});

it('puts a newer two-turn update on the board at once and stops old playback', async () => {
  const { light, dark, board, unsubscribe } = await heldHaste();
  unsubscribe();
  await send(dark, [['h7', 'h6']]);
  await light.refresh();
  await send(light, [['h2', 'h3']]);
  dark.subscribe(board.scope.receiveOnline);
  await dark.refresh();
  const final = toFen(dark.state().position!);
  expect(board.shown()).toBe(final);
  board.complete();
  await settle();
  expect(board.plays).toEqual(['b1 c3 haste']);
  expect(board.shown()).toBe(final);
});

it('plays a live checkmate before the king falls and opens History at the final position', async () => {
  const { light, dark, open } = await match({ fen: '7k/p7/5KQ1/8/8/8/8/8 w - - 0 1', kings: 'none,none' });
  const board = boardFor(dark.state());
  board.hold();
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['g6', 'g7']]);
  await dark.refresh();
  expect(dark.state().view?.result?.reason).toBe('checkmate');
  expect(board.plays).toEqual(['g6 g7']);
  expect(board.falls).toEqual([]);
  board.complete();
  await settle();
  const final = toFen(dark.state().position!);
  // The checkmate hold: the check draws in at the landing, the lines stand 600 ms, then the card and the fall.
  expect(board.checks).toEqual([final]);
  board.tick(599);
  expect([board.falls, board.scope.reading]).toEqual([[], 'normal']);
  board.tick(1);
  expect([board.falls, board.scope.reading, board.timers()]).toEqual([[final], 'result', 0]);
  const history = await open('alice'), entry = boardFor(history.state(), { mount: true });
  entry.scope.receiveOnline(history.state());
  expect(entry.plays).toEqual([]);
  expect(entry.falls).toEqual([]);
  expect(entry.shown()).toBe(final);
});

async function liveMate() {
  const { light, dark } = await match({ fen: '7k/p7/5KQ1/8/8/8/8/8 w - - 0 1', kings: 'none,none' });
  const board = boardFor(dark.state());
  board.hold();
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['g6', 'g7']]);
  await dark.refresh();
  return { dark, board };
}

it('a live checkmate whose playback waits on a hidden page shows the card at once', async () => {
  const { dark, board } = await liveMate();
  expect(board.scope.reading).toBe('normal');
  board.hide();
  expect([board.scope.reading, board.falls, board.timers()]).toEqual(['result', [toFen(dark.state().position!)], 0]);
});

it('a live checkmate whose playback never ends shows the card 3 s after the mate arrives', async () => {
  const { dark, board } = await liveMate();
  board.tick(2999);
  expect(board.scope.reading).toBe('normal');
  board.tick(1);
  expect([board.scope.reading, board.falls, board.timers()]).toEqual(['result', [toFen(dark.state().position!)], 0]);
});

it('a lost connection or a repeated revision during the hold keeps the card back; one hold, then one card', async () => {
  const { dark, board } = await liveMate();
  board.complete();
  await settle();
  board.scope.receiveOnline({ ...dark.state(), connection: 'offline' });
  board.scope.receiveOnline(dark.state());
  expect([board.scope.reading, board.falls]).toEqual(['normal', []]);
  board.tick(600);
  expect([board.scope.reading, board.falls.length, board.timers()]).toEqual(['result', 1, 0]);
});

it('leaving the game during the hold leaves no timer and opens no card', async () => {
  const { board } = await liveMate();
  board.complete();
  await settle();
  (board.scope.endResult as unknown as () => void)();
  expect(board.timers()).toBe(0);
  board.tick(5000);
  expect([board.scope.reading, board.falls]).toEqual(['normal', []]);
});

it('a live check draws in when the playback shows it; a manual Replay shows it at once', async () => {
  const { light, dark } = await match({ fen: '7k/p7/8/8/8/8/8/3Q2K1 w - - 0 1', kings: 'none,none' });
  const board = boardFor(dark.state());
  dark.subscribe(board.scope.receiveOnline);
  await send(light, [['d1', 'd4']]);
  await dark.refresh();
  await settle();
  expect(board.checks).toEqual([toFen(dark.state().position!)]);
  board.scope.undoOrReplay();
  await settle();
  expect([board.plays, board.checks.length]).toEqual([['d1 d4', 'd1 d4'], 1]);
});
