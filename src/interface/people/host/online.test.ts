import { afterEach, expect, it, vi } from 'vitest';
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
import { seatKing } from '../seat-king';
import { DEFAULT_OPTIONS as PANEL_OPTIONS } from '../../play/new-game';
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
  storage.setItem('kingdown.people-king.alice.game.0', 'null'); storage.setItem('kingdown.people-king.bob.game.0', 'null');
  const order: string[] = []; let current = 'alice';
  const auth = async () => ({ onSession: () => () => {}, readSession: async () => ({ userId: current, accessToken: 'fixture' }), signOut: async () => { order.push('signout'); } }) as never;
  const send = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/deletion')) { order.push('request'); return Response.json({ deletion: { run_after: '2026-12-01T00:00:00Z' } }); }
    return Response.json({ me: { handle: 'alice', icon: null } });
  });
  const { onlineHost } = await import('./index');
  const host = onlineHost({ auth, storage, fetch: send, rules: () => 'pieces', setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
  await host.signIn();
  current = 'bob'; await expect(host.deleteAccount('alice')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  expect(order).toEqual([]); expect(storage.getItem('kingdown.people-draft.alice.game')).toBe('private');
  current = 'alice'; expect(await host.deleteAccount('alice')).toEqual({ runAfter: '2026-12-01T00:00:00Z', localCleared: true });
  expect(order).toEqual(['request', 'signout']); expect(host.signedIn).toBe(false);
  expect(storage.getItem('kingdown.people-draft.alice.game')).toBeNull(); expect(storage.getItem('kingdown.people-draft.bob.game')).toBe('keep');
  expect(storage.getItem('kingdown.people-king.alice.game.0')).toBeNull(); expect(storage.getItem('kingdown.people-king.bob.game.0')).toBe('null');
  expect(tab.getItem('kingdown.account-page.alice')).toBeNull(); expect(tab.getItem('kingdown.account-page.bob')).toBe('keep');
});
it('the four online choices carry the panel options', () => {
  expect(['pieces', 'powers', 'cards', 'both'].map(value => onlineOptions(value as 'pieces'))).toMatchObject([
    { fairy: true, arrangement: false, kingPowers: false, cards: false },
    { fairy: true, arrangement: false, kingPowers: true, cards: false },
    { fairy: true, arrangement: false, kingPowers: false, cards: true },
    { fairy: true, arrangement: false, kingPowers: true, cards: true },
  ]);
});
it('a reload restores only this account and revision of the unsent turn', () => {
  const storage = memoryStorage(), before = state();
  before.draft.stage(before.draft.at(12, 28)[0]); keepDraft(storage, 'alice', before);
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
it('a draft storage failure reaches the host, so it can tell the player', () => {
  expect(() => keepDraft({ setItem() { throw Error('full'); } }, 'alice', state())).toThrow('full');
});
it('game order puts your move first, then deadlines, results and waiting links', () => {
  const row = (id: string, mine: boolean, state: 'playing' | 'finished' | 'waiting', deadline: string | null = null) => ({ id, mine, state, deadline });
  const rows = [row('link',false,'waiting'),row('result',false,'finished'),row('later',false,'playing','2026-11-18'),row('mine',true,'playing'),row('soon',false,'playing','2026-11-15')];
  expect(rows.sort(gameOrder).map(row => row.id)).toEqual(['mine','soon','later','result','link']);
});
it('each computer level has its approved portrait', () => {
  expect(['casual','clever','club'].map(level => computerPortrait(level as 'casual'))).toEqual([1,2,3].map(n => `/interface/computer-king-${n}-96.webp`));
});
it.each(['pieces','powers','cards','both'] as const)('both players ready and play the %s game through the existing service', async rules => {
  const service = fixtureService();
  try {
    await service.handle('alice',{handle:'alice'}); await service.handle('bob',{handle:'bob'});
    const view = await service.create('alice',{kind:'friend',options:onlineOptions(rules)}), link = await service.invite('alice',view.game_id), server = fakeServer(service);
    const player = (name: string) => peopleController({ userId:name, storage:memoryStorage(), server:peopleServer(onlineClient({token:async()=>name,fetch:server.fetch,wait:async()=>{}})) });
    const alice = player('alice'), bob=player('bob'); await bob.join({token:link.token}); await alice.open(view.game_id);
    // A king setup step comes only with king powers: a cards game with no powers starts at once.
    if (rules === 'powers' || rules === 'both') { expect(alice.state().phase).toBe('setup'); expect(await bob.ready()).toBe(false); expect(await alice.ready()).toBe(true); await bob.refresh(); expect(await bob.ready()).toBe(true); await alice.refresh(); }
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
    alice.host.dismissInvite(alice.host.inviteUpdates[0]);
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
it.each(['pieces', 'powers', 'cards', 'both'] as const)('both invite paths carry the selected options to the recipient: %s', async rules => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState: vi.fn() });
  vi.stubGlobal('sessionStorage', memoryStorage()); vi.stubGlobal('navigator', {}); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const service = fixtureService();
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const server = fakeServer(service), { onlineHost } = await import('./index');
    const host = onlineHost({ auth: async () => ({ onSession() {}, readSession: async () => ({ userId: 'alice', accessToken: 'alice' }) }) as never,
      storage: memoryStorage(), fetch: server.fetch, rules: () => rules, setRules() {}, changed() {}, open() {}, home() {}, toast() {} });
    await host.signIn();
    const choices = { pool: ['R', 'B', 'N', 'G'], arrangement: 'manual' as const, cardPool: ['Freeze', 'Haste', 'Flight', 'MirrorB'] as const, king: { king: 'Spirit', power: 'Mercy' } as const };
    await host.host.invite('bob', rules, choices);
    const named = host.views.at(-1)!;
    const link = await host.host.createLink(rules, choices), token = new URL(link).hash.slice('#join='.length);
    const preview = await service.preview('bob', token);
    const expected = onlineOptions(rules, choices);
    expect(named.options).toEqual(expected); expect(preview.options).toEqual(expected);
    const joined = await service.join('bob', token); expect(joined.options).toEqual(expected);
    const creates = server.calls.filter(call => call.method === 'POST' && call.path === '/api/games');
    expect(creates).toHaveLength(2); expect(creates.map(call => (call.body as { options: unknown }).options)).toEqual([expected, expected]);
  } finally { await service.close(); }
});


it('binds both invite paths and the joining seat before the next-game preference changes', async () => {
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html')); vi.stubGlobal('history', { state: {}, replaceState: vi.fn() });
  vi.stubGlobal('sessionStorage', memoryStorage()); vi.stubGlobal('navigator', {}); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  const service = fixtureService();
  try {
    await service.handle('alice', { handle: 'alice' }); await service.handle('bob', { handle: 'bob' });
    const server = fakeServer(service), storage = memoryStorage(), bobStore = memoryStorage();
    const { onlineHost } = await import('./index');
    const hostFor = (userId: string, storage: ReturnType<typeof memoryStorage>) => onlineHost({
      auth: async () => ({ onSession: () => () => {}, readSession: async () => ({ userId, accessToken: userId }) }) as never,
      storage, fetch: server.fetch, rules: () => 'both', setRules() {}, changed() {}, open() {}, home() {}, toast() {},
    });
    const alice = hostFor('alice', storage), bob = hostFor('bob', bobStore); await alice.signIn(); await bob.signIn();
    const mud = { king: 'Mud', power: 'Leap' } as const, shadow = { king: 'Shadow', power: 'Darkness' } as const;
    const link = await alice.host.createLink('both', { ...PANEL_OPTIONS, arrangement: 'manual', king: mud });
    const first = alice.views[0];
    await alice.host.invite('bob', 'both', { ...PANEL_OPTIONS, arrangement: 'manual', king: shadow });
    const second = alice.views.find(v => v.game_id !== first.game_id)!;
    storage.setItem('kingdown.game-options', JSON.stringify({ king: { king: 'Flame', power: 'Haste' } }));
    expect(seatKing(storage, 'alice', first)).toEqual({ king: 'Mud', power: 'March' });
    expect(seatKing(storage, 'alice', second)).toEqual(shadow);
    bobStore.setItem('kingdown.game-options', JSON.stringify({ king: mud }));
    await bob.host.join({ token: new URL(link).hash.slice(6) });
    const joined = bob.views.find(v => v.game_id === first.game_id)!;
    bobStore.setItem('kingdown.game-options', JSON.stringify({ king: shadow }));
    expect(seatKing(bobStore, 'bob', joined)).toEqual({ king: 'Mud', power: 'March' });
    const controller = (userId: string, storage: ReturnType<typeof memoryStorage>) => peopleController({ userId, storage, server: peopleServer(onlineClient({ token: async () => userId, fetch: server.fetch })) });
    const a = controller('alice', storage), b = controller('bob', bobStore); await a.open(first.game_id); await b.open(first.game_id);
    const black = first.seat === 1 ? a : b, white = first.seat === 0 ? a : b;
    await black.ready(); await white.refresh(); await white.ready(); await black.refresh();
    expect(a.state().game!.rules.kings).toEqual([{ king: 'Mud', power: 'March' }, { king: 'Mud', power: 'March' }]);
    expect(JSON.parse(storage.getItem('kingdown.game-options')!).king).toEqual({ king: 'Flame', power: 'Haste' });
  } finally { await service.close(); }
});
