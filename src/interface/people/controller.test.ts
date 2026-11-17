/** The people controller against a fake server: the website client, the REST paths and the protocol fixture's rules. */
import { afterEach, expect, it, vi } from 'vitest';
import { fixtureService } from '../../../tools/plugin-protocol-fixture';
import { DEFAULT_OPTIONS } from '../../match/setup';
import { onlineClient } from '../../online/client';
import { parseSq, type Move } from '../../rules/engine';
import { toFen } from '../../rules/setup';
import { Game } from '../../game';
import { peopleController, type PeopleController } from './controller';
import { fakeServer, memoryStorage, type FakeServer } from './fake-server';
import { receiptKey, receiptOf } from './receipt';
import { peopleServer } from './server';

const OPTIONS = { ...DEFAULT_OPTIONS, fairy: false, arrangement: false, classic: true };
const services: ReturnType<typeof fixtureService>[] = [];
afterEach(async () => { await Promise.all(services.splice(0).map(s => s.close())); vi.useRealTimers(); });

async function world() {
  const games = fixtureService(); services.push(games);
  for (const name of ['alice', 'bob', 'carol']) await games.handle(name, { handle: name });
  const server = fakeServer(games);
  const created = await games.create('alice', { kind: 'friend', colour: 'white', options: OPTIONS });
  const invite = await games.invite('alice', created.game_id);
  // The fixture's engine identity, from a solo game (it starts at once).
  const engine = (await games.create('carol', { kind: 'solo', options: OPTIONS })).engine_fingerprint ?? undefined;
  return { games, server, id: created.game_id, token: invite.token, engine };
}
let ids = 0;
function player(server: FakeServer, actor: string, extra: { pageEngine?: string; storage?: ReturnType<typeof memoryStorage> } = {}) {
  const api = onlineClient({ token: async () => actor, fetch: server.fetch, wait: async () => {} });
  const storage = extra.storage ?? memoryStorage();
  const controller = peopleController({ server: peopleServer(api), userId: actor, storage, online: () => !server.offline, uuid: () => `${actor}-${++ids}`, ...'pageEngine' in extra ? { pageEngine: extra.pageEngine } : { pageEngine: 'sha256:' + '0'.repeat(64) } });
  return { controller, storage };
}
/** A local-engine player: the page engine is the game's engine (M3). */
type World = Awaited<ReturnType<typeof world>>;
async function local(w: World, actor: string, storage = memoryStorage()) {
  expect(w.engine).toMatch(/^sha256:/);
  return player(w.server, actor, { pageEngine: w.engine, storage });
}
function move(c: PeopleController, from: string, to: string): Move {
  const draft = c.state().draft!; const found = draft.at(parseSq(from), parseSq(to))[0];
  expect(found, `${from}-${to}`).toBeTruthy(); return found;
}
async function play(c: PeopleController, from: string, to: string) { c.stage(move(c, from, to)); expect(await c.send()).toBe(true); }
const drafts = (server: FakeServer) => server.calls.filter(call => /^\/api\/games\/[^/]+\/preview$/.test(call.path));
const commands = (server: FakeServer, actor?: string) => server.calls.filter(call => call.method === 'POST' && call.path.endsWith('/commands') && (!actor || call.actor === actor));
async function started() {
  const w = await world(), bob = await local(w, 'bob');
  expect(await bob.controller.join({ token: w.token })).toBeUndefined();
  const alice = await local(w, 'alice'); await alice.controller.open(w.id);
  return { ...w, alice, bob };
}

