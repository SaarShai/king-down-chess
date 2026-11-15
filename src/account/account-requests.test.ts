/** The old account screen binds sign-out to the session it shows (review of PR 361, round 5). */
import { afterEach, expect, it, vi } from 'vitest';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any, callback: false, syncs: [] as {user: string; stopped: boolean; changes: number}[] }));
vi.mock('@supabase/supabase-js', async importOriginal => {
  const actual = await importOriginal<typeof import('@supabase/supabase-js')>();
  return { ...actual, createClient: (_url: string, _key: string, options: Parameters<typeof actual.createClient>[2]) => {
    const sb = actual.createClient('https://fixture-auth.invalid', 'fixture-publishable', {
    ...options, auth: { ...options?.auth, autoRefreshToken: false, detectSessionInUrl: harness.callback }, global: { fetch: harness.fetch },
  }); harness.auth = sb.auth; return sb; } };
});
const tokenExpiry = Math.floor(Date.now() / 1000) + 3600;
const jwt = (id: string, iat = 1, exp = tokenExpiry) => 'fixture.' + btoa(JSON.stringify({ session_id: id, iat, exp })) + '.signature';
const session = (id: string, user = id, iat = 1) => ({ access_token: jwt(id, iat), refresh_token: 'fixture-refresh-' + id, token_type: 'bearer', expires_in: 3600, expires_at: Date.now() / 1000 + 3600, user: { id: user } });
function setup(store = memoryStorage()) {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co'); vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
  vi.stubGlobal('location', new URL('https://kingdown.test/next.html'));
  vi.stubGlobal('history', { state: {}, replaceState() {} });
  vi.stubGlobal('fetch', harness.fetch); vi.stubGlobal('localStorage', store); vi.stubGlobal('sessionStorage', memoryStorage());
  vi.stubGlobal('navigator', { onLine: true }); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await new Promise(r => setTimeout(r, 60)); await harness.auth?.dispose(); harness.syncs.length = 0; harness.callback = false; vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });

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


const settle = () => new Promise(r => setTimeout(r, 90));
const access = { blocked: () => false, accepts: () => true };
function responses(input: RequestInfo | URL) {
  const path = String(input);
  if (path.endsWith('/verify') || path.includes('/token')) return Response.json(session('first', 'alice'));
  return Response.json(path.includes('/rest/') ? null : { external: { github: true } });
}

it('first email sign-in reaches the old account screen and starts cloud save', async () => {
  const store = setup(); store.removeItem('kingdown.auth'); harness.auth = null;
  const ui = screen(); harness.fetch.mockImplementation(async input => responses(input));
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await ui.act('retry-signin'); await vi.waitFor(() => expect(harness.auth).not.toBeNull());
  await harness.auth.verifyOtp({ email: 'alice@example.test', token: '123456', type: 'email' });
  await settle();
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(harness.syncs.some(s => s.user === 'alice' && !s.stopped)).toBe(true);
});

it('a provider return reaches the old screen after its session save', async () => {
  const store = setup(); store.removeItem('kingdown.auth');
  store.setItem('kingdown.auth-code-verifier', JSON.stringify('fixture-verifier'));
  const returned = new URL('https://kingdown.test/index.html?code=fixture-code');
  vi.stubGlobal('location', returned);
  vi.stubGlobal('window', { location: returned, history, addEventListener() {}, removeEventListener() {} });
  harness.callback = true;
  const ui = screen(); harness.fetch.mockImplementation(async input => responses(input));
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs.some(s => s.user === 'alice' && !s.stopped)).toBe(true));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(store.getItem('kingdown.auth')).not.toBeNull();
});

it('a same-session refresh reaches the screen and keeps cloud save active', async () => {
  const store = setup(); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  const ui = screen(); harness.fetch.mockImplementation(async input => String(input).includes('/token') ? Response.json(session('first','alice',2)) : responses(input));
  const { startAccount, changed } = await import('./account'); startAccount(() => {}, access);
  await vi.waitFor(() => expect(harness.syncs).toHaveLength(1));
  await harness.auth.refreshSession(); await settle();
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  expect(harness.syncs).toHaveLength(1); expect(harness.syncs[0].stopped).toBe(false);
  changed(); expect(harness.syncs[0].changes).toBe(1);
});

it('blocked storage refuses sign-in and leaves signed-out controls', async () => {
  const memory = memoryStorage();
  const store = { ...memory, get length() { return memory.length; },
    getItem() { throw new DOMException('Storage is blocked', 'SecurityError'); },
    setItem() { throw new DOMException('Storage is blocked', 'SecurityError'); } };
  setup(memory); harness.auth = null; const ui = screen();
  harness.fetch.mockImplementation(async input => responses(input));
  const { startAccount } = await import('./account'); startAccount(() => {}, access);
  await ui.act('retry-signin'); await vi.waitFor(() => expect(harness.auth).not.toBeNull());
  await harness.auth.getSession(); vi.stubGlobal('localStorage', store);
  await expect(harness.auth.verifyOtp({ email: 'alice@example.test', token:'123456', type:'email' })).rejects.toThrow('Storage is blocked');
  await settle(); expect(ui.elements.get('account-body').innerHTML).not.toContain('data-act="sign-out"');
  expect(harness.syncs).toHaveLength(0);
});

