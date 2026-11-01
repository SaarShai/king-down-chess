import { expect, it, vi } from 'vitest';
import { createBrowserRuntime, createWebTransport } from './runtime';
import { onlineClient, OnlineError, type OnlineClient } from './client';
import { createPageClient } from '../plugin/client';
import { createQueue } from '../plugin/queue';
import { CANNOT_CONNECT } from '../account-game/types';
import { locks } from '../account-game/state';
import type { JoinPreview, View } from '../match/protocol';

function storage() {
  const records = new Map<string, string>();
  return { records, getItem: (key: string) => records.get(key) ?? null, setItem: (key: string, value: string) => { records.set(key, value); }, removeItem: (key: string) => { records.delete(key); } };
}
const args = { game_id: '11111111-1111-4111-8111-111111111111', command_id: 'fixed', expected_revision: 5, actions: ['Ra1-a4!H', 'Ra4-e4'] };
const view = { game_id: args.game_id, revision: 6 } as View;

it.each([false, true])('passes invitation IDs through web Join (preview: %s)', async preview => {
  const invite_id = 'a'.repeat(64), read = vi.fn(async () => ({ code: '', invite_id })), redeem = vi.fn(async () => view);
  const transport = createWebTransport({ preview: read, redeem } as unknown as OnlineClient, 'account-a', storage());
  const result = await transport.call('kingdown_join', { invite_id, preview }, {});
  expect(preview ? read : redeem).toHaveBeenCalledExactlyOnceWith({ invite_id }, undefined);
  expect(result._meta).toEqual(preview ? { preview: { code: '', invite_id } } : { view, board_id: view.game_id });
});

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
  expect(command.mock.calls).toEqual(Array.from({ length: 2 }, () => [args.game_id, 5, { type: 'turn', actions: args.actions }, 'fixed', undefined]));
  expect(saved.records.size).toBe(0);
});