it('joins by link, sends a whole turn with Send, and the opponent receives it', async () => {
  const w = await world(), bob = await local(w, 'bob');
  expect((await bob.controller.preview({ token: w.token }) as { creator: { handle: string } }).creator.handle).toBe('alice');
  expect(await bob.controller.join({ token: w.token })).toBeUndefined();
  expect(bob.controller.state()).toMatchObject({ phase: 'their-move', engine: 'local', connection: 'online' });
  expect(bob.controller.state().view!.seat).toBe(1);
  const alice = await local(w, 'alice'); await alice.controller.open(w.id);
  expect(alice.controller.state()).toMatchObject({ phase: 'your-move', canSend: false, sent: false });
  alice.controller.stage(move(alice.controller, 'e2', 'e4'));
  expect(alice.controller.state()).toMatchObject({ phase: 'staged', canSend: true });
  expect((await w.games.view('alice', w.id)).revision).toBe(1);
  expect(await alice.controller.send()).toBe(true);
  expect(alice.controller.state()).toMatchObject({ phase: 'their-move', sent: true });
  expect(alice.storage.records.size).toBe(0);
  await bob.controller.refresh();
  const s = bob.controller.state();
  expect(s.phase).toBe('your-move'); expect(s.received!.steps.map(step => [step.move.from, step.move.to])).toEqual([[parseSq('e2'), parseSq('e4')]]);
  expect(toFen(s.position!)).toBe((await w.games.view('bob', w.id)).fen);
  // A later open after the opponent moved shows that turn once more.
  await play(bob.controller, 'e7', 'e5');
  const again = await local(w, 'alice'); await again.controller.open(w.id);
  expect(again.controller.state().received!.steps.map(step => step.move.to)).toEqual([parseSq('e5')]);
  expect(drafts(w.server)).toHaveLength(0);
});

it('M3: the page engine judges a turn alone only when it is the game engine', async () => {
  const w = await started();
  expect(w.alice.controller.state().engine).toBe('local');
  await play(w.alice.controller, 'e2', 'e4');
  expect(drafts(w.server)).toHaveLength(0);
  const other = player(w.server, 'bob', { pageEngine: 'sha256:' + 'f'.repeat(64) }); await other.controller.open(w.id);
  expect(other.controller.state().engine).toBe('server');
  const unknown = player(w.server, 'bob', { pageEngine: undefined }); await unknown.controller.open(w.id);
  expect(unknown.controller.state().engine).toBe('server');
  w.server.calls.length = 0;
  await play(other.controller, 'e7', 'e5');
  expect(w.server.calls.filter(call => call.method === 'POST').map(call => call.path.split('/').at(-1))).toEqual(['preview', 'commands']);
  // The server refuses the turn in its check: nothing goes, the draft stays.
  const sent = commands(w.server, 'alice').length;
  const second = player(w.server, 'alice', { pageEngine: 'sha256:' + 'f'.repeat(64) }); await second.controller.open(w.id);
  second.controller.stage(move(second.controller, 'g1', 'f3'));
  w.server.fail({ path: /\/preview$/, kind: 'status', status: 400, code: 'INVALID_MOVE' });
  expect(await second.controller.send()).toBe(false);
  expect(second.controller.state()).toMatchObject({ phase: 'staged', notice: { kind: 'illegal' } });
  expect(commands(w.server, 'alice')).toHaveLength(sent);
});

it('a draw offer keeps the staged turn, and Send also declines it', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  expect(w.bob.controller.state().canOfferDraw).toBe(true);
  expect(await w.bob.controller.offerDraw()).toBe(true);
  expect(w.bob.controller.state()).toMatchObject({ draw: 'mine', drawsLeft: 2, canOfferDraw: false });
  await w.alice.controller.refresh();
  expect(w.alice.controller.state()).toMatchObject({ phase: 'staged', draw: 'theirs' });
  expect(await w.alice.controller.send()).toBe(true);
  await w.bob.controller.refresh();
  expect(w.bob.controller.state()).toMatchObject({ phase: 'your-move', draw: 'none', notice: { kind: 'draw-declined' } });
});

