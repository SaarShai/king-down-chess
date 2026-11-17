/** The old account screen binds sign-out to the session it shows (review of PR 361, round 5). */
import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any, events: [] as {event: string; user: string | null}[], syncs: [] as {user: string; stopped: boolean; changes: number}[] }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => {
    const sb = actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: harness.fetch },
  }); harness.auth = sb.auth; sb.auth.onAuthStateChange((event, s) => { harness.events.push({event, user: s?.user?.id ?? null}); }); return sb; } };
});
const tokenExpiry = Math.floor(Date.now() / 1000) + 3600;
const jwt = (id: string, iat = 1, exp = tokenExpiry) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat, exp })) + '.signature';
const session = (id: string, user = id, iat = 1) => ({ access_token: jwt(id, iat), refresh_token: 'fixture-refresh-' + id, token_type: 'bearer', expires_in: 3600, expires_at: Date.now() / 1000 + 3600, user: { id: user } });
function setup(store = memoryStorage()) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); await harness.auth?.dispose(); harness.syncs.length = 0; harness.events.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

vi.mock('./sync', async importOriginal => {
  const actual = await importOriginal<typeof import('./sync')>();
  return { ...actual, Sync: class extends actual.Sync {
    record: { user: string; stopped: boolean; changes: number };
    constructor(...args: ConstructorParameters<typeof actual.Sync>) {
      super(...args);
      this.record = { user: args[1].userId, stopped: false, changes: 0 };
      harness.syncs.push(this.record);
    }
    stop() { this.record.stopped = true; super.stop(); }
    changed() { this.record.changes++; super.changed(); }
  } };
});


function screen() {
  const handlers = new Map<string, (event: any) => Promise<void>>();
  const elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', hidden: false,
      contains() { return false; }, querySelector() { return null; }, insertAdjacentHTML() {},
      addEventListener(event: string, fn: (event: any) => Promise<void>) { handlers.set(id + ':' + event, fn); },
      showModal() {}, returnValue: '',
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element, querySelector: () => element('entry'), addEventListener() {}, activeElement: null });
  vi.stubGlobal('addEventListener', () => {});
  return { elements, click: () => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'sign-out' } }) } }),
    act: (act: string) => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act } }) } }),
    closeDelete: async () => {
      // A player opens the dialog with Delete my account first; the dialog keeps that account.
      if (typeof window === 'undefined') { const w: any = {}; w.top = w.self = w; vi.stubGlobal('window', w); }
      await handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'delete' } }) } });
      element('delete-account').returnValue = 'delete'; return handlers.get('delete-account:close')!({});
    } };
}

const settle = () => new Promise(r => setTimeout(r, 60));
const access = { blocked: () => false, accepts: () => true };

it.each(['email', 'provider'])('accepts a first %s sign-in and starts cloud save', async method => {
  const store = setup(), ui = screen();
  harness.fetch.mockImplementation(async input => Response.json(String(input).includes('/verify') || String(input).includes('/token') ? session('first', 'alice') : String(input).includes('/rest/') ? null : { external: { github: true } }));
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await ui.act('retry-signin'); await vi.waitFor(() => expect(harness.auth).not.toBeNull()); await settle();
  if (method === 'email') await harness.auth.verifyOtp({ email: 'alice@example.test', token: '123456', type: 'email' });
  else {
    const { data, error } = await harness.auth.signInWithOAuth({ provider: 'github', options: { skipBrowserRedirect: true } });
    expect(error).toBeNull();
    const reply = await harness.auth.exchangeCodeForSession('provider-code', { flowId: data.flowId });
    expect(reply.error).toBeNull();
  }
  await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('alice');
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(harness.syncs).toHaveLength(1); changed(); expect(harness.syncs[0].changes).toBe(1);
});

it('accepts a same-session refresh and keeps cloud save', async () => {
  const store = setup(), ui = screen(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  harness.fetch.mockImplementation(async input => Response.json(String(input).includes('/token') ? session('first', 'alice', 2) : null));
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  await harness.auth.refreshSession(); await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('first', 2));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(harness.syncs).toHaveLength(1); expect(harness.syncs[0].stopped).toBe(false); changed(); expect(harness.syncs[0].changes).toBe(1);
});

