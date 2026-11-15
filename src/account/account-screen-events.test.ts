/** The old account screen binds sign-out to the session it shows (review of PR 361, round 5). */
import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any, syncs: [] as {user: string; stopped: boolean; changes: number}[] }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => {
    const sb = actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: harness.fetch },
  }); harness.auth = sb.auth; return sb; } };
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
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); await harness.auth?.dispose(); harness.syncs.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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
    closeDelete: () => { element('delete-account').returnValue = 'delete'; return handlers.get('delete-account:close')!({}); } };
}
function latch() { let release!: () => void; const promise = new Promise<void>(r => { release = r; }); return { promise, release }; }

it.each(['alice', 'bob'])('cold screen keeps later %s before the first auth event', async laterUser => {
  const store = setup();
  const first = { ...session('first', 'alice'), user: { id: 'alice', user_metadata: { name: 'Alice' } } };
  store.setItem('kingdown.auth', JSON.stringify(first));
  const ui = screen(), moduleReady = latch(), moduleRelease = latch();
  const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) revoked.push(new Headers(init?.headers).get('Authorization'));
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  vi.doMock('./client', async importOriginal => {
    const actual = await importOriginal<typeof import('./client')>();
    moduleReady.release(); await moduleRelease.promise; return actual;
  });
  try {
    const { startAccount } = await import('./account');
    startAccount(() => {}, { blocked: () => false, accepts: () => true });
    await moduleReady.promise;
    expect(ui.elements.get('account-body').innerHTML).toContain('Alice');
    // The other tab completes sign-in while this page still loads its auth module.
    store.setItem('kingdown.auth', JSON.stringify(session('later', laterUser)));
    const pending = ui.click();
    moduleRelease.release(); await pending;
    expect(revoked).not.toContain('Bearer ' + jwt('later'));
    expect(store.getItem('kingdown.auth')).not.toBeNull();
  } finally { moduleRelease.release(); vi.doUnmock('./client'); }
});

it.each([['alice', false], ['bob', false], ['alice', true], ['bob', true]] as const)('late reply keeps the new session for %s (error: %s)', async (laterUser, fail) => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(), started = latch(), release = latch();
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) { started.release(); await release.promise; return fail ? Response.json({message: 'logout failed'}, {status: 400}) : Response.json({}); }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  const { startAccount, changed } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await vi.waitFor(() => expect(harness.syncs.length).toBe(1));
  const pending = ui.click(); await started.promise;
  await harness.auth.verifyOtp({ email: laterUser + '@example.test', token: '123456', type: 'email' });
  await vi.waitFor(() => expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"'));
  release.release(); await pending;
  expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('later'));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(ui.elements.get('account-note').textContent).not.toContain('Signed out');
  const active = harness.syncs.at(-1)!; expect(active.stopped).toBe(false);
  changed(); expect(active.changes).toBe(1);
});

it('a double click revokes the shown session once and leaves signed-out controls', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(), started = latch(), release = latch(); let revoked = 0;
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) { revoked++; started.release(); await release.promise; return Response.json({}); }
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await vi.waitFor(() => expect(harness.syncs.length).toBe(1));
  const one = ui.click(), two = ui.click(); await started.promise; release.release();
  await Promise.all([one, two]);
  await new Promise(r => setTimeout(r, 30));
  expect(revoked).toBe(1); expect(store.getItem('kingdown.auth')).toBeNull();
  expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
});

it('a same-ID refresh during flush removes the shown session and uses its current token', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(), started = latch(), release = latch(); let first = true;
  const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) { revoked.push(new Headers(init?.headers).get('Authorization')); return Response.json({}); }
    if (String(input).includes('/token')) return Response.json(session('first', 'alice', 2));
    if (String(input).includes('/rest/') && first) { first = false; started.release(); await release.promise; }
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await started.promise; const pending = ui.click();
  await harness.auth.refreshSession();
  await vi.waitFor(() => expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('first', 2)));
  release.release(); await pending; await new Promise(r => setTimeout(r, 30));
  expect(revoked).toEqual(['Bearer ' + jwt('first', 2)]);
  expect(store.getItem('kingdown.auth')).toBeNull();
  expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
});

it('an old tab stays signed out after a refused refresh save', async () => {
  const memory = memoryStorage(); let arm = false, snapshot = false;
  let signedOut: Promise<boolean> | undefined; let remove!: () => Promise<boolean>;
  const store = { ...memory, get length() { return memory.length; }, getItem(key: string) {
    const value = memory.getItem(key);
    if (key === 'kingdown.auth' && arm) { arm = false; snapshot = true; signedOut = remove(); }
    return value;
  } };
  let tail: Promise<unknown> = Promise.resolve();
  const locks = { request<T>(_name: string, run: () => Promise<T>): Promise<T> {
    let after: Promise<boolean> | undefined;
    const result = tail.then(async () => { const value = await run(); if (snapshot) { snapshot = false; after = signedOut; } return value; });
    tail = result.then(() => {}, () => {});
    return result.then(async value => {
      if (after) {
        await after;
        await vi.waitFor(() => expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"'));
      }
      return value;
    });
  } };
  setup(store); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  vi.stubGlobal('navigator', { onLine: true, locks });
  const windowFixture: any = { addEventListener() {}, removeEventListener() {} };
  windowFixture.top = windowFixture; windowFixture.self = windowFixture;
  vi.stubGlobal('window', windowFixture);
  const ui = screen();
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/token')) { arm = true; return Response.json(session('first', 'alice', 2)); }
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await vi.waitFor(() => expect(harness.syncs.length).toBe(1));
  const firstAuth = harness.auth;
  const { connect } = await import('./client');
  const second = connect('kingdown.auth'); const secondAuth = harness.auth;
  try {
    const expected = (await second.readSession())!;
    remove = () => second.signOutSession(expected);
    await firstAuth.refreshSession();
    expect(signedOut).toBeDefined(); expect(await signedOut).toBe(true);
    await new Promise(r => setTimeout(r, 60));
    expect(memory.getItem('kingdown.auth')).toBeNull();
    expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
  } finally { await firstAuth.dispose(); await secondAuth.dispose(); }
});

it.each(['alice', 'bob'])('a deletion reply keeps a later session for %s', async laterUser => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(), started = latch(), release = latch();
  const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/rpc/delete_my_account')) { started.release(); await release.promise; return Response.json(null); }
    if (String(input).includes('/logout')) { revoked.push(new Headers(init?.headers).get('Authorization')); return Response.json({}); }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    return Response.json(String(input).includes('/rest/') ? null : {});
  });
  const { startAccount } = await import('./account');
  startAccount(() => {}, { blocked: () => false, accepts: () => true });
  await vi.waitFor(() => expect(harness.syncs.length).toBe(1));
  const pending = ui.closeDelete(); await started.promise;
  await harness.auth.verifyOtp({ email: laterUser + '@example.test', token: '123456', type: 'email' });
  await vi.waitFor(() => expect(harness.syncs.some(s => s.user === laterUser && !s.stopped)).toBe(true));
  release.release(); await pending;
  expect(revoked).not.toContain('Bearer ' + jwt('later'));
  expect(store.getItem('kingdown.auth')).not.toBeNull();
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
});
