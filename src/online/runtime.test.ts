import { expect, it, vi } from 'vitest';
import { createBrowserRuntime, createWebTransport } from './runtime';
import { OnlineError, type OnlineClient } from './client';
import { createPageClient } from '../plugin/client';
import type { JoinPreview, View } from '../match/protocol';

function storage() {
  const records = new Map<string, string>();
  return { records, getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); } };
}
const args = { game_id: '11111111-1111-4111-8111-111111111111', command_id: 'fixed', expected_revision: 5, actions: ['Ra1-a4!H', 'Ra4-e4'] };
const view = { game_id: args.game_id, revision: 6 } as View;

it('persists the full command before sending, then retries the exact input after a lost reply and reload', async () => {
  const saved = storage();
  const command = vi.fn(async () => {
    expect(JSON.parse([...saved.records.values()][0])).toEqual({ name: 'kingdown_move', args });
    throw new TypeError('Lost reply');
  });
  const api = { command } as unknown as OnlineClient;
  await expect(createWebTransport(api, 'account-a', saved).call('kingdown_move', args, {})).rejects.toThrow('Lost reply');
  const reloaded = createWebTransport(api, 'account-a', saved);
  expect(reloaded.pending()).toEqual({ name: 'kingdown_move', args });
  command.mockImplementationOnce(async () => ({ view }) as never);
  expect((await reloaded.call(reloaded.pending()!.name, reloaded.pending()!.args, {}))._meta?.view).toEqual(view);
  expect(command.mock.calls).toEqual(Array.from({ length: 2 }, () => [args.game_id, 5, { type: 'turn', actions: args.actions }, 'fixed']));
  expect(saved.records.size).toBe(0);
});

it('reads private account notices through the existing profile adapter without persistence', async () => {
  const saved = storage(), page = {notices:[{id:'9007199254740993',text:'A private reason.'}],next_notices_before:null}, record = vi.fn(async()=>page);
  const result = await createWebTransport({record} as unknown as OnlineClient,'account-a',saved).call('kingdown_profile',{notices_before:'9007199254740993'},{});
  expect(record).toHaveBeenCalledWith({notices_before:'9007199254740993'});
  expect(result._meta).toEqual(page); expect(result.structuredContent ?? {}).toEqual({}); expect(saved.records.size).toBe(0);
});

it('keeps receipts in their account and refuses another payload until the uncertain command settles', async () => {
  const saved = storage(), command = vi.fn(async () => { throw new TypeError('offline'); });
  const first = createWebTransport({ command } as unknown as OnlineClient, 'account-a', saved);
  await expect(first.call('kingdown_move', args, {})).rejects.toThrow('offline');
  expect(createWebTransport({} as OnlineClient, 'account-b', saved).pending()).toBeUndefined();
  await expect(first.call('kingdown_move', { ...args, actions: ['other'] }, {})).rejects.toThrow('Retry the saved command');
  expect(command).toHaveBeenCalledTimes(1);
});

it('does not send when durable storage fails and clears only a definitive refusal', async () => {
  const command = vi.fn(async () => { throw new OnlineError('STALE_REVISION', 409, 'The game changed'); });
  const saved = storage(), api = { command } as unknown as OnlineClient;
  await expect(createWebTransport(api, 'a', { ...saved, setItem: () => { throw new Error('Storage full'); } }).call('kingdown_move', args, {})).rejects.toThrow('Storage full');
  expect(command).not.toHaveBeenCalled();
  const reply = await createWebTransport(api, 'a', saved).call('kingdown_move', args, {});
  expect(reply).toMatchObject({ isError: true, _meta: { code: 'STALE_REVISION' } });
  expect(saved.records.size).toBe(0);
});

it('uses one stable creation ID and keeps the HTTP game selection local to this page', async () => {
  const saved = storage(), create = vi.fn(async () => ({ view }));
  const client = createWebTransport({ create } as unknown as OnlineClient, 'a', saved);
  const reply = await client.call('kingdown_create', { kind: 'friend', options: {}, command_id: 'creation', board_id: 'old-board' }, {});
  expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'friend', options: {} }, 'creation');
  expect(reply).toMatchObject({ _meta: { view, board_id: view.game_id } });
  expect(saved.records.size).toBe(0);
});

it('preserves Ranked Find after a lost reply and forwards the displayed acceptance policy', async () => {
  const saved=storage(), args={mode:'ranked',command_id:'ranked-once'}, find=vi.fn(async()=>{throw new TypeError('Lost reply');});
  const accept=vi.fn(async()=>view), api={find,accept} as unknown as OnlineClient;
  await expect(createWebTransport(api,'a',saved).call('kingdown_find',args,{})).rejects.toThrow('Lost reply');
  const reloaded=createWebTransport(api,'a',saved);
  expect(reloaded.pending()).toEqual({name:'kingdown_find',args});
  find.mockImplementationOnce(async()=>view as never);
  await reloaded.call(reloaded.pending()!.name,reloaded.pending()!.args,{});
  expect(find.mock.calls).toEqual([[args],[args]]); expect(saved.records.size).toBe(0);
  await reloaded.call('kingdown_accept',{game_id:view.game_id,rating_policy:'ranked-v1'},{});
  expect(accept).toHaveBeenCalledExactlyOnceWith(view.game_id,'ranked-v1');
});


