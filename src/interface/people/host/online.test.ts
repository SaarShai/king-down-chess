import { afterEach, expect, it, vi } from 'vitest';
import { accountData } from '../../../account/data';
import { Game } from '../../../game';
import { DraftTurn } from '../../play/turn';
import { memoryStorage } from '../fake-server';
import { draftKey, inviteURL, keepDraft, onlineOptions, restoreDraft } from './index';
import { gameOrder, homeInvite, personGame, personTurn, personWords } from './games';
import { computerPortrait } from './portrait';
import type { PeopleState } from '../controller';
import { fixtureService } from '../../../../tools/plugin-protocol-fixture';
import { peopleController } from '../controller';
import { peopleServer } from '../server';
import { onlineClient } from '../../../online/client';
import { fakeServer } from '../fake-server';

const state = (revision = 1) => {
  const game = new Game('RNBQKBNR', { kings: [null, null], hands: [[], []] }), draft = new DraftTurn(game);
  return { game, draft, view: { game_id: 'game-a', revision } } as PeopleState & { game: Game; draft: DraftTurn };
};
afterEach(() => vi.unstubAllGlobals());
it('uses the public invite path in the app and keeps the website path', () => {
  expect(inviteURL('fixture-token', 'capacitor://localhost', true)).toBe('https://kingdown.dev/j#fixture-token');
  expect(inviteURL('fixture-token', 'https://site.test', false)).toBe('https://site.test/next.html#join=fixture-token');
});
it('binds deletion to the confirmed account, cleans only its drafts, then signs out after the server receipt', async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState: vi.fn() });
  const tab = memoryStorage(); tab.setItem('kingdown.account-page.alice', 'private'); tab.setItem('kingdown.account-page.bob', 'keep');
  vi.stubGlobal('sessionStorage', tab); vi.stubGlobal('navigator', {}); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const memory = memoryStorage(), keys = () => [...memory.records.keys()];
  const storage = { ...memory, key: (i: number) => keys()[i] ?? null, get length() { return keys().length; } };
  storage.setItem('kingdown.people-draft.alice.game', 'private'); storage.setItem('kingdown.people-draft.bob.game', 'keep');
  const token = (session: string, at: number) => 'fixture.' + btoa(JSON.stringify({ session_id: session, iat: at })) + '.signature';
  const order: string[] = []; let current = 'alice', accessToken = token('opening-session', 1);
  const auth = async () => ({ onSession: () => () => {}, readSession: async () => ({ userId: current, accessToken }), signOutSession: async () => { order.push('signout'); return true; } }) as never;
  const send = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/deletion')) { accessToken = token('opening-session', 2); order.push('request'); return Response.json({ deletion: { run_after: '2026-12-01T00:00:00Z' } }); }
    return Response.json({ me: { handle: 'alice', icon: null } });
  });
  const { onlineHost } = await import('./index');
  const host = onlineHost({ auth, storage, fetch: send, rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
  await host.signIn();
  const deletion = host.deletion;
  current = 'bob'; await expect(deletion.remove()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  expect(order).toEqual([]); expect(storage.getItem('kingdown.people-draft.alice.game')).toBe('private');
  current = 'alice'; expect(await host.deletion.remove()).toEqual({ runAfter: '2026-12-01T00:00:00Z', localCleared: true });
  expect(order).toEqual(['request', 'signout']); expect(host.signedIn).toBe(false);
  expect(storage.getItem('kingdown.people-draft.alice.game')).toBeNull(); expect(storage.getItem('kingdown.people-draft.bob.game')).toBe('keep');
  expect(tab.getItem('kingdown.account-page.alice')).toBeNull(); expect(tab.getItem('kingdown.account-page.bob')).toBe('keep');
  accessToken = token('new-session', 3); await host.signIn();
  const { receiptStore, receiptOf } = await import('../receipt');
  await receiptStore('alice', storage).hold(receiptOf('new-game', 1, { type: 'resign' }, 'new-command'));
  expect(storage.getItem('kingdown.account-command.alice')).toContain('new-command');
});
it('the three online choices use the existing options with no hidden army ordering', () => {
  expect(['pieces', 'powers', 'cards'].map(value => onlineOptions(value as 'pieces'))).toMatchObject([
    { fairy: true, arrangement: false, kingPowers: false, cards: false },
    { fairy: true, arrangement: false, kingPowers: true, cards: false },
    { fairy: true, arrangement: false, kingPowers: true, cards: true },
  ]);
});
it('a reload restores only this account and revision of the unsent turn', async () => {
  const storage = memoryStorage(), before = state();
  before.draft.stage(before.draft.at(12, 28)[0]); await keepDraft(storage, 'alice', before, accountData('alice', storage));
  const resumed = state(); restoreDraft(storage, 'alice', resumed);
  expect(resumed.draft.steps.map(step => step.move.to)).toEqual([28]);
  const other = state(); restoreDraft(storage, 'bob', other); expect(other.draft.length).toBe(0);
  const newer = state(2); restoreDraft(storage, 'alice', newer); expect(newer.draft.length).toBe(0);
  expect(storage.getItem(draftKey('alice', 'game-a'))).toContain('e2-e4');
});
it.each(['bad json', '{"revision":1,"actions":[7]}', '{"revision":1,"actions":["bad"]}'])('an unreadable local turn leaves the server board: %s', raw => {
  const storage = memoryStorage(), current = state(); storage.setItem(draftKey('alice','game-a'), raw);
  restoreDraft(storage, 'alice', current); expect(current.draft.length).toBe(0);
});
it('a draft storage failure reaches the host, so it can tell the player', async () => {
  const storage = { ...memoryStorage(), setItem() { throw Error('full'); } };
  await expect(keepDraft(storage, 'alice', state(), accountData('alice', storage))).rejects.toThrow('full');
});
it('game order puts your move first, then deadlines, results and waiting links', () => {
  const row = (id: string, mine: boolean, state: 'playing' | 'finished' | 'waiting', deadline: string | null = null) => ({ id, mine, state, deadline });
  const rows = [row('link',false,'waiting'),row('result',false,'finished'),row('later',false,'playing','2026-11-18'),row('mine',true,'playing'),row('soon',false,'playing','2026-11-15')];
  expect(rows.sort(gameOrder).map(row => row.id)).toEqual(['mine','soon','later','result','link']);
});
it('each computer level has its approved portrait', () => {
  expect(['casual','clever','club'].map(level => computerPortrait(level as 'casual'))).toEqual([1,2,3].map(n => `/interface/computer-king-${n}-96.webp`));
});
it.each(['pieces','powers','cards'] as const)('both players ready and play the %s game through the existing service', async rules => {
  const service = fixtureService();
  try {
    await service.handle('alice',{handle:'alice'}); await service.handle('bob',{handle:'bob'});
    const view = await service.create('alice',{kind:'friend',options:onlineOptions(rules)}), link = await service.invite('alice',view.game_id), server = fakeServer(service);
    const player = (name: string) => peopleController({ userId:name, storage:memoryStorage(), server:peopleServer(onlineClient({token:async()=>name,fetch:server.fetch,wait:async()=>{}})) });
    const alice = player('alice'), bob=player('bob'); await bob.join({token:link.token}); await alice.open(view.game_id);
    if (rules !== 'pieces') { expect(alice.state().phase).toBe('setup'); expect(await bob.ready()).toBe(false); expect(await alice.ready()).toBe(true); await bob.refresh(); expect(await bob.ready()).toBe(true); await alice.refresh(); }
    expect(alice.state().phase).toBe('your-move'); expect(bob.state().game).toBeTruthy();
    const draft=alice.state().draft!; alice.stage(draft.at(12,28)[0]); expect(await alice.send()).toBe(true); await bob.refresh();
    expect(bob.state().phase).toBe('your-move');
    const row=personGame(await service.view('bob',view.game_id));
    expect(row).toMatchObject({name:'alice',mine:true,state:'playing',avatar:null}); expect(row.preview!.last!.move.to).toBe(28); expect(row.preview!.player).toBe(1);
  } finally { await service.close(); }
});

it('person rules name the opponent and Send, while the shared computer copy stays intact', () => { const line="Computer: Mercy protects 4 pieces. Select End turn. The computer's turn ends."; expect(personWords(line)).toBe("Opponent: Mercy protects 4 pieces. Select Send. The opponent's turn ends."); expect(line).toContain('Computer:'); });

it('a canceled game without a board has no result, rather than a draw', async () => {
  const service = fixtureService();
  try {
    await service.handle('alice', { handle: 'alice' });
    const game = await service.create('alice', { kind: 'friend', options: onlineOptions('pieces') });
    await service.command('alice', game.game_id, { command_id: crypto.randomUUID(), expected_revision: game.revision, action: { type: 'abort' } });
    const view = await service.view('alice', game.game_id);
    expect(view.fen).toBe('');
    expect(personGame(view)).toMatchObject({ state: 'finished', status: 'The game ends with no result.', preview: null });
  } finally { await service.close(); }
});

it.each([
  ['checking', 'auth', 'Sign in to send your turn.'],
  ['staged', 'auth', 'Sign in to send your turn.'],
  ['sending', 'online', 'Sending your turn…'],
  ['checking', 'online', 'Checking your turn…'],
  ['their-move', 'online', 'Your opponent to move.'],
  ['staged', 'offline', 'You are offline. Your unsent turn stays.'],
  ['your-move', 'online', undefined],
] as const)('turn words use the phase %s and connection %s', (phase, connection, expected) => {
  expect(personTurn({ phase, connection })).toBe(expected);
});

it('a refused provider return never opens an older cached account', async () => {
  const storage=memoryStorage(); storage.setItem('kingdown.auth','fixture cached account');
  vi.stubGlobal('location',new URL('https://kingdown.test/next.html?code=fixture&sb_flow_id=flow_12345678'));
  vi.stubGlobal('history',{state:{},replaceState:vi.fn()}); vi.stubGlobal('sessionStorage',memoryStorage());
  vi.stubGlobal('navigator',{onLine:true}); vi.stubGlobal('matchMedia',()=>({matches:false}));
  const auth=vi.fn(async()=>({ onSession:()=>()=>{}, readSession:async()=>({userId:'old-account',accessToken:'fixture-token'}) }) as never);
  const send=vi.fn(async(input: RequestInfo | URL)=>Response.json(String(input).endsWith('/games')?[]:String(input).endsWith('/record')?{history:[]}:{me:{handle:'older-player',icon:null}}));
  const { onlineHost }=await import('./index');
  const host=onlineHost({auth,storage,fetch:send,rules:()=> 'pieces',setRules(){},changed(){},open(){},home(){},toast(){}});
  expect(await host.init()).toEqual({status:'retry'}); expect(host.signedIn).toBe(false); expect(auth).not.toHaveBeenCalled(); expect(send).not.toHaveBeenCalled();
});

it('propagates social avatars to home rows while hiding email and deleted photos, and connects named invites on onlineHost', async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState: vi.fn() });
  vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const service = fixtureService();
  try {
    await service.handle('alice', { handle: 'alice' });
    await service.handle('bob', { handle: 'bob' });
    await service.handle('carol', { handle: 'carol' });
    service.seed('alice', { metadata: { provider: 'google', avatar_url: 'https://img.example/alice.png' } });
    service.seed('bob', { metadata: { provider: 'github', picture: 'https://img.example/bob.png' } });
    service.seed('carol', { metadata: { provider: 'email', avatar_url: 'https://img.example/hidden.png' } });
    const server = fakeServer(service);

    // Seed one finished game between alice and bob so bob is a recent/known opponent.
    const past = await service.create('alice', { kind: 'friend', options: onlineOptions('pieces') });
    const pastLink = await service.invite('alice', past.game_id);
    await service.join('bob', pastLink.token);
    await service.command('alice', past.game_id, { command_id: 'resign-past', expected_revision: 1, action: { type: 'resign' } });

    const { onlineHost } = await import('./index');
    const makeHost = (actor: string, storage = memoryStorage()) => {
      const opened: string[] = [], toasts: string[] = [];
      let changes = 0;
      storage.setItem('kingdown.auth', actor);
      const auth = async () => ({
        onSession: () => () => {},
        readSession: async () => ({ userId: actor, accessToken: actor }),
        providers: async () => [],
      }) as never;
      const instance = onlineHost({
        auth, storage, fetch: server.fetch,
        rules: () => 'pieces', setRules() {},
        changed: () => { changes++; }, open: id => opened.push(id), home() {}, toast: line => toasts.push(line),
      });
      return { host: instance, opened, toasts, storage, get changes() { return changes; } };
    };

    const alice = makeHost('alice'), bob = makeHost('bob'), carol = makeHost('carol');
    await alice.host.init(); await bob.host.init(); await carol.host.init();

    // Named invites & photos are enabled on the new page's host.
    expect(alice.host.host.named).not.toBe(false);
    expect(alice.host.host.photo).toBe(true);
    expect(await alice.host.host.known()).toEqual([{ handle: 'bob', icon: null, avatar: 'https://img.example/bob.png' }]);
    expect(await alice.host.host.recent()).toMatchObject([{ handle: 'bob', avatar: 'https://img.example/bob.png', result: 'lost' }]);
    expect(await alice.host.host.find('bo')).toEqual([{ handle: 'bob', icon: null, avatar: 'https://img.example/bob.png' }]);
    expect(await alice.host.host.find('carol')).toEqual([{ handle: 'carol', icon: null, avatar: null }]);

    // Sender sends named invite -> local view becomes "Invite sent" with recipient photo.
    await alice.host.host.invite('bob', 'pieces');
    const sentRow = personGame(alice.host.views.find(v => v.status === 'waiting')!);
    expect(sentRow).toMatchObject({ name: 'bob', avatar: 'https://img.example/bob.png', state: 'waiting', status: 'Invite sent' });

    // Receiver refreshes -> sees incoming invite with inviter photo -> declines -> sender sees declined update -> dismisses.
    await bob.host.refresh();
    expect(bob.host.incomingInvites).toHaveLength(1);
    expect(homeInvite(bob.host.incomingInvites[0])).toMatchObject({ kind: 'incoming', name: 'alice', avatar: 'https://img.example/alice.png' });
    await bob.host.declineInvite(bob.host.incomingInvites[0]);
    expect(bob.host.incomingInvites).toEqual([]);
    expect(bob.toasts).toContain('Invite declined.');

    await alice.host.refresh();
    expect(alice.host.inviteUpdates).toHaveLength(1);
    expect(homeInvite(alice.host.inviteUpdates[0])).toMatchObject({ kind: 'declined', name: 'bob', line: 'Invite declined' });
    await alice.host.dismissInvite(alice.host.inviteUpdates[0]);
    expect(alice.host.inviteUpdates).toEqual([]);
    await alice.host.refresh();
    expect(alice.host.inviteUpdates).toEqual([]);

    // Sender sends second named invite -> receiver accepts -> game opens with inviter's photo.
    await alice.host.host.invite('bob', 'powers');
    await bob.host.refresh();
    const acceptedId = bob.host.incomingInvites[0].game_id;
    await bob.host.acceptInvite(bob.host.incomingInvites[0]);
    expect(bob.opened).toEqual([acceptedId]);
    expect(bob.host.incomingInvites).toEqual([]);
    const bobView = bob.host.views.find(v => v.game_id === acceptedId)!;
    expect(personGame(bobView)).toMatchObject({ name: 'alice', avatar: 'https://img.example/alice.png', state: 'setup' });

    // Email-signed-in inviter keeps avatar = null in both invitation and game rows.
    await carol.host.host.invite('bob', 'pieces');
    await bob.host.refresh();
    expect(homeInvite(bob.host.incomingInvites[0])).toMatchObject({ kind: 'incoming', name: 'carol', avatar: null });
    await bob.host.acceptInvite(bob.host.incomingInvites[0]);
    const carolView = bob.host.views.find(v => v.opponent?.handle === 'carol')!;
    expect(personGame(carolView)).toMatchObject({ name: 'carol', avatar: null });
    expect(personGame({ ...carolView, opponent: { ...carolView.opponent!, deleted: true } })).toMatchObject({ name: 'Deleted player', avatar: null });
  } finally { await service.close(); }
});

