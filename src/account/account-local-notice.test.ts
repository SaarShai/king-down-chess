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


it.each(['alice','bob'])('local sign-out notice keeps a later cross-tab %s session', async laterUser=>{
 const memory=memoryStorage();let arm=false,inside=false,held=false;
 const read=latch(),deliver=latch(),sent=latch(),release=latch();
 const store={...memory,get length(){return memory.length;},
  getItem(key:string){const value=memory.getItem(key);if(inside&&arm&&key==='kingdown.auth'&&value===null)held=true;return value;},
  removeItem(key:string){memory.removeItem(key);if(key==='kingdown.auth')arm=true;}
 };
 let tail:Promise<unknown>=Promise.resolve();
 const locks=(delayed:boolean)=>({request<T>(name:string,run:()=>Promise<T>):Promise<T>{
  if(name!=='lock:kingdown.auth')return run();
  let pause=false;
  const result=tail.then(()=>{inside=delayed;try{const value=run();if(held){held=false;pause=true;}return value;}finally{inside=false;}});
  tail=result.then(()=>{},()=>{});
  // Both tabs release the shared lock. Only the first tab delays receipt of its result.
  return result.then(async value=>{if(pause){read.release();await deliver.promise;}return value;});
 }});
 setup(store);vi.stubGlobal('navigator',{onLine:true,locks:locks(true)});
 vi.stubGlobal('window',{location,addEventListener(){},removeEventListener(){}});
 store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
 const ui=screen();
 harness.fetch.mockImplementation(async input=>{
  const path=String(input);
  if(path.includes('/logout')){sent.release();await release.promise;return Response.json({});}
  return Response.json(path.endsWith('/verify')?session('later',laterUser):path.includes('/rest/')?null:{});
 });
 const {startAccount,changed}=await import('./account');startAccount(()=>{},{blocked:()=>false,accepts:()=>true});
 await vi.waitFor(()=>expect(harness.syncs.length).toBe(1));const firstAuth=harness.auth;
 const {connect}=await import('./client');
 vi.stubGlobal('navigator',{onLine:true,locks:locks(false)});
 const other=connect('kingdown.auth'),otherAuth=harness.auth;await other.readSession();
 vi.stubGlobal('navigator',{onLine:true,locks:locks(true)});
 const pending=ui.click();
 try {
  await Promise.all([read.promise,sent.promise]);await new Promise(r=>setTimeout(r,80));
  await other.verifyEmailCode(laterUser+'@example.test','123456');
  await vi.waitFor(()=>expect(harness.syncs.some(s=>s.user===laterUser&&!s.stopped)).toBe(true));
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  deliver.release();await new Promise(r=>setTimeout(r,80));release.release();await pending;await new Promise(r=>setTimeout(r,80));
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe(laterUser);
  expect(ui.elements.get('account-body').innerHTML).toContain('data-act="sign-out"');
  const active=harness.syncs.at(-1)!;expect(active.stopped).toBe(false);changed();expect(active.changes).toBe(1);
 }finally{deliver.release();release.release();await pending;await firstAuth.dispose();await otherAuth.dispose();}
});