it('accepts a draw, resigns, and ends with no result before both players move', async () => {
  const draw = await started();
  await draw.bob.controller.offerDraw(); await draw.alice.controller.refresh();
  expect(await draw.alice.controller.answerDraw(true)).toBe(true);
  expect(draw.alice.controller.state().phase).toBe('over');
  expect(draw.alice.controller.state().view!.result).toEqual({ winner: null, reason: 'agreement' });
  const resign = await started();
  await play(resign.alice.controller, 'e2', 'e4'); await resign.bob.controller.refresh();
  await play(resign.bob.controller, 'e7', 'e5'); await resign.alice.controller.refresh();
  resign.alice.controller.stage(move(resign.alice.controller, 'g1', 'f3'));
  expect(await resign.alice.controller.resign()).toBe(true);
  expect(resign.alice.controller.state()).toMatchObject({ phase: 'over', draft: undefined });
  expect(resign.alice.controller.state().view!.result).toEqual({ winner: 1, reason: 'resignation' });
  const abort = await started();
  expect(abort.alice.controller.state().abortOpen).toBe(true);
  expect(await abort.alice.controller.abort()).toBe(true);
  expect(abort.alice.controller.state().view!.status).toBe('aborted');
});

it('offers and accepts a rematch; the new game has the sides swapped', async () => {
  const w = await started();
  await w.alice.controller.resign(); await w.bob.controller.refresh();
  expect(w.bob.controller.state().rematch).toBe('none');
  expect(await w.bob.controller.rematch('offer')).toBe(true);
  expect(w.bob.controller.state().rematch).toBe('mine');
  await w.alice.controller.refresh(); expect(w.alice.controller.state().rematch).toBe('theirs');
  expect(await w.alice.controller.rematch('accept')).toBe(true);
  const next = w.alice.controller.state();
  expect(next.rematch).toBe('accepted');
  await w.alice.controller.open(next.rematchGame!);
  expect(w.alice.controller.state()).toMatchObject({ phase: 'their-move' }); expect(w.alice.controller.state().view!.seat).toBe(1);
  // A declined offer says so on the offerer's side.
  const d = await started();
  await d.alice.controller.resign(); await d.bob.controller.refresh();
  await d.bob.controller.rematch('offer'); await d.alice.controller.refresh();
  expect(await d.alice.controller.rematch('decline')).toBe(true);
  await d.bob.controller.refresh(); expect(d.bob.controller.state().rematch).toBe('declined');
});

it('a stale turn keeps the draft and shows the new state; an illegal turn keeps the draft', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  await w.bob.controller.offerDraw(); // alice does not read it before Send
  expect(await w.alice.controller.send()).toBe(false);
  const s = w.alice.controller.state();
  expect(s).toMatchObject({ phase: 'staged', notice: { kind: 'stale' }, draw: 'theirs' });
  expect(s.draft!.length).toBe(1); expect(w.alice.storage.records.size).toBe(0);
  w.server.fail({ path: /\/commands$/, kind: 'status', status: 400, code: 'INVALID_MOVE' });
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state()).toMatchObject({ phase: 'staged', notice: { kind: 'illegal' } });
  expect(w.alice.storage.records.size).toBe(0);
  expect(await w.alice.controller.send()).toBe(true);
  expect(commands(w.server, 'alice').filter(call => (call.body as { action: { type: string } }).action.type === 'turn')).toHaveLength(3);
  expect((await w.games.view('alice', w.id)).revision).toBe(3);
});

it('a lost reply: Check again settles the turn with no second turn', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.fail({ path: /\/commands$/, kind: 'lost', times: 4 });
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state()).toMatchObject({ phase: 'checking', check: { tries: 0, canDiscard: false } });
  expect(JSON.parse(w.alice.storage.records.get(receiptKey('alice'))!).name).toBe('kingdown_move');
  expect(await w.alice.controller.check()).toBe(true);
  expect(w.alice.controller.state()).toMatchObject({ phase: 'their-move', sent: true, check: undefined });
  expect(w.alice.storage.records.size).toBe(0);
  expect(new Set(commands(w.server, 'alice').map(call => (call.body as { command_id: string }).command_id)).size).toBe(1);
  expect((await w.games.view('alice', w.id)).revision).toBe(2);
});