it('reads private account notices through the existing profile adapter without persistence', async () => {
  const saved = storage(), page = {notices:[{id:'9007199254740993',text:'A private reason.'}],next_notices_before:null}, record = vi.fn(async()=>page);
  const result = await createWebTransport({record} as unknown as OnlineClient,'account-a',saved).call('kingdown_profile',{notices_before:'9007199254740993'},{});
  expect(record).toHaveBeenCalledWith({notices_before:'9007199254740993'},undefined);
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

it.each([
  ['success', 'success'], ['success', 'refusal'],
  ['refusal', 'success'], ['refusal', 'refusal'],
] as const)('keeps a newer command after two tabs retry: first %s, late %s', async (firstReply, lateReply) => {
  const saved = storage(), first = held<{ view: View }>(), late = held<{ view: View }>(), next = held<{ view: View }>();
  const command = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(late.promise).mockReturnValueOnce(next.promise);
  const api = { command } as unknown as OnlineClient;
  const tabA = createWebTransport(api, 'account-a', saved), tabB = createWebTransport(api, 'account-a', saved);
  const original = tabA.call('kingdown_move', args, {}), retry = tabB.call('kingdown_move', args, {});
  const complete = (reply: typeof first, outcome: typeof firstReply) => {
    if (outcome === 'success') reply.resolve({ view });
    else reply.reject(new OnlineError('STALE_REVISION', 409, 'The game changed'));
  };
  await vi.waitFor(() => expect(command).toHaveBeenCalledTimes(2));
  complete(first, firstReply);
  expect((await original).isError ?? false).toBe(firstReply === 'refusal');
  expect(tabA.pending()).toBeUndefined();
  const newerArgs = { ...args, command_id: 'newer', expected_revision: 6, actions: ['Ra4-a5'] };
  const newer = tabA.call('kingdown_move', newerArgs, {});
  const lost = expect(newer).rejects.toThrow('Lost newer reply');
  try {
    await vi.waitFor(() => expect(command).toHaveBeenCalledTimes(3));
    complete(late, lateReply);
    expect((await retry).isError ?? false).toBe(lateReply === 'refusal');
    expect(tabB.pending()).toEqual({ name: 'kingdown_move', args: newerArgs });
  } finally {
    next.reject(new TypeError('Lost newer reply'));
    await lost;
  }
  expect(createWebTransport(api, 'account-a', saved).pending()).toEqual({ name: 'kingdown_move', args: newerArgs });
});

it.each(['success', 'refusal'] as const)('locks receipt writes and rechecks ownership on %s', async outcome => {
  const saved = storage(), response = held<{ view: View }>(), command = vi.fn(() => response.promise);
  const transport = createWebTransport({ command } as unknown as OnlineClient, 'account-a', saved);
  const newer = { name: 'kingdown_move', args: { ...args, command_id: 'newer', expected_revision: 6 } };
  const requestLock = vi.spyOn(navigator.locks, 'request');
  let call!: ReturnType<typeof transport.call>;
  try {
    await navigator.locks.request('kingdown.account-command.account-a', async () => {
      call = transport.call('kingdown_move', args, {});
      expect(saved.records.size).toBe(0);
      expect(command).not.toHaveBeenCalled();
    });
    await vi.waitFor(() => expect(command).toHaveBeenCalledOnce());
    await navigator.locks.request('kingdown.account-command.account-a', async () => {
      if (outcome === 'success') response.resolve({ view });
      else response.reject(new OnlineError('STALE_REVISION', 409, 'The game changed'));
      await vi.waitFor(() => expect(requestLock).toHaveBeenCalledTimes(4));
      expect(transport.pending()).toEqual({ name: 'kingdown_move', args });
      // Another tab completes X and saves Y before this clear gets the lock.
      saved.removeItem('kingdown.account-command.account-a');
      saved.setItem('kingdown.account-command.account-a', JSON.stringify(newer));
    });
    expect((await call).isError ?? false).toBe(outcome === 'refusal');
    expect(transport.pending()).toEqual(newer);
  } finally {
    response.resolve({ view });
    await call;
    requestLock.mockRestore();
  }
});

it('cancels a command that waits for another tab to release the receipt lock', async () => {
  const saved = storage(), command = vi.fn(), controller = new AbortController();
  const transport = createWebTransport({ command } as unknown as OnlineClient, 'account-a', saved);
  await navigator.locks.request('kingdown.account-command.account-a', async () => {
    const call = transport.call('kingdown_move', args, { signal: controller.signal });
    controller.abort(new Error('Page closed'));
    await expect(call).rejects.toThrow('Page closed');
  });
  expect(saved.records.size).toBe(0);
  expect(command).not.toHaveBeenCalled();
});

it('uses one stable creation ID and keeps the HTTP game selection local to this page', async () => {
  const saved = storage(), create = vi.fn(async () => ({ view }));
  const client = createWebTransport({ create } as unknown as OnlineClient, 'a', saved);
  const reply = await client.call('kingdown_create', { kind: 'friend', options: {}, command_id: 'creation', board_id: 'old-board' }, {});
  expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'friend', options: {} }, 'creation', undefined);
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
  expect(find.mock.calls).toEqual([[args,undefined],[args,undefined]]); expect(saved.records.size).toBe(0);
  await reloaded.call('kingdown_accept',{game_id:view.game_id,rating_policy:'ranked-v1'},{});
  expect(accept).toHaveBeenCalledExactlyOnceWith(view.game_id,'ranked-v1',undefined);
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
    history: {
      pushState: vi.fn((_state: unknown, _title: string, path: string) => { browser.location = new URL(path, browser.location); }),
      replaceState: vi.fn((_state: unknown, _title: string, path: string) => { browser.location = new URL(path, browser.location); }),
    },
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
    expect(browser.location.pathname).toBe(`/g/${target}`);
    expect(browser.history.replaceState).not.toHaveBeenCalled();
    await host.call(name, args, {});
    expect(command).toHaveBeenCalledExactlyOnceWith(args.game_id, args.expected_revision,
      name === 'kingdown_computer' ? { type: 'computer' } : { type: 'turn', actions: args.actions }, args.command_id, undefined);
    expect(browser.localStorage.getItem('kingdown.account-command.a')).toBeNull();
    expect(state?.board_id).toBe(target);
  } finally { vi.unstubAllGlobals(); }
});
it.each([
  ['kingdown_computer', 'board', '/play/'], ['kingdown_move', 'board', '/play/settings'], ['kingdown_choose', 'seat', '/j'],
] as const)('names the recovered game in the URL when %s recovery replaces the %s entry at %s', async (name, screen, path) => {
  const { browser } = browserAt(path), receipt = { name, args };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen, board_id: args.game_id, pending: { ...receipt, screen } }));
  const host = createBrowserRuntime({} as OnlineClient, 'a'), results = vi.fn(); host.onResult = results;
  try {
    expect(host.stateHost?.widgetState?.privateContent).toMatchObject({ screen, board_id: args.game_id, pending: { ...receipt, screen } });
    expect(browser.location.pathname).toBe(`/g/${args.game_id}`);
    expect(browser.history.replaceState).toHaveBeenCalledOnce();
    expect(browser.history.pushState).not.toHaveBeenCalled();
    await host.connect(); await Promise.resolve();
    // The mount reads the recovered game, as a reload of its own page does.
    expect(results).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ structuredContent: { screen: 'board', game_id: args.game_id } }));
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});
it.each([['kingdown_create', 'play', '/play/'], ['kingdown_move', 'board', `/g/${args.game_id}`]] as const)('keeps the URL when %s recovery shows %s at %s', (name, screen, path) => {
  const { browser } = browserAt(path), receipt = { name, args };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen, board_id: args.game_id, pending: { ...receipt, screen } }));
  try {
    expect(createBrowserRuntime({} as OnlineClient, 'a').stateHost?.widgetState?.privateContent).toMatchObject({ screen });
    expect(browser.location.pathname).toBe(path);
    expect(browser.history.replaceState).not.toHaveBeenCalled();
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
    if (name === 'kingdown_create') expect(create).toHaveBeenCalledExactlyOnceWith({ kind: 'solo' }, 'start-once', expect.any(AbortSignal));
    else expect(find).toHaveBeenCalledExactlyOnceWith({ kind: 'solo', command_id: 'start-once' }, expect.any(AbortSignal));
  } finally { vi.unstubAllGlobals(); }
});
// Builds before ticket 97 saved the result-details read with retention: this is the exact page record they left.
it.each([
  ['after a held reply', {}],
  ['after a failed reply', { error: CANNOT_CONNECT, error_screen: 'end' }],
] as const)('drops a saved result-details read on /play/ %s, so Start unlocks', (_case, failure) => {
  const { browser } = browserAt('/play/'), game_tag = args.game_id.slice(0, 8);
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'end', board_id: args.game_id, pending: { name: 'kingdown_get', args: {}, game_tag, screen: 'end', ...failure } }));
  try {
    const host = createBrowserRuntime({} as OnlineClient, 'a'), client = createPageClient(host.call, host.stateHost);
    expect(client.state).toMatchObject({ screen: 'play', board_id: undefined });
    expect(client.state.pending).toBeUndefined();
    expect(locks({ screen: 'play', pending: client.state.pending, pendingScope: host.stateHost?.pendingScope, connected: true, mounting: false, writing: false }).start).toBe(false);
  } finally { vi.unstubAllGlobals(); }
});
it('keeps a durable saved command with its receipt beside the dropped-read rule', () => {
  const { browser } = browserAt('/play/'), receipt = { name: 'kingdown_resign', args: { game_id: args.game_id, command_id: 'resign-once', expected_revision: 5 } };
  browser.localStorage.setItem('kingdown.account-command.a', JSON.stringify(receipt));
  browser.localStorage.setItem('kingdown.account-game.a', JSON.stringify({ screen: 'board', board_id: args.game_id, pending: { ...receipt, game_tag: args.game_id.slice(0, 8), screen: 'board', error: CANNOT_CONNECT } }));
  try {
    expect(createBrowserRuntime({} as OnlineClient, 'a').stateHost?.widgetState?.privateContent?.pending).toMatchObject({ ...receipt, screen: 'board', error: undefined });
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

it.each(['request', 'body'] as const)('ends a stalled HTTP %s at the page deadline and retries the saved command', async phase => {
  vi.useFakeTimers();
  const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
  const saved = storage(), queue = createQueue(), request = held<Response>(), body = held<unknown>();
  const ack = { type: 'ack', command_id: args.command_id, revision: view.revision, view };
  const response = () => new Response(JSON.stringify(ack), { headers: { 'Content-Type': 'application/json' } });
  let signal: AbortSignal | undefined;
  const fetch = vi.fn<typeof globalThis.fetch>().mockImplementationOnce(async (_url, init) => {
    signal = init?.signal ?? undefined;
    signal?.addEventListener('abort', () => { if (phase === 'request') request.reject(signal!.reason); else body.reject(signal!.reason); }, { once: true });
    if (phase === 'request') return request.promise;
    const reply = response(); vi.spyOn(reply, 'json').mockImplementation(() => body.promise);
    return reply;
  }).mockImplementation(async () => response());
  const transport = createWebTransport(onlineClient({ token: async () => 'jwt', fetch }), 'a', saved);
  const client = createPageClient(transport.call);
  const run = () => queue.run(queue.command('write', 'kingdown_move', args), async () => ({ status: 'done', result: await client.call('kingdown_move', args) }));
  const pending = run();
  try {
    await vi.advanceTimersByTimeAsync(9_999);
    expect(queue.writing()).toBe(true);
    await vi.advanceTimersByTimeAsync(1);
    expect(queue.writing()).toBe(false);
    expect(await pending).toEqual({ status: 'failed', text: CANNOT_CONNECT });
    expect(signal?.aborted).toBe(true);
    expect(client.inflight).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(transport.pending()).toEqual({ name: 'kingdown_move', args });
    expect(await run()).toMatchObject({ status: 'done', result: { _meta: { view } } });
    expect(fetch.mock.calls.map(([, init]) => JSON.parse(init!.body as string))).toEqual(Array.from({ length: 2 }, () => ({ command_id: args.command_id, expected_revision: args.expected_revision, action: { type: 'turn', actions: args.actions } })));
    expect(transport.pending()).toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    request.resolve(response()); body.resolve(ack); await pending;
    vi.useRealTimers(); diagnostic.mockRestore();
  }
});

it.each([
  ['kingdown_move', args], ['kingdown_get', { game_id: args.game_id }], ['kingdown_resume', { game_id: args.game_id }], ['kingdown_open', { game_id: args.game_id }],
  ['kingdown_create', { kind: 'friend', command_id: 'create-once' }], ['kingdown_find', { mode: 'ranked', command_id: 'find-once' }],
  ['kingdown_preview', { game_id: args.game_id, expected_revision: 5, actions: [] }], ['kingdown_games', {}], ['kingdown_settings', {}],
  ['kingdown_handle', { handle: 'player', check: true }], ['kingdown_profile', {}], ['kingdown_join', { code: 'K7QX2M', preview: true }], ['kingdown_join', { code: 'K7QX2M' }],
  ['kingdown_invite', { game_id: args.game_id }], ['kingdown_seen', { game_id: args.game_id }], ['kingdown_lobby', {}],
  ['kingdown_accept', { game_id: args.game_id }], ['kingdown_cancel', { game_id: args.game_id }], ['kingdown_block', { user_id: 'other' }], ['kingdown_report', { target: 'player', user_id: 'other', category: 'other' }],
] as [string, Record<string, unknown>][])('applies the transport deadline to %s HTTP', async (name, input) => {
  vi.useFakeTimers();
  const request = held<Response>(); let signal: AbortSignal | undefined;
  const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
    signal = init?.signal ?? undefined;
    signal?.addEventListener('abort', () => request.reject(signal!.reason), { once: true });
    return request.promise;
  });
  const transport = createWebTransport(onlineClient({ token: async () => 'jwt', fetch }), 'a', storage());
  const pending = transport.call(name, input, { timeout: 25 }), rejected = expect(pending).rejects.toThrow('Request timed out');
  try {
    await vi.advanceTimersByTimeAsync(25); expect(signal?.aborted).toBe(true); await rejected;
    expect(fetch).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  } finally { request.resolve(new Response('{}')); await Promise.allSettled([pending, rejected]); vi.useRealTimers(); }
});

it('keeps caller cancellation with a deadline and refuses a pre-aborted command before storage', async () => {
  vi.useFakeTimers();
  const request = held<Response>(), saved = storage(), controller = new AbortController(), reason = new Error('Page closed');
  const fetch = vi.fn<typeof globalThis.fetch>(async (_url, init) => {
    init!.signal!.addEventListener('abort', () => request.reject(init!.signal!.reason), { once: true });
    return request.promise;
  });
  const transport = createWebTransport(onlineClient({ token: async () => 'jwt', fetch }), 'a', saved);
  // Safari before 17.4 has no AbortSignal.any.
  vi.spyOn(AbortSignal, 'any').mockImplementation(() => { throw new TypeError('AbortSignal.any is not a function'); });
  const pending = transport.call('kingdown_move', args, { timeout: 25, signal: controller.signal }), rejected = expect(pending).rejects.toBe(reason);
  try {
    await vi.advanceTimersByTimeAsync(10); controller.abort(reason); await rejected;
    expect(fetch.mock.calls[0][1]?.signal?.reason).toBe(reason);
    expect(transport.pending()).toEqual({ name: 'kingdown_move', args });
    saved.records.clear();
    await expect(transport.call('kingdown_move', args, { timeout: 25, signal: controller.signal })).rejects.toBe(reason);
    expect(saved.records.size).toBe(0); expect(fetch).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  } finally { request.resolve(new Response('{}')); await Promise.allSettled([pending, rejected]); vi.useRealTimers(); vi.restoreAllMocks(); }
});

it.each(['token', 'retry'] as const)('ends the %s wait at the deadline and sends no later command', async phase => {
  vi.useFakeTimers();
  const session = held<string>(), saved = storage(), fetch = vi.fn<typeof globalThis.fetch>().mockRejectedValue(new TypeError('offline'));
  const token = vi.fn(() => phase === 'token' ? session.promise : Promise.resolve('jwt'));
  const transport = createWebTransport(onlineClient({ token, fetch }), 'a', saved);
  const pending = transport.call('kingdown_move', args, { timeout: 25 }), rejected = expect(pending).rejects.toThrow('Request timed out');
  try {
    await vi.advanceTimersByTimeAsync(25); await rejected;
    expect(transport.pending()).toEqual({ name: 'kingdown_move', args });
    session.resolve('jwt'); await vi.advanceTimersByTimeAsync(1_000);
    expect(fetch).toHaveBeenCalledTimes(phase === 'token' ? 0 : 1);
    expect(token).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0);
  } finally { session.resolve('jwt'); await Promise.allSettled([pending, rejected]); vi.useRealTimers(); }
});