for (const eventFirst of [false, true]) it(`keeps another session and newer sign-in records when the deletion reply is late, event first: ${eventFirst}`, async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState() {} });
  const tab = memoryStorage(); vi.stubGlobal('sessionStorage', tab); vi.stubGlobal('navigator', {}); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  for (const key of ['kingdown.email-code', 'kingdown.account-signin', 'kingdown.account-page.alice']) tab.setItem(key, 'opening-attempt');
  const memory = memoryStorage(), storage = { ...memory, key: (i: number) => [...memory.records.keys()][i] ?? null, get length() { return memory.records.size; } };
  storage.setItem('kingdown.people-draft.alice.game', 'private'); storage.setItem('kingdown.people-draft.bob.game', 'keep');
  let current = 'alice', changed = (_value: any) => {}, reply = (_value: Response) => {};
  let start = () => {}; const started = new Promise<void>(resolve => { start = resolve; });
  const signOut = vi.fn(async () => {});
  const auth = async () => ({ onSession: (callback: typeof changed) => { changed = callback; }, readSession: async () => ({ userId: current, accessToken: 'session-' + current }), signOut }) as never;
  const host = (await import('./index')).onlineHost({ auth, storage, fetch: async input => String(input).endsWith('/deletion') ? new Promise<Response>(resolve => { reply = resolve; start(); }) : Response.json({ me: { handle: current, icon: null } }), rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
  await host.signIn(); const deletion = host.deletion, close = vi.fn(); deletion.onAccountChange(close);
  const pending = deletion.remove(); const rejected = expect(pending).rejects.toMatchObject({ code: 'UNAUTHENTICATED' }); await started;
  current = 'bob';
  for (const key of ['kingdown.email-code', 'kingdown.account-signin', 'kingdown.account-page.alice']) tab.setItem(key, 'new-attempt');
  if (eventFirst) { changed({ user: { id: 'bob' } }); await host.signIn(); expect(close).toHaveBeenCalled(); }
  reply(Response.json({ deletion: { run_after: '2026-12-01T00:00:00Z' } })); await rejected;
  if (!eventFirst) { changed({ user: { id: 'bob' } }); await host.signIn(); }
  expect(close).toHaveBeenCalled(); expect(signOut).not.toHaveBeenCalled(); expect(host.userId).toBe('bob');
  expect(storage.getItem('kingdown.people-draft.alice.game')).toBe('private'); expect(storage.getItem('kingdown.people-draft.bob.game')).toBe('keep');
  for (const key of ['kingdown.email-code', 'kingdown.account-signin', 'kingdown.account-page.alice']) expect(tab.getItem(key)).toBe('new-attempt');
});

