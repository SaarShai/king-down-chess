import { afterEach, expect, it, vi } from 'vitest';
import { onlineHost, onlineOptions } from './index';
import { memoryStorage, fakeServer } from '../fake-server';
import { fixtureService } from '../../../../tools/plugin-protocol-fixture';
import { DEFAULT_OPTIONS } from '../../play/new-game';
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
function globals() {
  vi.stubGlobal('location',new URL('https://kingdown.test/next.html#online=manual-game'));
  vi.stubGlobal('history',{state:{},replaceState(){}}); vi.stubGlobal('sessionStorage',memoryStorage());
  vi.stubGlobal('navigator',{onLine:true}); vi.stubGlobal('matchMedia',()=>({matches:false}));
  vi.stubGlobal('addEventListener',()=>{}); vi.stubGlobal('removeEventListener',()=>{});
}
afterEach(()=>vi.unstubAllGlobals());
it.each(['token','retry'])('stops Ready while its command waits for %s', async stage => {
  globals(); const service=fixtureService(), saved=memoryStorage(), blocked=deferred(), release=deferred();
  let host:ReturnType<typeof onlineHost>|undefined, pause=false;
  try {
    await service.handle('alice',{handle:'alice'}); await service.handle('bob',{handle:'bob'});
    const game=await service.create('alice',{kind:'friend',options:onlineOptions('both',{...DEFAULT_OPTIONS,arrangement:'manual'})});
    await service.join('bob',(await service.invite('alice',game.game_id)).token);
    const server=fakeServer(service);
    host=onlineHost({storage:saved,fetch:server.fetch,
      auth:async()=>({onSession(){},readSession:async()=>{
        if(pause && host?.controller?.state().phase==='sending'){pause=false;blocked.resolve();await release.promise;}
        return {userId:'alice',accessToken:'alice'};
      }}) as never,
      rules:()=> 'both',setRules(){},changed(){},open(){},home(){},toast(){}});
    await host.signIn();await host.open(game.game_id,()=>{}); const old=host.controller!;
    server.calls.length=0;pause=stage==='token';
    if(stage==='retry')server.fail({kind:'network',path:/commands$/});
    const pending=old.ready();
    if(stage==='token')await blocked.promise;
    else await vi.waitFor(()=>expect(server.calls.filter(c=>c.path.endsWith('/commands'))).toHaveLength(1));
    const before=server.calls.length;host.stopGame(); release.resolve();const result=await pending;
    const commands=server.calls.slice(before).filter(c=>c.path.endsWith('/commands'));
    const ready=(await service.view('bob',game.game_id)).ready;
    console.log(JSON.stringify({case:'stop-at-'+stage,result,commands,ready}));
    expect({commands,ready}).toEqual({commands:[],ready:[false,false]});
  } finally {release.resolve();host?.stopGame();await service.close();}
});
it('keeps the first session and token refresh, then exits on account switch and sign-out',async()=>{
  globals(); const saved=memoryStorage(),home=vi.fn();let changed=(_s:any)=>{},actor:string|null='alice';
  const jwt=(id:string,n:number)=>'fixture.'+btoa(JSON.stringify({session_id:id,iat:n}))+'.signature';
  let accessToken=jwt('alice-session',1);
  const host=onlineHost({storage:saved,home,auth:async()=>({onSession(cb:typeof changed){changed=cb;cb({user:{id:actor},access_token:accessToken});},readSession:async()=>actor&&({userId:actor,accessToken})}) as never,
    fetch:async()=>Response.json({me:{handle:actor,icon:null}}),rules:()=> 'both',setRules(){},changed(){},open(){},toast(){}});
  await host.signIn();expect(home).not.toHaveBeenCalled();expect(host.signedIn).toBe(true);
  accessToken=jwt('alice-session',2);changed({user:{id:actor},access_token:accessToken});
  expect(home).not.toHaveBeenCalled();expect(host.signedIn).toBe(true);
  actor='bob';accessToken=jwt('bob-session',1);changed({user:{id:actor},access_token:accessToken});
  expect(home).toHaveBeenCalledTimes(1);expect(host.signedIn).toBe(false);
  await host.signIn();expect(host.userId).toBe('bob');actor=null;changed(null);
  expect(home).toHaveBeenCalledTimes(2);expect(host.signedIn).toBe(false);host.stopGame();
});
it('readies the same account after refresh, reload, and a second game',async()=>{
  globals();const service=fixtureService(),saved=memoryStorage(),hosts:ReturnType<typeof onlineHost>[]=[];
  let accessToken='fixture.'+btoa(JSON.stringify({session_id:'same-session',iat:1}))+'.signature',changed=(_s:any)=>{};
  try {
    await service.handle('alice',{handle:'alice'});await service.handle('bob',{handle:'bob'});
    const server=fakeServer(service);
    const fetcher=async(input:any,init:any)=>{const headers=new Headers(init?.headers);expect(headers.get('Authorization')).toBe('Bearer '+accessToken);headers.set('Authorization','Bearer alice');return server.fetch(input,{...init,headers});};
    const home=vi.fn();
    const make=()=>{const host=onlineHost({storage:saved,fetch:fetcher,home,
      auth:async()=>({onSession(cb:typeof changed){changed=cb;cb({user:{id:'alice'},access_token:accessToken});},readSession:async()=>({userId:'alice',accessToken})}) as never,
      rules:()=> 'both',setRules(){},changed(){},open(){},toast(){}});hosts.push(host);return host;};
    let host=make();await host.signIn();
    for(let i=0;i<2;i++){
      const game=await service.create('alice',{kind:'friend',options:onlineOptions('both',{...DEFAULT_OPTIONS,arrangement:'manual'})});
      await service.join('bob',(await service.invite('alice',game.game_id)).token);
      await host.open(game.game_id,()=>{});
      if(i===0){host.stopGame();host=make();await host.signIn();await host.open(game.game_id,()=>{});}
      accessToken='fixture.'+btoa(JSON.stringify({session_id:'same-session',iat:i+2}))+'.signature';changed({user:{id:'alice'},access_token:accessToken});
      expect(await host.controller!.ready()).toBe(true);expect((await service.view('bob',game.game_id)).ready).toEqual([true,false]);
    }
    expect(home).not.toHaveBeenCalled();
  } finally {for(const host of hosts)host.stopGame();await service.close();}
});