it('restores the saved setup continuation with the durable creation receipt', async () => {
  const saved = storage(), creation = { kind: 'friend', command_id: 'create-once' };
  const api = { create: async () => { throw new TypeError('Lost reply'); } } as unknown as OnlineClient;
  await expect(createWebTransport(api, 'a', saved).call('kingdown_create', creation, {})).rejects.toThrow('Lost reply');
  saved.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'play', pending: { name: 'kingdown_create', args: creation, screen: 'play', quick: true, king: null, error: 'Lost reply' } }));
  vi.stubGlobal('window', { localStorage: saved, location: { href: 'http://localhost/play/' } });
  try {
    expect(createBrowserRuntime(api, 'a').stateHost?.widgetState?.privateContent?.pending).toMatchObject({ name: 'kingdown_create', args: creation, quick: true, king: null, screen: 'play', error: undefined });
  } finally { vi.unstubAllGlobals(); }
});


function browserAt(path: string) {
  const records = storage();
  const browser = Object.assign(new EventTarget(), {
    location: new URL(path, 'http://localhost'), localStorage: records, sessionStorage: records,
    history: { pushState: vi.fn((_state: unknown, _title: string, path: string) => { browser.location = new URL(path, browser.location); }) },
  });
  vi.stubGlobal('window', browser);
  return { browser, back(path: string) { browser.location = new URL(path, browser.location); browser.dispatchEvent(new Event('popstate')); } };
}
it.each(['kingdown_computer', 'kingdown_move'])('keeps the URL game while recovering another game\'s %s', async name => {
  const target = '22222222-2222-4222-8222-222222222222';
  const { browser } = browserAt(`/g/${target}`), receipt = { name, args };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'board', board_id: args.game_id, pending: { ...receipt, screen: 'board' } }));
  const command = vi.fn(async () => ({ view })), host = createBrowserRuntime({ command } as unknown as OnlineClient, 'a');
  try {
    const state = host.stateHost?.widgetState?.privateContent;
    expect(state).toMatchObject({ screen: 'board', board_id: target, pending: { ...receipt, screen: 'board' } });
    await host.call(name, args, {});
    expect(command).toHaveBeenCalledExactlyOnceWith(args.game_id, args.expected_revision,
      name === 'kingdown_computer' ? { type: 'computer' } : { type: 'turn', actions: args.actions }, args.command_id);
    expect(browser.localStorage.getItem('kingdown.account-command.a')).toBeNull();
    expect(state?.board_id).toBe(target);
  } finally { vi.unstubAllGlobals(); }
});
it.each(['kingdown_create', 'kingdown_find'])('preserves the existing start continuation and exact board input for %s', async name => {
  const target = '22222222-2222-4222-8222-222222222222', { browser } = browserAt(`/g/${target}`);
  const input = { kind: 'solo', command_id: 'start-once', board_id: args.game_id }, receipt = { name, args: input };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'play', board_id: args.game_id, pending: { ...receipt, screen: 'play' } }));
  const create = vi.fn(async () => ({ view })), find = vi.fn(async () => view);
  const host = createBrowserRuntime({ create, find } as unknown as OnlineClient, 'a'), client = createPageClient(host.call, host.stateHost);
  try {
    expect(client.state).toMatchObject({ screen: 'play', board_id: args.game_id, pending: receipt });
    await client.call(name, client.state.pending!.args);
    expect(browser.localStorage.getItem('kingdown.account-command.a')).toBeNull();
    if (name === 'kingdown_create') expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'solo' }, 'start-once');
    else expect(find).toHaveBeenCalledExactlyOnceWith({ kind: 'solo', command_id: 'start-once' });
  } finally { vi.unstubAllGlobals(); }
});
it('keeps a same-game setup continuation while recovering its saved command', () => {
  const { browser } = browserAt(`/g/${args.game_id}`), receipt = { name: 'kingdown_choose', args: { game_id: args.game_id, command_id: 'ready-once', expected_revision: 0, ready: true } };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'seat', board_id: args.game_id, pending: { ...receipt, screen: 'seat' } }));
  try {
    expect(createBrowserRuntime({} as OnlineClient, 'a').stateHost?.widgetState?.privateContent)
      .toMatchObject({ screen: 'seat', board_id: args.game_id, pending: { ...receipt, screen: 'seat' } });
  } finally { vi.unstubAllGlobals(); }
});
it.each(['board', 'seat', 'friend', 'wait', 'end'] as const)('keeps the selected game URL while %s waits for its first view', async screen => {
  const game = '11111111-1111-4111-8111-111111111111';
  const { browser } = browserAt(`/g/${game}`), host = createBrowserRuntime({} as OnlineClient, 'a');
  const results = vi.fn(); host.onResult = results;
  try {
    await host.connect();
    host.route!(screen);
    expect(browser.location.pathname).toBe(`/g/${game}`);
    expect(browser.history.pushState).not.toHaveBeenCalled();
    expect(results).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ structuredContent: { screen: 'board', game_id: game } }));
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});
it('still routes explicit Play and Home, account menus and identified game screens', async () => {
  const game = '11111111-1111-4111-8111-111111111111', other = '22222222-2222-4222-8222-222222222222';
  const { browser } = browserAt(`/g/${game}`), host = createBrowserRuntime({} as OnlineClient, 'a');
  try {
    await host.connect();
    for (const [screen, game, path] of [['play', undefined, '/play/'], ['board', other, `/g/${other}`], ['profile', undefined, '/play/profile'], ['settings', undefined, '/play/settings'], ['end', other, `/g/${other}`], ['home', undefined, '/play/']] as const) {
      host.route!(screen, game);
      expect(browser.location.pathname).toBe(path);
    }
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});
it('opens Support through ordinary website navigation without storing notice content', async () => {
  const {browser}=browserAt('/play/profile'), assign=vi.fn(); Object.assign(browser.location,{assign});
  try {
    const host=createBrowserRuntime({} as OnlineClient,'a');
    await expect(host.openLink({url:'https://kingdown.dev/support.html#appeals'})).resolves.toEqual({});
    expect(assign).toHaveBeenCalledWith('https://kingdown.dev/support.html#appeals');
    expect(browser.localStorage.records.size).toBe(0);
  } finally {vi.unstubAllGlobals();}
});
function held<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

it.each(['reply', 'error'] as const)('ignores a held invitation %s after Back opens Play', async outcome => {
  const { browser, back } = browserAt('/j#K7QX2M'), pending = held<JoinPreview>();
  const host = createBrowserRuntime({ preview: () => pending.promise } as unknown as OnlineClient, 'a');
  const results = vi.fn(); host.onResult = results;
  try {
    await host.connect();
    back('/play/');
    expect(results).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ structuredContent: { screen: 'play' } }));
    if (outcome === 'reply') pending.resolve({ code: 'K7QX2M' } as JoinPreview);
    else pending.reject(new OnlineError('INVITE_UNAVAILABLE', 404, 'Old invitation'));
    await Promise.allSettled([pending.promise]);
    expect(results).toHaveBeenCalledTimes(1);
    expect(browser.location.pathname).toBe('/play/');
    expect(browser.history.pushState).not.toHaveBeenCalled();
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});