it('rejects a deletion sheet from an earlier session of the same account', async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('sessionStorage', memoryStorage()); vi.stubGlobal('navigator', {}); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const jwt = (id: string) => 'fixture.' + btoa(JSON.stringify({ session_id: id })) + '.signature';
  let token = jwt('first-session'); const send = vi.fn(async () => Response.json({ me: { handle: 'alice', icon: null } }));
  const host = (await import('./index')).onlineHost({ auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: token }) }) as never, storage: memoryStorage(), fetch: send, rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
  await host.signIn(); const deletion = host.deletion; token = jwt('new-session');
  await expect(deletion.remove()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' }); expect(send).toHaveBeenCalledTimes(1);
});

it('a tab with a late sign-out event cannot restore a deleted draft, even after another tab signs in again', async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('sessionStorage', memoryStorage()); vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('addEventListener', () => {}); vi.stubGlobal('removeEventListener', () => {});
  const service = fixtureService(), memory = memoryStorage(), storage = { ...memory, key: (i: number) => [...memory.records.keys()][i] ?? null, get length() { return memory.records.size; } };
  let host: ReturnType<typeof import('./index').onlineHost> | undefined;
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const view = await service.create('alice', { kind: 'friend', options: onlineOptions('pieces') }), link = await service.invite('alice', view.game_id); await service.join('bob', link.token);
    host = (await import('./index')).onlineHost({ auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }) }) as never, storage, fetch: fakeServer(service).fetch, rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
    await host.signIn(); await host.open(view.game_id, () => {});
    host.controller!.stage(host.controller!.state().draft!.at(12, 28)[0]); await host.saveDraft();
    expect(storage.getItem(draftKey('alice', view.game_id))).toContain('e2-e4');
    const { receiptStore } = await import('../receipt'), { clearDeletedAccount } = await import('../../../account/local');
    await receiptStore('alice', storage).clearAccount(() => clearDeletedAccount(storage, 'alice'));
    await host.saveDraft(); expect(storage.getItem(draftKey('alice', view.game_id))).toBeNull();
    await accountData('alice', storage).confirm(async () => ({ userId: 'alice', accessToken: 'new-tab-session' })); await host.saveDraft(); expect(storage.getItem(draftKey('alice', view.game_id))).toBeNull();
  } finally { host?.stopGame(); await service.close(); }
});