it.each(['delete', 'muse'])('allows %s for the confirmed session after a token refresh', async action => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const sent: { path: string; auth: string | null }[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input); sent.push({path, auth: new Headers(init?.headers).get('Authorization')});
    return Response.json(path.includes('/token') ? session('first', 'alice', 2) : path.includes('muse_client_ids') ? ['muse-fixture'] : path.includes('delete_my_muse_games') ? 2 : {});
  });
  const { connect } = await import('./client'); const c = connect('kingdown.auth'), expected = (await c.readSession())!;
  await harness.auth.refreshSession();
  if (action === 'delete') await c.deleteAccount(expected); else expect(await c.disconnectMuse(expected)).toBe(2);
  const actions = sent.filter(s => s.path.includes('/rpc/') || s.path.includes('/oauth/grants'));
  expect(actions.length).toBeGreaterThan(0); expect(actions.every(s => s.auth === 'Bearer ' + jwt('first', 2))).toBe(true);
});

it.each(['delete', 'muse'])('never sends %s with B after its check reads A', async action => {
  const memory = memoryStorage(); let arm = false, snapshot = false;
  let switching: Promise<unknown> | undefined; let switchAccount!: () => Promise<unknown>;
  const store = { ...memory, get length() { return memory.length; }, getItem(key: string) {
    const value = memory.getItem(key);
    if (key === 'kingdown.auth' && arm) { arm = false; snapshot = true; switching = switchAccount(); }
    return value;
  } };
  let tail: Promise<unknown> = Promise.resolve();
  const locks = { request<T>(_name: string, run: () => Promise<T>): Promise<T> {
    let after: Promise<unknown> | undefined;
    const result = tail.then(async () => { const value = await run(); if (snapshot) { snapshot = false; after = switching; } return value; });
    tail = result.then(() => {}, () => {});
    // Release this storage lock before the caller consumes its snapshot.
    // The other tab completes an already-started sign-in in that interval.
    return result.then(async value => { if (after) await after; return value; });
  } };
  setup(store); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  vi.stubGlobal('navigator', { onLine: true, locks });
  const ui = screen(), sent: { path: string; auth: string | null }[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input); sent.push({path, auth: new Headers(init?.headers).get('Authorization')});
    if (path.includes('/verify')) return Response.json(session('later', 'bob'));
    if (path.includes('muse_client_ids')) return Response.json(['00000000-0000-4000-8000-000000000001']);
    if (path.includes('/oauth/grants')) { arm = true; return Response.json({}); }
    return Response.json(path.includes('delete_my_muse_games') ? 2 : path.includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1)); await settle();
  const firstAuth = harness.auth;
  const { connect } = await import('./client');
  const caller = action === 'muse' ? connect('kingdown.auth') : null; const callerAuth = caller ? harness.auth : null;
  if (caller) await caller.readSession();
  const other = connect('kingdown.auth'); const otherAuth = harness.auth;
  await other.readSession(); await settle();
  switchAccount = () => other.verifyEmailCode('bob@example.test', '123456');
  try {
    if (action === 'delete') { arm = true; await ui.closeDelete(); }
    else await caller!.disconnectMuse({userId: 'alice', accessToken: jwt('first')});
    await switching; await settle();
    expect(switching).toBeDefined();
    expect(JSON.parse(memory.getItem('kingdown.auth')!).user.id).toBe('bob');
    expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
    const destructive = sent.filter(s => /delete_my_account|delete_my_muse_games|oauth\/grants/.test(s.path));
    expect(destructive.map(s => s.auth)).not.toContain('Bearer ' + jwt('later'));
  } finally { await firstAuth.dispose(); await otherAuth.dispose(); await callerAuth?.dispose(); }
});