it('publishes only the current invitation when two previews return out of order', async () => {
  const { back } = browserAt('/j#K7QX2M'), first = held<JoinPreview>(), second = held<JoinPreview>();
  const preview = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const host = createBrowserRuntime({ preview } as unknown as OnlineClient, 'a'), results = vi.fn(); host.onResult = results;
  try {
    await host.connect();
    back('/j#H8RX3N');
    second.resolve({ code: 'H8RX3N' } as JoinPreview); await second.promise;
    first.resolve({ code: 'K7QX2M' } as JoinPreview); await first.promise;
    expect(preview.mock.calls).toEqual([[{ code: 'K7QX2M' }], [{ code: 'H8RX3N' }]]);
    expect(results).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ _meta: { preview: { code: 'H8RX3N' } }, structuredContent: { screen: 'join' } }));
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});

it('invalidates a held preview when the shared runtime navigates away', async () => {
  const { browser } = browserAt('/j#K7QX2M'), pending = held<JoinPreview>();
  const host = createBrowserRuntime({ preview: () => pending.promise } as unknown as OnlineClient, 'a'), results = vi.fn(); host.onResult = results;
  try {
    await host.connect();
    host.route?.('play');
    pending.resolve({ code: 'K7QX2M' } as JoinPreview); await pending.promise;
    expect(results).not.toHaveBeenCalled();
    expect(browser.location.pathname).toBe('/play/');
    expect(browser.history.pushState).toHaveBeenCalledExactlyOnceWith(null, '', '/play/');
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});

it('reads a private draft prefix with cancellation and never creates a command receipt', async()=>{
 const saved=storage(), input={expected_revision:5,engine_fingerprint:'sha256:'+'a'.repeat(64),actions:['Ra1-a4!H']};
 const draft={game_id:args.game_id,...input,revision:5,positions:[]},previewDraft=vi.fn(async()=>draft),command=vi.fn();
 const controller=new AbortController(),transport=createWebTransport({previewDraft,command} as unknown as OnlineClient,'account-a',saved);
 const result=await transport.call('kingdown_preview',{game_id:args.game_id,...input},{signal:controller.signal});
 expect(previewDraft).toHaveBeenCalledExactlyOnceWith(args.game_id,input,controller.signal);
 expect(result).toEqual({content:[{type:'text',text:''}],_meta:{draft}});
 expect(command).not.toHaveBeenCalled();expect(transport.pending()).toBeUndefined();expect(saved.records.size).toBe(0);
 controller.abort();await expect(transport.call('kingdown_preview',{game_id:args.game_id,...input},{signal:controller.signal})).rejects.toMatchObject({name:'AbortError'});
 expect(previewDraft).toHaveBeenCalledOnce();
});