it('M12: a poll read with a higher revision settles a lost reply with no send', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.fail({ path: /\/commands$/, kind: 'lost', times: 4 });
  expect(await w.alice.controller.send()).toBe(false);
  const sends = commands(w.server, 'alice').length;
  await w.alice.controller.refresh();
  expect(w.alice.controller.state()).toMatchObject({ phase: 'their-move', sent: true, check: undefined });
  await vi.waitFor(() => expect(w.alice.storage.records.size).toBe(0));
  expect(commands(w.server, 'alice')).toHaveLength(sends);
});

it('no connection: the turn waits, and the online event sends it with the same ID', async () => {
  const w = await started(), net = new EventTarget(), page = Object.assign(new EventTarget(), { hidden: true });
  const stop = w.alice.controller.start({ page, net });
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.offline = true;
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state()).toMatchObject({ phase: 'staged', notice: { kind: 'offline' } });
  expect(commands(w.server, 'alice')).toHaveLength(0);
  // The connection goes during the send.
  w.server.offline = false; w.server.fail({ path: /\/commands$/, kind: 'network', times: 4 });
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state().phase).toBe('checking');
  w.server.offline = true; net.dispatchEvent(new Event('offline'));
  expect(w.alice.controller.state().connection).toBe('offline');
  w.server.offline = false; net.dispatchEvent(new Event('online'));
  await vi.waitFor(() => expect(w.alice.controller.state().phase).toBe('their-move'));
  expect(w.alice.controller.state()).toMatchObject({ connection: 'online', sent: true });
  expect(new Set(commands(w.server, 'alice').map(call => (call.body as { command_id: string }).command_id)).size).toBe(1);
  expect((await w.games.view('alice', w.id)).revision).toBe(2);
  stop();
});

it('M12: a saved command that cannot settle does not lock the account; Discard after two failed checks', async () => {
  const w = await started();
  // A second game of alice, with carol.
  const second = await w.games.create('alice', { kind: 'friend', colour: 'white', options: OPTIONS });
  await w.games.join('carol', (await w.games.invite('alice', second.game_id)).token);
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.fail({ path: new RegExp(w.id), kind: 'status', status: 503, code: 'UNAVAILABLE', times: 100 });
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state().check).toEqual({ game: w.id, tries: 0, canDiscard: false });
  expect(await w.alice.controller.check()).toBe(false);
  expect(w.alice.controller.state().check).toMatchObject({ tries: 1, canDiscard: false });
  expect(await w.alice.controller.discard()).toBe(false);
  // The other game: its command must wait for the saved one, as on the old page.
  const other = await local(w, 'alice', w.alice.storage); await other.controller.open(second.game_id);
  expect(other.controller.state().check).toEqual({ game: w.id, tries: 1, canDiscard: false });
  other.controller.stage(move(other.controller, 'd2', 'd4'));
  expect(other.controller.state()).toMatchObject({ phase: 'staged', canSend: false });
  expect(await other.controller.send()).toBe(false);
  expect(await other.controller.check()).toBe(false);
  expect(other.controller.state().check).toMatchObject({ tries: 2, canDiscard: true });
  expect(await other.controller.discard()).toBe(true);
  expect(w.alice.storage.records.size).toBe(0); expect(other.controller.state().canSend).toBe(true);
  expect(await other.controller.send()).toBe(true);
  expect((await w.games.view('alice', second.game_id)).revision).toBe(2);
});