import { onlineHost } from './index';
import { receiptStore, receiptOf, receiptKey } from '../receipt';
import { clearDeletedAccount, deletedAccountKey } from '../../../account/local';
function deletionStorage() {
  const memory = memoryStorage();
  return { ...memory, key: (i: number) => [...memory.records.keys()][i] ?? null, get length() { return memory.records.size; } };
}
function deletionGlobals(saved: ReturnType<typeof deletionStorage>) {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true });
  vi.stubGlobal('localStorage', saved);
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.stubGlobal('addEventListener', () => {}); vi.stubGlobal('removeEventListener', () => {});
}
const options = { rules: () => 'pieces' as const, setRules() {}, changed() {}, open() {}, home() {}, toast() {} };

it('a delayed startup cannot reopen writes after cleanup', async () => {
  const saved = deletionStorage(); deletionGlobals(saved);
  let release!: (value: Response) => void, started!: () => void;
  const begin = new Promise<void>(resolve => { started = resolve; });
  const host = onlineHost({ ...options, storage: saved,
    auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'same-session' }) }) as never,
    fetch: async () => { started(); return new Promise<Response>(resolve => { release = resolve; }); },
  });
  const opening = host.signIn(); await begin;
  await receiptStore('alice', saved).clearAccount(() => clearDeletedAccount(saved, 'alice'));
  release(Response.json({ me: { handle: 'alice', icon: null } })); await opening;
  const writer = receiptStore('alice', saved);
  await writer.hold(receiptOf('private-game', 1, { type: 'resign' }, 'stale-startup')).catch(() => {});
  expect(JSON.parse(saved.getItem(deletedAccountKey('alice'))!).deleted).toBe(true);
  expect(saved.getItem(receiptKey('alice'))).toBeNull();
});


