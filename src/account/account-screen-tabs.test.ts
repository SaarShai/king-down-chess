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
  vi.stubGlobal('location', new URL('https://kingdown.test/index.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('fetch', harness.fetch); vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await harness.auth?.dispose(); harness.syncs.length = 0; vi.doUnmock('./client'); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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


function dom() {
  const handlers = new Map<string, (event?: any) => Promise<void>>();
  const elements = new Map<string, any>();
  const element = (id: string): any => {
    if (!elements.has(id)) elements.set(id, {
      innerHTML: '', textContent: '', hidden: false, returnValue: '',
      contains() { return false; }, querySelector() { return null; }, insertAdjacentHTML() {}, showModal() {},
      addEventListener(event: string, fn: (event?: any) => Promise<void>) { handlers.set(id + ':' + event, fn); },
    });
    return elements.get(id);
  };
  vi.stubGlobal('document', { getElementById: element, querySelector: () => element('entry'), addEventListener() {}, activeElement: null });
  vi.stubGlobal('addEventListener', () => {});
  return { elements, handlers, click: (act = 'sign-out') => handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act } }) } }) };
}
function deferred() { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; }
const access = { blocked: () => false, accepts: () => true };
const settle = () => new Promise(r => setTimeout(r, 30));

it('first draw captures A before the auth chunk loads; a later stored B stays', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred();
  vi.doMock('./client', async () => { await gate.promise; return vi.importActual('./client'); });
  const revoked: (string | null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) revoked.push(new Headers(init?.headers).get('Authorization'));
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  // Another tab completes sign-in while this tab still loads the auth chunk.
  store.setItem('kingdown.auth', JSON.stringify(session('later', 'bob')));
  const pending = ui.click(); gate.resolve(); await pending; await settle();
  expect(revoked).not.toContain('Bearer ' + jwt('later'));
  expect(store.getItem('kingdown.auth')).not.toBeNull();
});

it.each(['alice', 'bob'])('two clicks keep the later %s session after the first revoke waits', async laterUser => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred(), sent = deferred(); const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) { revoked.push(new Headers(init?.headers).get('Authorization')); sent.resolve(); await gate.promise; return Response.json({}); }
    if (String(input).endsWith('/verify')) return Response.json(session('later', laterUser));
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  const first = ui.click(), second = ui.click(); await sent.promise; await settle();
  await harness.auth.verifyOtp({ email: laterUser + '@example.test', token: '123456', type: 'email' }); await settle();
  gate.resolve(); await Promise.all([first, second]); await settle();
  expect(revoked).toEqual(['Bearer ' + jwt('first')]);
  expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('later'));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(ui.elements.get('account-note').textContent).not.toContain('Signed out.');
  const live = harness.syncs.at(-1)!; expect(live.stopped).toBe(false); changed(); expect(live.changes).toBe(1);
});

it('a refresh during the cloud wait removes the same session with its fresh token', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred(), sent = deferred(); let first = true;
  const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) { revoked.push(new Headers(init?.headers).get('Authorization')); return Response.json({}); }
    if (String(input).includes('/token')) return Response.json(session('first', 'alice', 2));
    if (String(input).includes('/rest/')) { if (first) { first = false; sent.resolve(); await gate.promise; } return Response.json(null); }
    return Response.json({ external: { github: true } });
  });
  const { startAccount } = await import('./account'); startAccount(() => {}, access); await sent.promise;
  const pending = ui.click(); await harness.auth.refreshSession(); await settle(); gate.resolve(); await pending; await settle();
  expect(revoked).toEqual(['Bearer ' + jwt('first', 2)]);
  expect(store.getItem('kingdown.auth')).toBeNull();
  expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
  expect(harness.syncs.every(s => s.stopped)).toBe(true);
});

it.each([false, true])('real sign-out clears the screen and stops cloud save (revoke error %s)', async fail => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom();
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) return fail ? Response.json({ message: 'failed' }, { status: 400 }) : Response.json({});
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1)); await ui.click(); await settle();
  expect(store.getItem('kingdown.auth')).toBeNull();
  expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
  expect(harness.syncs.every(s => s.stopped)).toBe(true);
});