it('M12: a read with a higher revision settles a saved command with no send', async () => {
  const w = await started();
  await play(w.alice.controller, 'e2', 'e4');
  const storage = memoryStorage(), stale = receiptOf(w.id, 0, { type: 'resign' }, 'old-page-id');
  storage.setItem(receiptKey('alice'), JSON.stringify(stale));
  const reopened = await local(w, 'alice', storage); w.server.calls.length = 0;
  await reopened.controller.open(w.id);
  expect(storage.records.size).toBe(0);
  expect(commands(w.server)).toHaveLength(0);
  expect(reopened.controller.state()).toMatchObject({ phase: 'their-move', check: undefined });
  // An unreadable receipt can go at once.
  storage.setItem(receiptKey('alice'), '{');
  await reopened.controller.open(w.id);
  expect(reopened.controller.state().check).toEqual({ game: null, tries: 2, canDiscard: true });
  expect(await reopened.controller.discard()).toBe(true);
});

it('the sign-in ends: the turn stays and goes after a new sign-in with the same ID', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.signOut('alice');
  expect(await w.alice.controller.send()).toBe(false);
  expect(w.alice.controller.state()).toMatchObject({ connection: 'auth', phase: 'checking', canSend: false });
  expect(w.alice.storage.records.size).toBe(1);
  w.server.signIn('alice');
  await w.alice.controller.signedIn();
  expect(w.alice.controller.state()).toMatchObject({ connection: 'online', phase: 'their-move', notice: { kind: 'signed-in' }, sent: true });
  expect(new Set(commands(w.server, 'alice').map(call => (call.body as { command_id: string }).command_id)).size).toBe(1);
});

it('time up: End the game before both players move, Claim the win after', async () => {
  const w = await started();
  await play(w.alice.controller, 'e2', 'e4');
  const past = new Date(Date.now() - 60_000).toISOString();
  w.games.seed('alice', { views: { [w.id]: { deadline_at: past } } });
  await w.alice.controller.open(w.id);
  expect(w.alice.controller.state()).toMatchObject({ claim: 'end', phase: 'their-move' });
  expect(w.alice.controller.state().clock.left!).toBeLessThan(0);
  const won = await started();
  await play(won.alice.controller, 'e2', 'e4'); await won.bob.controller.refresh(); await play(won.bob.controller, 'e7', 'e5');
  await won.alice.controller.refresh(); await play(won.alice.controller, 'g1', 'f3');
  won.games.seed('alice', { views: { [won.id]: { deadline_at: new Date(Date.now() - 1000).toISOString() } } });
  await won.alice.controller.refresh(); await won.alice.controller.open(won.id);
  expect(won.alice.controller.state().claim).toBe('win');
  expect(await won.alice.controller.claim()).toBe(true);
  expect(won.alice.controller.state().view!.result).toEqual({ winner: 0, reason: 'timeout' });
});

it('recovery states: the game is gone, another account, and the service down after three failed reads', async () => {
  const w = await started();
  const carol = await local(w, 'carol'); await carol.controller.open(w.id);
  expect(carol.controller.state().phase).toBe('account');
  w.server.fail({ path: /\/api\/games\//, kind: 'status', status: 503, code: 'UNAVAILABLE', times: 3 });
  await w.bob.controller.refresh(); await w.bob.controller.refresh();
  expect(w.bob.controller.state().connection).toBe('online');
  await w.bob.controller.refresh();
  expect(w.bob.controller.state().connection).toBe('down');
  await w.bob.controller.refresh();
  expect(w.bob.controller.state().connection).toBe('online');
  await w.games.deleteMatch(w.id);
  await w.bob.controller.refresh();
  expect(w.bob.controller.state().phase).toBe('gone');
});

it('the poll reads at the old cadence while the page shows, and not while it is hidden', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const view = { game_id: 'g', revision: 0, seat: 0, status: 'playing', action: 'waiting', turn: 1, kind: 'friend', speed: 'daily', fen: toFen(new Game('RNBQKBNR').pos), last_commands: [], server_now: new Date().toISOString(), deadline_at: null, opponent: null, draw_offer: null, abort_open: false, legal: [] };
  const game = vi.fn(async () => ({ ...view, server_now: new Date().toISOString() }));
  const c = peopleController({ server: { game, command: vi.fn(), draft: vi.fn(), preview: vi.fn(), join: vi.fn(), seen: vi.fn(async () => {}) } as never, userId: 'u', storage: memoryStorage(), pageEngine: undefined });
  await c.open('g');
  const page = Object.assign(new EventTarget(), { hidden: false }), stop = c.start({ page, net: new EventTarget() });
  await vi.advanceTimersByTimeAsync(0); const first = game.mock.calls.length;
  await vi.advanceTimersByTimeAsync(30_000); expect(game.mock.calls.length).toBe(first + 1);
  page.hidden = true; page.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(120_000); expect(game.mock.calls.length).toBe(first + 1);
  page.hidden = false; page.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(0); expect(game.mock.calls.length).toBe(first + 2);
  stop();
});

it('has no DOM: the people modules name no page part, and only start() reads the page and the window', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const files = readdirSync(import.meta.dirname).filter(name => name.endsWith('.ts') && !name.includes('.test.') && name !== 'fake-server.ts');
  expect(files.sort()).toEqual(['controller.ts', 'receipt.ts', 'replica.ts', 'seat-king.ts', 'server.ts', 'words.ts']);
  for (const name of files) {
    const text = readFileSync(`${import.meta.dirname}/${name}`, 'utf8');
    expect(text, name).not.toMatch(/\bdocument\.|\bwindow\b|querySelector|HTMLElement|innerHTML|localStorage/);
  }
  expect(readFileSync(`${import.meta.dirname}/controller.ts`, 'utf8').match(/globalThis\.document/g)).toHaveLength(1);
});