it('a late deletion reply keeps data from a new sign-in of the same account', async () => {
  const saved = deletionStorage(); deletionGlobals(saved);
  const jwt = (id: string) => 'fixture.' + btoa(JSON.stringify({ session_id: id })) + '.signature';
  let token = jwt('opening'), reply!: (value: Response) => void, sent!: () => void;
  const started = new Promise<void>(resolve => { sent = resolve; });
  const host = onlineHost({ ...options, storage: saved,
    auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: token }), signOut: vi.fn() }) as never,
    fetch: async input => String(input).endsWith('/deletion') ? new Promise<Response>(resolve => { reply = resolve; sent(); }) : Response.json({ me: { handle: 'alice', icon: null } }),
  });
  await host.signIn();
  const pending = host.deletion.remove().catch(() => {}); await started;
  // The server has accepted deletion, but its reply is held. A later sign-in
  // cancels deletion. The new session saves a new unsent turn on this device.
  token = jwt('new-sign-in'); await host.signIn();
  saved.setItem(draftKey('alice', 'new-game'), 'new-private-turn');
  reply(Response.json({ deletion: { run_after: '2026-12-01T00:00:00Z' } })); await pending;
  expect(saved.getItem(draftKey('alice', 'new-game'))).toBe('new-private-turn');
  expect(JSON.parse(saved.getItem(deletedAccountKey('alice'))!).deleted).toBe(false);
});