it.each(['delete reply', 'revoke reply'])('account deletion keeps a later session after the %s', async phase => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred(), sent = deferred(); const revoked: (string|null)[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url.includes('/logout')) { revoked.push(new Headers(init?.headers).get('Authorization')); if (phase === 'revoke reply') { sent.resolve(); await gate.promise; } return Response.json({}); }
    if (url.includes('/rpc/delete_my_account')) { if (phase === 'delete reply') { sent.resolve(); await gate.promise; } return Response.json(null); }
    if (url.endsWith('/verify')) return Response.json(session('later', 'bob'));
    return Response.json(url.includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  if (typeof window === 'undefined') { const w: any = {}; w.top = w.self = w; vi.stubGlobal('window', w); }
  await ui.handlers.get('account-body:click')!({ target: { closest: () => ({ dataset: { act: 'delete' } }) } }); // The player opens the dialog first.
  ui.elements.get('delete-account').returnValue = 'delete'; const pending = ui.handlers.get('delete-account:close')!(); await sent.promise;
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' }); await settle();
  const bob = harness.syncs.find(s => s.user === 'bob')!; expect(bob.stopped).toBe(false);
  gate.resolve(); await pending; await settle();
  expect(revoked).not.toContain('Bearer ' + jwt('later'));
  expect(store.getItem('kingdown.auth')).not.toBeNull();
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(bob.stopped).toBe(false); changed(); expect(bob.changes).toBe(1);
});

it('a queued signed-out broadcast cannot stop a later session cloud save', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred(), sent = deferred();
  const channels: any[] = [], messages: (() => Promise<void>)[] = [];
  vi.stubGlobal('window', { location, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal('BroadcastChannel', class {
    callback: any; closed = false;
    constructor(public name: string) { channels.push(this); }
    addEventListener(_name: string, cb: any) { this.callback = cb; }
    postMessage(data: any) { for (const channel of channels) if (channel !== this && !channel.closed && channel.name === this.name && channel.callback) messages.push(() => channel.callback({ data })); }
    close() { this.closed = true; }
  });
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) { sent.resolve(); await gate.promise; return Response.json({}); }
    if (String(input).endsWith('/verify')) return Response.json(session('later', 'bob'));
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  const pending = ui.click(); await sent.promise; await settle();
  expect(messages.length).toBeGreaterThan(0);
  await harness.auth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' }); await settle();
  const bob = harness.syncs.find(s => s.user === 'bob')!;
  // The sign-in response task reaches the tab before the queued channel task.
  for (const message of messages.splice(0)) await message(); await settle();
  gate.resolve(); await pending; await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('bob');
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(ui.elements.get('account-note').textContent).not.toContain('Signed out.');
  expect(bob.stopped).toBe(false); changed(); expect(bob.changes).toBe(1);
});

it('Muse disconnect does not send deletion with a later account token', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const gate = deferred(), sent = deferred(); const calls: { url: string; auth: string|null }[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const url = String(input); calls.push({ url, auth: new Headers(init?.headers).get('Authorization') });
    if (url.includes('/rpc/muse_client_ids')) { sent.resolve(); await gate.promise; return Response.json(['fixture-muse']); }
    if (url.endsWith('/verify')) return Response.json(session('later', 'bob'));
    if (url.includes('/rpc/delete_my_muse_games')) return Response.json(2);
    return Response.json({});
  });
  const { connect } = await import('./client'); const client = connect('kingdown.auth'); await client.readSession();
  const pending = client.disconnectMuse(); await sent.promise;
  await client.verifyEmailCode('bob@example.test', '123456'); gate.resolve();
  await expect(pending).rejects.toThrow('The account changed');
  expect(calls.filter(c => c.url.includes('/grants') || c.url.includes('/rpc/delete_my_muse_games')).map(c => c.auth)).not.toContain('Bearer ' + jwt('later'));
});