// The Muse grant request reads its own session inside the auth library: follow-up ticket 07 (Muse is off in production).
it.each(['delete', 'muse delete'] as const)('the %s request cannot select another account after the bound read', async phase => {
  const memory = memoryStorage(); let arm = false, paused = false;
  let switching: Promise<unknown> | undefined;
  let second!: Awaited<ReturnType<typeof import('./client')['connect']>>;
  const store = { ...memory, get length() { return memory.length; }, getItem(key: string) {
    const value = memory.getItem(key);
    if (key === 'kingdown.auth' && arm) {
      arm = false; paused = true;
      switching = second.verifyEmailCode('bob@example.test', '123456');
    }
    return value;
  }};
  let tail: Promise<unknown> = Promise.resolve();
  const locks = { request<T>(_name: string, run: () => Promise<T>): Promise<T> {
    let after: Promise<unknown> | undefined;
    const result = tail.then(async () => { const value = await run(); if (paused) { paused = false; after = switching; } return value; });
    tail = result.then(() => {}, () => {});
    return result.then(async value => { if (after) await after; return value; });
  }};
  setup(store); store.setItem('kingdown.auth', JSON.stringify(session('first', 'alice')));
  vi.stubGlobal('navigator', { onLine: true, locks });
  const actions: {path: string; token: string|null}[] = [];
  harness.fetch.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/verify')) return Response.json(session('later', 'bob'));
    if (path.includes('/rpc/muse_client_ids')) { arm = true; return Response.json([]); }
    if (path.includes('/rpc/delete_my_account') || path.includes('/oauth/grants') || path.includes('/rpc/delete_my_muse_games')) actions.push({path,token:new Headers(init?.headers).get('Authorization')});
    return Response.json(path.includes('/rpc/delete_my_muse_games') ? 2 : {});
  });
  const { connect } = await import('./client'); const first = connect('kingdown.auth'), firstAuth = harness.auth;
  await first.readSession(); second = connect('kingdown.auth'); const secondAuth = harness.auth;
  await second.readSession(); const expected = (await first.readSession())!;
  try {
    arm = phase === 'delete';
    const pending = phase === 'delete' ? first.deleteAccount(expected) : first.disconnectMuse(expected);
    await pending.catch(() => {});
    expect(switching).toBeDefined(); await switching;
    expect(memory.getItem('kingdown.auth')).not.toBeNull();
    // The operation may stop, or it may use only A's captured token.
    expect(actions.filter(a => a.token === 'Bearer ' + jwt('later'))).toEqual([]);
  } finally { await firstAuth.dispose(); await secondAuth.dispose(); }
});

it.each([['delete',false],['muse',false],['delete',true],['muse',true]] as const)('normal %s works for the confirmed session (refresh %s)', async (operation,refresh) => {
  const store=setup(); store.setItem('kingdown.auth', JSON.stringify(session('first','alice')));
  const actions: string[]=[];
  harness.fetch.mockImplementation(async (input, init) => {
    const path=String(input);
    if(path.includes('/token')) return Response.json(session('first','alice',2));
    if(path.includes('/rpc/') || path.includes('/oauth/grants')) actions.push(new Headers(init?.headers).get('Authorization')!);
    if(path.includes('/rpc/muse_client_ids')) return Response.json(['fixture-muse']);
    return Response.json(path.includes('/rpc/delete_my_muse_games') ? 2 : {});
  });
  const { connect }=await import('./client'); const client=connect('kingdown.auth'); const expected=(await client.readSession())!;
  if(refresh) await harness.auth.refreshSession();
  if(operation==='delete') { await client.deleteAccount(expected); expect(store.getItem('kingdown.auth')).toBeNull(); }
  else { expect(await client.disconnectMuse(expected)).toBe(2); expect(store.getItem('kingdown.auth')).not.toBeNull(); }
  expect(actions.length).toBeGreaterThan(0); expect(actions.every(t=>t==='Bearer '+jwt('first',refresh?2:1))).toBe(true);
});


it.each(['delete','muse'] as const)('old online %s binds to the screen before a native confirmation pauses it', async operation=>{
  const store=setup(); store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
  const actions:{path:string;token:string|null}[]=[];
  harness.fetch.mockImplementation(async(input,init)=>{
    const path=String(input);
    if(path.includes('/rpc/') || path.includes('/oauth/grants')) actions.push({path,token:new Headers(init?.headers).get('Authorization')});
    return Response.json(path.includes('/rpc/muse_client_ids') ? ['fixture-muse'] : path.includes('/rpc/delete_my_muse_games') ? 2 : {});
  });
  const {connect}=await import('./client'); const client=connect('kingdown.auth');
  expect((await client.readSession())?.userId).toBe('alice');
  class Element {
    children:Element[]=[]; textContent=''; className=''; type=''; disabled=false;
    onclick?:()=>Promise<void>; setAttribute(){}
    append(...nodes:Element[]) { this.children.push(...nodes); }
    querySelectorAll() { return this.children.filter(n=>n.type==='button'); }
  }
  const target=new Element(),top={};
  vi.stubGlobal('window',{top,self:top});
  vi.stubGlobal('document',{createElement:()=>new Element(),querySelector:()=>target});
  vi.stubGlobal('location',{replace:vi.fn()});
  vi.stubGlobal('confirm',()=>{
    // Browser confirm blocks this tab. Another tab can finish sign-in while it is open.
    store.setItem('kingdown.auth',JSON.stringify(session('later','bob'))); return true;
  });
  const {installAccountControls}=await import('../online/launch'); installAccountControls(client,(await client.readSession())!,true); // The entry's session: A
  const controls=target.children[0].querySelectorAll();
  await controls[operation==='delete'?1:0].onclick!();
  expect(actions.filter(a=>a.token==='Bearer '+jwt('later'))).toEqual([]);
});