it('keeps data from a new session of A when an earlier deletion reply arrives late', async () => {
  const store = deletionStorage(); deletionGlobals(store);
  const jwt = (id: string) => 'fixture.' + btoa(JSON.stringify({ session_id: id })) + '.signature';
  let token = jwt('first-session'), changed = (_session: any) => {}, reply = (_response: Response) => {};
  let start = () => {}; const started = new Promise<void>(resolve => { start = resolve; });
  const host = onlineHost({
    auth: async () => ({ onSession(callback: typeof changed) { changed = callback; }, readSession: async () => ({ userId: 'alice', accessToken: token }), signOut: vi.fn() }) as never,
    storage: store, fetch: async input => String(input).endsWith('/deletion') ? new Promise<Response>(resolve => { reply = resolve; start(); }) : Response.json({ me: { handle: 'alice', icon: null } }),
    rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {},
  });
  await host.signIn(); const pending = host.deletion.remove();
  const rejected = expect(pending).rejects.toMatchObject({ code: 'UNAUTHENTICATED' }); await started;
  token = jwt('new-session'); changed({ user: { id: 'alice' }, access_token: token }); await host.signIn();
  store.setItem('kingdown.people-draft.alice.new-game', 'new session private turn');
  reply(Response.json({ deletion: { run_after: '2026-12-01T00:00:00Z' } })); await rejected;
  expect(store.getItem('kingdown.people-draft.alice.new-game')).toBe('new session private turn');
});