it('normal channel delivery keeps a pending email sign-in that completes during sign-out', async () => {
  const store = setup(); store.removeItem('kingdown.auth'); harness.auth = null;
  const ui = dom(), revokeGate = deferred(), revokeSent = deferred(), verifyGate = deferred(), verifySent = deferred();
  vi.stubGlobal('window', { location, addEventListener() {}, removeEventListener() {} });
  harness.fetch.mockImplementation(async (input, init) => {
    if (String(input).includes('/logout')) { revokeSent.resolve(); await revokeGate.promise; return Response.json({}); }
    if (String(input).endsWith('/verify')) {
      if (JSON.parse(String(init?.body)).email === 'bob@example.test') { verifySent.resolve(); await verifyGate.promise; return Response.json(session('later', 'bob')); }
      return Response.json(session('first', 'alice'));
    }
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await ui.click('retry-signin'); await vi.waitFor(() => expect(harness.auth).not.toBeNull()); await settle();
  const firstAuth = harness.auth;
  // The player submits B's email code in this tab. Its network reply waits.
  const verifying = firstAuth.verifyOtp({ email: 'bob@example.test', token: '123456', type: 'email' }); await verifySent.promise;
  // A provider sign-in finishes in another tab. The real channel updates this screen to A.
  const { connect } = await import('./client'); const other = connect('kingdown.auth'), otherAuth = harness.auth; harness.auth = firstAuth;
  await other.verifyEmailCode('alice@example.test', '123456');
  await vi.waitFor(() => expect(harness.syncs.some(s => s.user === 'alice')).toBe(true));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  const pending = ui.click(); await revokeSent.promise;
  // B's already-running email request completes before this tab receives A's sign-out message.
  verifyGate.resolve(); await verifying; await settle();
  revokeGate.resolve(); await pending; await settle(); await otherAuth.dispose();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('bob');
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(ui.elements.get('account-note').textContent).not.toContain('Signed out.');
  const bob = harness.syncs.find(s => s.user === 'bob')!;
  expect(bob.stopped).toBe(false); changed(); expect(bob.changes).toBe(1);
});

it.each(['alice', 'bob'])('late revoke error keeps the later %s screen and cloud save', async user => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = dom(), gate = deferred(), sent = deferred();
  harness.fetch.mockImplementation(async input => {
    if (String(input).includes('/logout')) { sent.resolve(); await gate.promise; return Response.json({ message: 'failed' }, { status: 400 }); }
    if (String(input).endsWith('/verify')) return Response.json(session('later', user));
    return Response.json(String(input).includes('/rest/') ? null : { external: { github: true } });
  });
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  const pending = ui.click(); await sent.promise; await settle();
  await harness.auth.verifyOtp({ email: user + '@example.test', token: '123456', type: 'email' }); await settle();
  gate.resolve(); await pending; await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('later'));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  const live = harness.syncs.at(-1)!; expect(live.stopped).toBe(false); changed(); expect(live.changes).toBe(1);
});

it('mixed bad and valid closed entries allow new sign-in and keep the valid closure', async () => {
  const store = setup(); const { authStorage } = await import('./auth-storage');
  store.setItem('auth-closed-sessions', JSON.stringify([null, 1, 'bad', {}, { session: 'old', expires: Date.now() + 10000 }]));
  const adapter = authStorage('auth', store);
  await adapter.storage.setItem('auth', JSON.stringify({ user: { id: 'alice' }, access_token: 'old' })); expect(store.getItem('auth')).toBeNull();
  await adapter.storage.setItem('auth', JSON.stringify({ user: { id: 'alice' }, access_token: 'fresh' })); expect(store.getItem('auth')).not.toBeNull();
  await adapter.remove({ userId: 'alice', accessToken: 'fresh' }, () => {});
  expect(JSON.parse(store.getItem('auth-closed-sessions')!).map((s: any) => s.session)).toEqual(['old', 'fresh']);
});
