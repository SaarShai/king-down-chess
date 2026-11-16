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
vi.mock('@capacitor/core', () => ({ registerPlugin: () => ({authorize: async ({state}: {state:string}) => ({identityToken:'fixture-apple',state})}) }));
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


const settle=()=>new Promise(r=>setTimeout(r,80));
async function api(input: RequestInfo | URL) {
 const path=String(input);
 return Response.json(path.includes('/games') ? {games:[],invitations:[]} : path.includes('/record') ? {history:[]} : {me:{handle:'fixture-player',icon:null}});
}
function page(client:ReturnType<typeof connect>) {
 return onlineHost({storage:memoryStorage(),auth:async()=>client,fetch:api,rules:()=> 'pieces',setRules(){},changed(){},open(){},home(){},toast(){}});
}

it('accepts native Apple sign-in on the app page and its later refresh', async()=>{
 const store=setup();store.removeItem('kingdown.auth');
 vi.stubGlobal('location',new URL('capacitor://localhost/next.html'));
 vi.stubEnv('VITE_KINGDOWN_APPLE_SIGN_IN','1');vi.resetModules();
 const replies: string[]=[];
 harness.fetch.mockImplementation(async input=>{
  replies.push(String(input));return Response.json(session('apple','alice',replies.length));
 });
 const {connect: appConnect}=await import('./client');const {onlineHost: appHost}=await import('../interface/people/host');
 const client=appConnect('kingdown.auth',{manualCallback:true,apple:true}), events:unknown[]=[];
 client.onSession(s=>events.push(s));
 const host=appHost({storage:store,auth:async()=>client,fetch:api,rules:()=> 'pieces',setRules(){},changed(){},open(){},home(){},toast(){}});
 await host.init();await host.host.start('apple');await settle();
 expect(replies.some(p=>p.includes('grant_type=id_token'))).toBe(true);
 expect(host.userId).toBe('alice');expect(host.user).not.toBeNull();expect(host.host.me()).not.toBeNull();
 expect(events.some((s:any)=>s?.user.id==='alice')).toBe(true);
 const previous=events.length;
 await harness.auth.refreshSession();await settle();
 expect(events.length).toBeGreaterThan(previous);expect(host.userId).toBe('alice');expect(host.host.me()).not.toBeNull();
});

it('accepts a provider return on the new host and its session event', async()=>{
 const store=setup();store.removeItem('kingdown.auth');
 harness.fetch.mockImplementation(async()=>Response.json(session('provider','alice')));
 const client=connect('kingdown.auth',{manualCallback:true});const host=page(client),events:unknown[]=[];
 client.onSession(s=>events.push(s));
 await host.init();
 const {flowId}=await client.startAccountSignIn('github',{entryPath:'/next.html'});
 await client.finishAccountSignIn('fixture-code',flowId);await host.signIn();await settle();
 expect(events.some((s:any)=>s?.user.id==='alice')).toBe(true);
 expect(host.user).not.toBeNull();expect(host.userId).toBe('alice');expect(host.host.me()).not.toBeNull();
});

it.each(['delete','muse'] as const)('%s refreshes an expired token before sending the bound request',async action=>{
 const store=setup();store.setItem('kingdown.auth',JSON.stringify(session('first','alice')));
 const sent:{path:string;token:string|null}[]=[];
 harness.fetch.mockImplementation(async(input,init)=>{
  const path=String(input);sent.push({path,token:new Headers(init?.headers).get('Authorization')});
  return Response.json(path.includes('/token')?session('first','alice',2):path.includes('muse_client_ids')?['fixture-muse']:path.includes('delete_my_muse_games')?2:{});
 });
 const client=connect('kingdown.auth'),expected=(await client.readSession())!;
 const expiry=Math.floor(Date.now()/1000)-60;
 store.setItem('kingdown.auth',JSON.stringify({...session('first','alice'),expires_at:expiry,access_token:jwt('first',1,expiry)}));
 if(action==='delete')await client.deleteAccount(expected);else expect(await client.disconnectMuse(expected)).toBe(2);
 expect(sent.some(s=>s.path.includes('/token'))).toBe(true);
 const requests=sent.filter(s=>s.path.includes('/rpc/')||s.path.includes('/oauth/grants'));
 expect(requests.length).toBeGreaterThan(0);expect(requests.every(s=>s.token==='Bearer '+jwt('first',2))).toBe(true);
});