it.each(['playing', 'finished'])('keeps the 3-second command window through two poll reads of a %s game, and sends seen at most each 30 seconds', async status => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const at = new Date().toISOString();
  const last = { seq: 5, seat: 0, at, action: { type: status === 'finished' ? 'rematch' : 'turn', choice: 'offer', actions: ['e2-e4'] } };
  const view = { game_id: 'g', revision: 5, seat: 0, status, action: 'waiting', turn: 1, kind: 'friend', speed: 'daily',
    fen: toFen(new Game('RNBQKBNR').pos), last_commands: [last], server_now: at, deadline_at: null,
    opponent: { handle: 'bob', icon: null, last_seen_ms: null }, draw_offer: null, abort_open: false, legal: [], rematch_offer: null };
  const game = vi.fn(async (_id: string, since = 0) => ({ ...view, server_now: new Date().toISOString(), last_commands: [last].filter(c => c.seq > since) }));
  const seen = vi.fn(async () => {});
  const c = peopleController({ server: { game, seen } as never, userId: 'u', storage: memoryStorage() });
  await c.open('g');
  const stop = c.start({ page: Object.assign(new EventTarget(), { hidden: false }), net: new EventTarget() });
  try {
    await vi.advanceTimersByTimeAsync(0); const first = game.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000); expect(game.mock.calls.length).toBe(first + 1);
    await vi.advanceTimersByTimeAsync(3000); expect(game.mock.calls.length).toBe(first + 2);
    expect(seen).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(24_000); expect(seen).toHaveBeenCalledTimes(2);
    expect(game.mock.calls.slice(1).map(c => c[1])).toEqual(Array(game.mock.calls.length - 1).fill(4));
  } finally { stop(); }
});

