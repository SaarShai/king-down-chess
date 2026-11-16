import { afterEach, expect, it, vi } from 'vitest';
import { connect } from './client';
import { onlineHost } from '../interface/people/host';
import { memoryStorage } from '../interface/people/fake-server';

const harness = vi.hoisted(() => ({ fetch: vi.fn<typeof fetch>(), auth: null as any }));
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
  vi.stubGlobal('caches',{keys:async()=>[],delete:async()=>true});
  vi.stubGlobal('document',{visibilityState:'visible',addEventListener(){},removeEventListener(){}});
  store.setItem('fixture-auth', JSON.stringify(session('alice')));
  return store;
}
afterEach(async () => { await new Promise(r=>setTimeout(r,80)); await harness.auth?.dispose(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });


function latch() { let release!:()=>void; const promise=new Promise<void>(r=>{release=r;}); return {promise,release}; }
const settle=()=>new Promise(r=>setTimeout(r,80));
async function api(input: RequestInfo | URL) {
 const path=String(input);
 return Response.json(path.includes('/games') ? {games:[],invitations:[]} : path.includes('/record') ? {history:[]} : {me:{handle:'fixture-player',icon:null}});
}
function page(client:ReturnType<typeof connect>) {
 return onlineHost({storage:memoryStorage(),auth:async()=>client,fetch:api,rules:()=> 'pieces',setRules(){},changed(){},open(){},home(){},toast(){}});
}

it.each(['alice','bob'])('the new page keeps the later %s session after an old sign-out reply',async laterUser=>{
 const store=setup(); store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
 const sent=latch(),release=latch();
 harness.fetch.mockImplementation(async input=>{
  const path=String(input);
  if(path.includes('/logout')) {sent.release();await release.promise;return Response.json({});}
  if(path.endsWith('/verify')) return Response.json(session('later',laterUser));
  return Response.json({});
 });
 const client=connect('kingdown.auth'); const host=page(client);
 await host.signIn(); await settle(); expect(host.signedIn).toBe(true);
 const pending=host.signOut(); await sent.promise; await settle();
 expect(host.signedIn).toBe(false);
 // The signed-out screen can start a new email sign-in while A's revoke waits.
 await host.host.verifyCode(laterUser+'@example.test','123456'); await settle();
 expect(host.userId).toBe(laterUser); expect(host.host.me()).not.toBeNull();
 release.release(); await pending; await settle();
 expect(JSON.parse(store.getItem('kingdown.auth')!).access_token).toBe(jwt('later'));
 expect(host.userId).toBe(laterUser); expect(host.host.me()).not.toBeNull();
});

it('the new page refuses a queued sign-out event after the later session is active',async()=>{
 const store=setup();store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
 const channels:any[]=[],messages:(()=>Promise<void>)[]=[];
 vi.stubGlobal('window',{location,addEventListener(){},removeEventListener(){}});
 vi.stubGlobal('BroadcastChannel',class {
  callback:any;closed=false;
  constructor(public name:string){channels.push(this);}
  addEventListener(_name:string,callback:any){this.callback=callback;}
  postMessage(data:any){for(const channel of channels) if(channel!==this&&!channel.closed&&channel.name===this.name&&channel.callback)messages.push(()=>channel.callback({data}));}
  close(){this.closed=true;}
 });
 harness.fetch.mockImplementation(async input=>Response.json(String(input).endsWith('/verify')?session('later','bob'):{}));
 const client=connect('kingdown.auth'),firstAuth=harness.auth; const host=page(client);
 await host.signIn(); await settle();
 const other=connect('kingdown.auth'),otherAuth=harness.auth; await other.readSession();
 try {
  await other.signOutSession((await client.readSession())!); await settle();
  // The old sign-out channel task stays queued while B's email reply completes.
  await host.host.verifyCode('bob@example.test','123456'); await settle();
  expect(host.userId).toBe('bob'); expect(host.host.me()).not.toBeNull();
  expect(messages.length).toBeGreaterThan(0);
  for(const message of messages.splice(0))await message(); await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('bob');
  expect(host.userId).toBe('bob'); expect(host.host.me()).not.toBeNull();
 }finally {await firstAuth.dispose();await otherAuth.dispose();}
});


it('normal channel delivery keeps a pending new-page email sign-in during another tab sign-out',async()=>{
 const store=setup();store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
 vi.stubGlobal('window',{location,addEventListener(){},removeEventListener(){}});
 const verifySent=latch(),verifyRelease=latch(),logoutSent=latch(),logoutRelease=latch();
 harness.fetch.mockImplementation(async input=>{
  const path=String(input);
  if(path.endsWith('/verify')) {verifySent.release();await verifyRelease.promise;return Response.json(session('later','bob'));}
  if(path.includes('/logout')) {verifyRelease.release();logoutSent.release();await logoutRelease.promise;return Response.json({});}
  return Response.json({});
 });
 const client=connect('kingdown.auth'),firstAuth=harness.auth; const host=page(client);
 await host.signIn();await settle();
 expect(firstAuth.broadcastChannel).toBeTruthy();
 const other=connect('kingdown.auth'),otherAuth=harness.auth;const opening=(await other.readSession())!;
 try {
  // A request can stay active after another tab's account event removes its form.
  const verifying=host.host.verifyCode('bob@example.test','123456');await verifySent.promise;
  const removing=other.signOutSession(opening);await logoutSent.promise;
  await verifying;await settle();logoutRelease.release();await removing;await settle();
  expect(JSON.parse(store.getItem('kingdown.auth')!).user.id).toBe('bob');
  expect(host.userId).toBe('bob');expect(host.host.me()).not.toBeNull();
 } finally {verifyRelease.release();logoutRelease.release();await firstAuth.dispose();await otherAuth.dispose();}
});