it.each(['success', 'refusal'] as const)('keeps the receipt when an aborted call returns a late %s', async outcome => {
  vi.useFakeTimers();
  const command = held<{ view: View }>(), saved = storage();
  const transport = createWebTransport({ command: () => command.promise } as unknown as OnlineClient, 'a', saved);
  const pending = transport.call('kingdown_move', args, { timeout: 25 }), rejected = expect(pending).rejects.toThrow('Request timed out');
  try {
    await vi.advanceTimersByTimeAsync(25); await rejected;
    if (outcome === 'success') command.resolve({ view }); else command.reject(new OnlineError('STALE_REVISION', 409, 'The game changed'));
    await vi.advanceTimersByTimeAsync(0);
    expect(transport.pending()).toEqual({ name: 'kingdown_move', args });
    expect(vi.getTimerCount()).toBe(0);
  } finally { command.resolve({ view }); await Promise.allSettled([pending, rejected]); vi.useRealTimers(); }
});

it('keeps mount reads without a page deadline and cancels a completed deadline', async () => {
  vi.useFakeTimers();
  const request = held<Response>(), fetch = vi.fn<typeof globalThis.fetch>().mockReturnValueOnce(request.promise).mockResolvedValue(new Response('[]'));
  const transport = createWebTransport(onlineClient({ token: async () => 'jwt', fetch }), 'a', storage()), client = createPageClient(transport.call);
  let done = false;
  const pending = client.call('kingdown_games', {}, { limit: false }).then(result => { done = true; return result; });
  try {
    await vi.advanceTimersByTimeAsync(60_000); expect(done).toBe(false); expect(fetch.mock.calls[0][1]?.signal).toBeUndefined();
    request.resolve(new Response('[]')); await pending;
    await client.call('kingdown_games');
    const signal = fetch.mock.calls[1][1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal); expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(10_000); expect(signal?.aborted).toBe(false);
  } finally { request.resolve(new Response('[]')); await pending; vi.useRealTimers(); }
});

it.each(['reply', 'error'] as const)('ignores a held invitation %s after Back opens Menu', async outcome => {
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

it('opens the friend setup from its URL without sending a game command', async () => {
  browserAt('/play/friend');
  const host = createBrowserRuntime({} as OnlineClient, 'a'), receive = vi.fn();
  host.onResult = receive;
  try {
    expect(host.stateHost?.widgetState?.privateContent).toMatchObject({ screen: 'play' });
    await host.connect(); await Promise.resolve();
    expect(receive).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ structuredContent: { screen: 'play', new_friend: true } }));
  } finally { host.dispose?.(); vi.unstubAllGlobals(); }
});