it('does not show a successful sign-in when storage is blocked', async () => {
  const memory = memoryStorage(); let blocked = false;
  const store = { ...memory, get length() { return memory.length; }, getItem(key: string) { if (blocked) throw new DOMException('Blocked', 'SecurityError'); return memory.getItem(key); }, setItem(key: string, value: string) { if (blocked) throw new DOMException('Blocked', 'SecurityError'); memory.setItem(key, value); } };
  setup(store); const ui = screen();
  harness.fetch.mockImplementation(async input => Response.json(String(input).includes('/verify') ? session('first', 'alice') : { external: { github: true } }));
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await ui.act('retry-signin'); await vi.waitFor(() => expect(harness.auth).not.toBeNull()); await settle();
  blocked = true;
  await expect(harness.auth.verifyOtp({email: 'alice@example.test', token: '123456', type: 'email'})).rejects.toThrow('Blocked');
  await settle(); blocked = false;
  expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
  expect(memory.getItem('kingdown.auth')).toBeNull(); expect(harness.syncs).toHaveLength(0);
});

it('keeps an expired offline start safe and accepts its later recovery event', async () => {
  const store = setup(), ui = screen();
  const expired = { ...session('first', 'alice'), expires_at: Math.floor(Date.now() / 1000) - 60, access_token: jwt('first', 1, Math.floor(Date.now() / 1000) - 60) };
  store.setItem('kingdown.auth', JSON.stringify(expired));
  let offline = true;
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/token')) return offline ? Response.json({message: 'offline'}, {status: 503}) : Response.json(session('first', 'alice', 2));
    return Response.json(null);
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.events).toContainEqual({event: 'INITIAL_SESSION', user: null}), { timeout: 35000 });
  await settle();
  expect(store.getItem('kingdown.auth')).toBe(JSON.stringify(expired));
  expect(harness.syncs).toHaveLength(0);
  // Pass the installed library's one-minute failure cooldown. No race test changes the clock.
  const now = Date.now(); vi.spyOn(Date, 'now').mockReturnValue(now + 61000); offline = false;
  expect((await harness.auth.refreshSession()).error).toBeNull(); await settle();
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(harness.syncs).toHaveLength(1); changed(); expect(harness.syncs[0].changes).toBe(1);
  harness.syncs.length = 0;
}, 45000);

it.each(['Delete my account', 'Disconnect Muse'])('old online %s keeps A when B signs in during confirmation', async label => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const sent: { path: string; auth: string | null }[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input); sent.push({ path, auth: new Headers(init?.headers).get('Authorization') });
    return Response.json(path.includes('muse_client_ids') ? ['muse-fixture'] : path.includes('delete_my_muse_games') ? 2 : {});
  });
  const { connect } = await import('./client'); const client = connect('kingdown.auth');
  expect((await client.readSession())!.userId).toBe('alice');
  class Element {
    children: Element[] = []; textContent = ''; className = ''; type = ''; disabled = false;
    onclick?: () => Promise<void>; setAttribute() {}
    append(...nodes: Element[]) { this.children.push(...nodes); }
    querySelectorAll(): Element[] { return this.children.filter(node => node.type === 'button'); }
  }
  const target = new Element(), top = {};
  vi.stubGlobal('window', {top, self: top});
  vi.stubGlobal('location', { protocol: 'https:', origin: 'https://kingdown.test', replace: vi.fn() });
  vi.stubGlobal('document', { createElement: () => new Element(), querySelector: () => target });
  vi.stubGlobal('confirm', () => {
    // The native prompt pauses this page's callbacks. Another tab completes
    // sign-in and replaces shared storage before the player confirms A's prompt.
    store.setItem('kingdown.auth', JSON.stringify(session('later', 'bob')));
    return true;
  });
  const { installAccountControls } = await import('../online/launch'); installAccountControls(client, (await client.readSession())!, true); // The entry's session: A
  await target.children[0].querySelectorAll().find(b => b.textContent === label)!.onclick!();
  const destructive = sent.filter(s => /delete_my_account|delete_my_muse_games|oauth\/grants/.test(s.path));
  expect(destructive.map(s => s.auth)).not.toContain('Bearer ' + jwt('later'));
});