it('a failed first open shows the service state at once', async () => {
  const w = await world(), alice = await local(w, 'alice');
  w.server.fail({ path: /\/api\/games\//, kind: 'status', status: 503, code: 'UNAVAILABLE' });
  await alice.controller.open(w.id);
  expect(alice.controller.state().connection).toBe('down');
});

it.each([401, 503])('M3: a failed server check reports %s without losing the turn', async status => {
  const w = await started(), other = player(w.server, 'alice', { pageEngine: undefined });
  await other.controller.open(w.id); other.controller.stage(move(other.controller, 'e2', 'e4'));
  w.server.fail({ path: /\/preview$/, kind: 'status', status, code: status === 401 ? 'UNAUTHENTICATED' : 'UNAVAILABLE' });
  expect(await other.controller.send()).toBe(false);
  expect(other.controller.state()).toMatchObject({ phase: 'staged', connection: status === 401 ? 'auth' : 'down' });
  expect(other.controller.state().notice?.kind).not.toBe('offline');
  expect(commands(w.server, 'alice')).toHaveLength(0);
});

it.each(['MATCH_TERMINAL', 'NOT_ALLOWED'])('handles a refused %s command with a full read or its code', async code => {
  const w = await started(); w.server.calls.length = 0;
  w.server.fail({ path: /\/commands$/, kind: 'status', status: 409, code });
  expect(await w.alice.controller.offerDraw()).toBe(false);
  const reads = w.server.calls.filter(c => c.method === 'GET' && c.path.includes(`/games/${w.id}`));
  if (code === 'MATCH_TERMINAL') expect(reads.some(c => !c.path.includes('since'))).toBe(true);
  else expect(w.alice.controller.state().notice).toMatchObject({ kind: 'refused', code });
});

it('Discard keeps a newer command that another tab writes after the failed checks', async () => {
  const w = await started();
  w.alice.controller.stage(move(w.alice.controller, 'e2', 'e4'));
  w.server.fail({ path: /\/commands$/, kind: 'network', times: 100 });
  await w.alice.controller.send(); await w.alice.controller.check(); await w.alice.controller.check();
  expect(w.alice.controller.state().check?.canDiscard).toBe(true);
  const next = receiptOf(w.id, 2, { type: 'resign' }, 'other-tab');
  w.alice.storage.setItem(receiptKey('alice'), JSON.stringify(next));
  await w.alice.controller.discard();
  expect(w.alice.storage.getItem(receiptKey('alice'))).toBe(JSON.stringify(next));
});

it('a failed receipt write keeps the unsent turn and sends no command', async () => { const w=await started(); const c=w.alice.controller; c.stage(move(c,'e2','e4')); w.alice.storage.setItem=()=>{throw new Error('full');}; expect(await c.send()).toBe(false); expect(c.state()).toMatchObject({phase:'staged',notice:{kind:'refused'}}); expect(commands(w.server,'alice')).toHaveLength(0); });

it('sign-in after a failed first read loads the target game', async () => { const w=await started(), fresh=player(w.server,'alice'); w.server.signOut('alice'); await fresh.controller.open(w.id); expect(fresh.controller.state()).toMatchObject({connection:'auth'}); expect(fresh.controller.state().view).toBeUndefined(); w.server.signIn('alice'); await fresh.controller.signedIn(); expect(fresh.controller.state()).toMatchObject({phase:'your-move',connection:'online'}); expect(fresh.controller.state().view?.game_id).toBe(w.id); });

it.each(['join', 'ready'])('reads the first reply within three seconds after %s when presence is private', async type => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const at = new Date().toISOString(), last = { seq: 1, seat: 1, at, action: { type } };
  const view = { game_id: 'g', revision: 1, seat: 1, status: 'playing', action: 'waiting', turn: 0, kind: 'friend', speed: 'daily',
    fen: toFen(new Game('RNBQKBNR').pos), last_commands: [last], server_now: at, deadline_at: null,
    opponent: { handle: 'alice', icon: null, last_seen_ms: null }, draw_offer: null, abort_open: false, legal: [] };
  const game = vi.fn(async () => ({ ...view, server_now: new Date().toISOString() }));
  const c = peopleController({ server: { game, seen: vi.fn(async () => {}) } as never, userId: 'u', storage: memoryStorage() });
  await c.open('g');
  const stop = c.start({ page: Object.assign(new EventTarget(), { hidden: false }), net: new EventTarget() });
  try {
    await vi.advanceTimersByTimeAsync(0); const first = game.mock.calls.length;
    await vi.advanceTimersByTimeAsync(3000); expect(game.mock.calls.length).toBe(first + 1);
    await vi.advanceTimersByTimeAsync(3000); expect(game.mock.calls.length).toBe(first + 2);
  } finally { stop(); }
});

it.each([
  [{ king: 'Mud', power: 'Leap' }, true, { king: 'Mud', power: 'March' }],
  [{ king: 'Mud', power: 'March' }, false, { king: 'Mud', power: 'March' }],
  [{ king: 'Frost', power: 'Freeze' }, true, { king: 'Spirit', power: 'Mercy' }],
  [null, false, { king: 'Spirit', power: 'Mercy' }],
] as const)('confirms the stored king when admitted, else the seat default (%j, cards %s)', async (king, cards, expected) => {
  const games = fixtureService(); services.push(games);
  for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
  const server = fakeServer(games), options = { ...DEFAULT_OPTIONS, arrangement: true, kingPowers: true, cards };
  const made = await games.create('alice', { kind: 'friend', colour: 'white', options });
  const invite = await games.invite('alice', made.game_id), storage = memoryStorage();
  storage.setItem('kingdown.game-options', JSON.stringify({ king }));
  const bob = player(server, 'bob', { storage }).controller;
  await bob.join({ token: invite.token }); expect(bob.state().phase).toBe('setup');
  storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Shadow', power: 'Darkness' } }));
  expect(await bob.ready()).toBe(true);
  const action = commands(server, 'bob').at(-1)?.body as { action: { choice: unknown } };
  expect(action.action.choice).toMatchObject({ king: expected });
  storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Spirit', power: 'Mercy' } }));
  await bob.refresh();
  expect(bob.state().game!.rules.kings[1]).toEqual(expected);
});

it('sends each own arrangement, allows Black to confirm first and rejects a fault', async () => {
  const games = fixtureService(); services.push(games);
  for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
  const server = fakeServer(games), made = await games.create('alice', { kind: 'friend', colour: 'white', options: { ...DEFAULT_OPTIONS, kingPowers: true } });
  const invite = await games.invite('alice', made.game_id), storage = memoryStorage();
  storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Mud', power: 'March' } }));
  const alice = player(server, 'alice', { storage }).controller, bob = player(server, 'bob').controller;
  await bob.join({ token: invite.token }); await alice.open(made.game_id);
  expect(alice.state().game).toBeTruthy(); expect(bob.state().game).toBeTruthy();
  expect(await bob.ready('KKKKKKKK')).toBe(false);
  const army = bob.state().view!.draw!, order = [...army].reverse().join('');
  expect(await bob.ready(order)).toBe(true); expect(bob.state().view!.ready?.[1]).toBe(true);
  await alice.refresh(); expect(await alice.ready(army)).toBe(true); await bob.refresh();
  expect(alice.state().phase).toBe('your-move'); expect(bob.state().phase).toBe('their-move');
  expect(alice.state().game!.rules.kings[0]).toEqual({ king: 'Mud', power: 'March' });
  const fen = toFen(alice.state().game!.pos).split(' ')[0].split('/');
  expect(fen[0]).toBe(order.toLowerCase()); expect(fen[7]).toBe(army);
});


it('confirms both orders when both seats select Ready at the same revision', async () => {
  const games = fixtureService(); services.push(games);
  for (const name of ['alice', 'bob']) await games.handle(name, { handle: name });
  const server = fakeServer(games), made = await games.create('alice', { kind: 'friend', colour: 'white', options: DEFAULT_OPTIONS });
  const invite = await games.invite('alice', made.game_id);
  const alice = player(server, 'alice').controller, bob = player(server, 'bob').controller;
  await bob.join({ token: invite.token }); await alice.open(made.game_id);
  const army = alice.state().view!.draw!;
  expect(await Promise.all([alice.ready(army), bob.ready([...army].reverse().join(''))])).toEqual([true, true]);
  await alice.refresh(); await bob.refresh();
  expect(alice.state().phase).toBe('your-move'); expect(bob.state().phase).toBe('their-move');
});