it('does not reopen deleted account writers on a plain page load with the old auth session', async () => {
  const store = deletionStorage(); deletionGlobals(store);
  await receiptStore('alice', store).clearAccount(() => clearDeletedAccount(store, 'alice'), async () => ({ userId: 'alice', accessToken: 'unchanged-session' }));
  // The deletion tab still awaits sign-out. This page only reads that existing session.
  const host = onlineHost({
    auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'unchanged-session' }) }) as never,
    storage: store, fetch: async () => Response.json({ me: { handle: 'alice', icon: null } }),
    rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {},
  });
  await host.signIn();
  const storeForOldSession = receiptStore('alice', store);
  await expect(storeForOldSession.hold(receiptOf('game-a', 1, { type: 'turn', actions: ['e2-e4'] }, 'restored-private-command'))).rejects.toThrow('deleted');
  expect(store.getItem(receiptKey('alice'))).toBeNull();
});

for (const order of ['cleanup first', 'draft queued first'] as const) it(`deletion between the draft check and write cannot restore the draft: ${order}`, async () => {
  const saved = deletionStorage(); deletionGlobals(saved);
  const service = fixtureService();
  let host: ReturnType<typeof onlineHost> | undefined;
  const requests: { name: string; run: () => Promise<unknown> }[] = [];
  let pause = false;
  const locks = { request: <T>(name: string, run: () => Promise<T>) => pause ? new Promise<T>((resolve, reject) => requests.push({ name, run: () => run().then(resolve, reject) })) : run() };
  vi.stubGlobal('navigator', { locks, onLine: true });
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const view = await service.create('alice', { kind: 'friend', options: onlineOptions('pieces') });
    const link = await service.invite('alice', view.game_id); await service.join('bob', link.token);
    host = onlineHost({ ...options, storage: saved, fetch: fakeServer(service).fetch,
      auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }) }) as never });
    await host.signIn(); await host.open(view.game_id, () => {});
    host.controller!.stage(host.controller!.state().draft!.at(12, 28)[0]);
    const deleting = accountData('alice', saved, locks); await deleting.write(() => {});
    pause = true;
    const draft = order === 'draft queued first' ? host.saveDraft() : undefined;
    if (draft) await vi.waitFor(() => expect(requests).toHaveLength(1));
    const cleanup = deleting.close(() => clearDeletedAccount(saved, 'alice'));
    await vi.waitFor(() => expect(requests).toHaveLength(draft ? 2 : 1));
    const save = draft ?? host.saveDraft();
    await vi.waitFor(() => expect(requests).toHaveLength(2));
    expect(requests.every(r => r.name === receiptKey('alice'))).toBe(true);
    // The lock grants cleanup first. The old writer has captured its generation.
    await requests.splice(draft ? 1 : 0, 1)[0].run(); await cleanup;
    await requests.shift()!.run(); expect(await save).toBe(false);
    expect(saved.getItem(draftKey('alice', view.game_id))).toBeNull();
  } finally { host?.stopGame(); await service.close(); }
});

it('a queued invite seen write cannot restore a record after cleanup', async () => {
  const saved = deletionStorage(); deletionGlobals(saved);
  const requests: (() => Promise<unknown>)[] = [];
  let pause = false;
  const locks = { request: <T>(_name: string, run: () => Promise<T>) => pause ? new Promise<T>((resolve, reject) => requests.push(() => run().then(resolve, reject))) : run() };
  vi.stubGlobal('navigator', { locks, onLine: true });
  const host = onlineHost({ ...options, storage: saved,
    auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }) }) as never,
    fetch: async () => Response.json({ me: { handle: 'alice', icon: null } }),
  });
  await host.signIn();
  const deleting = accountData('alice', saved, locks); await deleting.write(() => {}); pause = true;
  const cleanup = deleting.close(() => clearDeletedAccount(saved, 'alice'));
  await vi.waitFor(() => expect(requests).toHaveLength(1));
  const seen = host.dismissInvite({ invite_id: 'private-invite', state: 'declined' } as never);
  await vi.waitFor(() => expect(requests).toHaveLength(2));
  await requests.shift()!(); await cleanup; await requests.shift()!(); await seen;
  expect(saved.getItem('kingdown.invite-seen.alice.private-invite')).toBeNull();
});

it('a held result seen reply cannot restore a record after cleanup', async () => {
  const saved = deletionStorage(); deletionGlobals(saved);
  const service = fixtureService(); let host: ReturnType<typeof onlineHost> | undefined;
  let sent!: () => void, release!: () => void;
  const started = new Promise<void>(resolve => { sent = resolve; });
  const reply = new Promise<void>(resolve => { release = resolve; });
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const view = await service.create('alice', { kind: 'friend', options: onlineOptions('pieces') });
    const link = await service.invite('alice', view.game_id); await service.join('bob', link.token);
    await service.command('alice', view.game_id, { command_id: 'resign', expected_revision: 1, action: { type: 'resign' } });
    const server = fakeServer(service);
    host = onlineHost({ ...options, storage: saved,
      auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }) }) as never,
      fetch: async (input, init) => { const result = await server.fetch(input, init); if (String(input).includes('/record')) { sent(); await reply; } return result; },
    });
    await host.signIn(); await host.open(view.game_id, () => {}); await started;
    await accountData('alice', saved).close(() => clearDeletedAccount(saved, 'alice'));
    const checked = vi.spyOn(saved, 'getItem');
    release();
    await vi.waitFor(() => expect(checked).toHaveBeenCalledWith(deletedAccountKey('alice')));
    expect(saved.getItem(`kingdown.people-seen.alice.${view.game_id}`)).toBeNull();
  } finally { release(); host?.stopGame(); await service.close(); }
});
