// Ready character bodies. The scene keeps its travel, contact callbacks and separate effects.
export const FACINGS = ['N','NE','E','SE','S','SW','W','NW'];
export function facingOf(dx,dy) { return FACINGS[(Math.round(Math.atan2(dx,-dy)/(Math.PI/4))+8)%8]; }
export function frameAt(bank,time) {
 const frames=bank.frames,t=Math.max(0,Math.min(time,bank.durationMs));
 if(frames.some(f=>f.visibleIntervalMs))return frames.findLast(f=>f.visibleIntervalMs?.[0]<=t&&t<=f.visibleIntervalMs[1])??frames.at(-1);
 if(bank.nearest)return frames[Math.round(t/bank.durationMs*(frames.length-1))];
 return frames.findLast(f=>f.timeMs<=t)??frames[0];
}
export function turnRoute(banks,from,to) {
 if(from===to)return [];
 const queue=[{facing:from,route:[]}],seen=new Set([from]);
 for(const item of queue)for(const bank of banks){
  const reverse=bank.to===item.facing,next=reverse?bank.from:bank.from===item.facing?bank.to:null;
  if(!next||seen.has(next))continue;
  const route=[...item.route,{bank,reverse}];if(next===to)return route;
  seen.add(next);queue.push({facing:next,route});
 }
 return null;
}
/** An authored point follows the same baked facing, pivot and uniform scale as its body. */
export function bankPointToWorld(body,foot,point,scale=1) {
 const k=body.scale*scale;
 return {x:foot.x+(point[0]-body.pivot[0])*k,y:foot.y+(point[1]-body.pivot[1])*k};
}
export function anchorAt(bank,id,time) {
 const points=(bank?.effectAnchors??[]).filter(a=>a.id===id).sort((a,b)=>a.timeMs-b.timeMs);
 if(!points.length)return null;
 const before=points.findLast(a=>a.timeMs<=time)??points[0],after=points.find(a=>a.timeMs>=time)??points.at(-1);
 const k=before.timeMs===after.timeMs?0:(time-before.timeMs)/(after.timeMs-before.timeMs);
 return before.point.map((v,i)=>v+(after.point[i]-v)*k);
}
export const reverseRoute=route=>route.slice().reverse().map(part=>({bank:part.bank,reverse:!part.reverse}));
export function idleBankAt(clips,turns,restFacing,time) {
 const sequence=[];
 for(const bank of clips){const before=turnRoute(turns,restFacing,bank.facing);if(before===null)continue;sequence.push(...before.map(p=>({...p,durationMs:p.bank.durationMs})),{bank,reverse:false,durationMs:bank.durationMs},...reverseRoute(before).map(p=>({...p,durationMs:p.bank.durationMs})));}
 const duration=sequence.reduce((n,p)=>n+p.durationMs,0);if(!duration)return null;
 let t=((time%duration)+duration)%duration;
 for(const part of sequence){if(t<part.durationMs)return {bank:part.bank,time:part.reverse?part.durationMs-t:t,reverse:part.reverse};t-=part.durationMs;}
 return null;
}
const HEIGHT={pawn:96,knight:112,bishop:114,rook:132,queen:120,archer:120,paladin:124,maester:112,ogre:136,guard:114};
export const DECODED_BUDGET=64*1024*1024;
// Bound the wait for optional art so a stalled request cannot hold up a move indefinitely.
const LOAD_TIMEOUT=1000,IMAGE_TIMEOUT=5000,RETRY_DELAY=5000;
function bounded(promise,ms=LOAD_TIMEOUT){
 return new Promise(resolve=>{const timer=setTimeout(()=>resolve(null),Math.max(0,ms));Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},()=>{clearTimeout(timer);resolve(null);});});
}
export function createCharacterRuntime({url=new URL('/character-runtime/manifest.json',import.meta.url).href,wake=()=>{},fetcher=fetch,image=()=>Object.assign(new Image(),{crossOrigin:'anonymous'})}={}) {
 let banks=[],disposed=false,bytes=0,peakBytes=0,active=0,activeFrame=null;
 let effectEntries={},currentEffect=null,effectBytes=0,smokeBytes=0,smokeClass=null,smokeImage=null,smokeLoading=null;
 const images=new Map(),loading=new Map(),failed=new Map(),stills=new Set(),queue=[],activeJobs=new Set(),effectRetryAt=new Map(),effectLoads=new Map();
 let manifestReady=false,manifestLoading=null,manifestRetryAt=0;
 function loadManifest(){
  if(disposed||manifestReady||performance.now()<manifestRetryAt)return Promise.resolve();
  if(!manifestLoading)manifestLoading=Promise.resolve().then(()=>fetcher(url)).then(r=>{if(!r.ok)throw Error('Character package unavailable');return r.json();}).then(m=>{
   if(m?.schemaVersion!==1||!Array.isArray(m.banks))throw Error('Invalid character package');
   if(!disposed){banks=m.banks;effectEntries=m.effects??{};restChoices.clear();manifestReady=true;wake();}
  }).catch(()=>{manifestRetryAt=performance.now()+RETRY_DELAY;}).finally(()=>{manifestLoading=null;});
  return manifestLoading;
 }
 const forPiece=(character,army)=>banks.filter(b=>b.character===character&&b.army===army);
 const restChoices=new Map();
 const idle=(character,army)=>{
  const key=`${character}:${army}`;if(restChoices.has(key))return restChoices.get(key);
  const all=forPiece(character,army);let rest=all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0];
  if(!rest){const turn=all.find(b=>b.kind==='turn'&&(b.from==='SE'||b.to==='SE'))??all.find(b=>b.kind==='turn');if(turn){const last=turn.to==='SE';rest={...turn,id:`${turn.id}:rest`,kind:'still',frames:[last?turn.frames.at(-1):turn.frames[0]],facing:last?turn.to:turn.from};}}
  if(rest)restChoices.set(key,rest);return rest;
 };
 function trim(reserve=0){
  while(effectBytes+smokeBytes+reserve>DECODED_BUDGET){
   const victim=[...effectLoads.values()].find(effect=>!effect.pending&&effect!==currentEffect);if(!victim)break;
   effectLoads.delete(victim.character);effectBytes-=victim.size;
  }
  if(effectBytes+smokeBytes+reserve>DECODED_BUDGET)return;
  const limit=Math.max(0,DECODED_BUDGET-effectBytes-smokeBytes-reserve);
  while(bytes>limit&&images.size){const keys=[...images.keys()],key=keys.find(key=>key!==activeFrame&&!stills.has(key))??keys.find(key=>key!==activeFrame)??keys[0];bytes-=images.get(key).size;images.delete(key);}
  peakBytes=Math.max(peakBytes,bytes+effectBytes+smokeBytes);
 }
 function pump(){
  while(active<6&&queue.length&&!disposed){
   const job=queue.shift(),{frame}=job,art=image();active++;
   let done=false;const timer=setTimeout(()=>finish(false),IMAGE_TIMEOUT);
   function finish(ok){
    if(done)return;done=true;clearTimeout(timer);art.onload=art.onerror=null;active--;activeJobs.delete(job);loading.delete(frame.url);
    if(!ok){art.removeAttribute?.('src');if(!disposed)failed.set(frame.url,performance.now()+RETRY_DELAY);}else failed.delete(frame.url);job.resolve();pump();
   }
   job.cancel=()=>finish(false);activeJobs.add(job);
   art.onload=async()=>{
    try{await art.decode?.();if(done||disposed)return finish(false);
     const size=(art.naturalWidth||art.width)*(art.naturalHeight||art.height)*4;
     images.set(frame.url,{art,size});bytes+=size;trim();finish(true);
    }catch{finish(false);}
   };
   art.onerror=()=>finish(false);art.src=new URL(frame.url,url).href;
  }
 }
 function loadFrame(frame){
  if(disposed||images.has(frame.url)||performance.now()<(failed.get(frame.url)??0))return Promise.resolve();
  if(!loading.has(frame.url)){loading.set(frame.url,new Promise(resolve=>queue.push({frame,resolve})));pump();}
  return loading.get(frame.url)??Promise.resolve();
 }
 const endpoints=bank=>[bank.frames[0],bank.frames.at(-1)];
 async function loadSeparate(character){
  const entry=effectEntries[character];if(!entry||performance.now()<(effectRetryAt.get(character)??0))return null;
  if(currentEffect?.character!==character){
   let selected=effectLoads.get(character);
   if(selected){effectLoads.delete(character);effectLoads.set(character,selected);currentEffect=selected;}
   else{
    selected={character,size:entry.decodedBytes,pending:true,promise:null};currentEffect=selected;trim(selected.size);
    if(effectBytes+smokeBytes+selected.size>DECODED_BUDGET){currentEffect=null;return null;}
    effectLoads.set(character,selected);effectBytes+=selected.size;trim();
    selected.promise=(async()=>{try{const moduleURL=new URL(entry.module,url).href,mod=await import(/* @vite-ignore */ moduleURL);return {player:await mod.loadEffect(moduleURL),contactMs:entry.contactMs};}catch{return null;}})().then(effect=>{
     if(disposed)return null;
     selected.pending=false;
     if(!effect){effectLoads.delete(character);effectBytes-=selected.size;if(currentEffect===selected)currentEffect=null;effectRetryAt.set(character,performance.now()+RETRY_DELAY);}
     else trim();
     return effect;
    });
   }
  }
  return currentEffect.promise;
 }
 async function loadSmoke(){
  const entry=effectEntries.archer;if(!entry?.smoke)return;
  if(!smokeLoading)smokeLoading=(async()=>{try{const mod=await import(/* @vite-ignore */ new URL(entry.smoke,url).href);const stream=new mod.ArrowSmoke();await stream.image.decode();if(!disposed){smokeClass=mod.ArrowSmoke;smokeImage=stream.image;smokeBytes=entry.smokeDecodedBytes;trim();wake();}}catch{}})();
  await smokeLoading;
 }
 async function warm(character,army,full=false){
  await bounded(loadManifest());const bank=idle(character,army);if(!bank)return;
  if(character==='archer')void loadSmoke();
  stills.add(bank.frames[0].url);const starts=full?forPiece(character,army).filter(b=>b.kind==='idle').flatMap(b=>b.frames.slice(0,6)):bank.frames.slice(0,1);await Promise.all(starts.map(loadFrame));if(!disposed)wake();
 }
 function sample(bank,time,prefetch=true,reverse=false,pin=false){
  if(!bank)return null;const wanted=frameAt(bank,time),index=bank.frames.indexOf(wanted);
  const nearby=prefetch?bank.frames.slice(Math.max(0,index-(reverse?4:1)),index+(reverse?2:5)):[wanted];
  for(const frame of nearby)if(!images.has(frame.url)&&!loading.has(frame.url)&&performance.now()>=(failed.get(frame.url)??0))void loadFrame(frame).then(()=>{if(!disposed)wake();});
  const frame=images.has(wanted.url)?wanted:reverse?bank.frames.slice(index).find(frame=>images.has(frame.url)):bank.frames.slice(0,index+1).findLast(frame=>images.has(frame.url));
  const entry=frame&&images.get(frame.url);if(!entry)return null;if(pin)activeFrame=frame.url;images.delete(frame.url);images.set(frame.url,entry);
  return {image:entry.art,pivot:bank.pivot,scale:bank.boardScale??(HEIGHT[bank.character]??130)/bank.registrationHeightPx,bank:bank.id,sourceSha256:frame.sourceSha256,sourceBankSha256:bank.sourceSha256,time:frame.timeMs,canvasSize:bank.canvasSize,unitHeight:bank.registrationHeightPx,effectAnchor:frame.effectAnchor??anchorAt(bank,'arrowhead-smoke',frame.timeMs)??anchorAt(bank,'arrow',frame.timeMs)};
 }
 function routeSample(route,time){for(const part of route){if(time<=part.bank.durationMs)return sample(part.bank,part.reverse?part.bank.durationMs-time:time,true,part.reverse,true);time-=part.bank.durationMs;}const last=route.at(-1);return last?sample(last.bank,last.reverse?0:last.bank.durationMs,true,last.reverse,true):null;}
 return {
  ready:()=>bounded(loadManifest()).then(()=>{}),
  has:(character,army)=>{if(!manifestReady)void loadManifest();return !!idle(character,army);},
  get stats(){return {bytes:bytes+effectBytes+smokeBytes,peakBytes,active,queued:queue.length};},
  smoke(){return smokeClass&&smokeImage?new smokeClass(smokeImage):null;},
  warm,
  rest(character,army,time=0,active=false){const bank=idle(character,army);if(!bank)return null;if(active){const all=forPiece(character,army),choice=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time);if(choice){const next=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time+160);if(next&&next.bank!==choice.bank)for(const frame of next.bank.frames.slice(0,6))void loadFrame(frame);return sample(choice.bank,choice.time,true,choice.reverse,true)??sample(bank,0,false);}}return sample(bank,0,false);},
  async prepare(character,army,direction,capture){
   const deadline=performance.now()+LOAD_TIMEOUT,remaining=()=>Math.max(0,deadline-performance.now());
   await bounded(loadManifest(),remaining());if(disposed||!remaining())return null;
   const all=forPiece(character,army),rest=idle(character,army);if(!rest)return null;
   const attack=capture?all.find(b=>b.kind==='attack'&&b.facing===direction):null;
   const turns=all.filter(b=>b.kind==='turn'),before=turnRoute(turns,rest.facing,direction),after=before&&reverseRoute(before);
   // A missing edge keeps the rest body coherent instead of jumping to an unsupported facing.
   if(before===null)return null;
   const start=[rest.frames[0],...before.flatMap(p=>endpoints(p.bank)),...after.flatMap(p=>endpoints(p.bank)),...(attack?attack.frames.slice(0,6):[])];
   await bounded(Promise.all(start.map(loadFrame)),remaining());
   if(disposed||!remaining()||start.some(frame=>!images.has(frame.url)))return null;
   const sizes=new Map(start.map(frame=>[frame.url,images.get(frame.url).size]));
   const effect=attack?await bounded(loadSeparate(character),remaining()):null;
   if(disposed||!remaining()||attack&&effectEntries[character]&&!effect)return null;
   if(start.some(frame=>!images.has(frame.url))){
    const missing=[...sizes].reduce((sum,[key,size])=>sum+(images.has(key)?0:size),0);
    for(const cached of effectLoads.values()){
     if(bytes+effectBytes+smokeBytes+missing<=DECODED_BUDGET)break;
     if(!cached.pending&&cached!==currentEffect){effectLoads.delete(cached.character);effectBytes-=cached.size;}
    }
    await bounded(Promise.all(start.map(loadFrame)),remaining());
    if(disposed||!remaining()||start.some(frame=>!images.has(frame.url)))return null;
   }
   return {rest,attack,effect,before,after,beforeMs:before.reduce((n,p)=>n+p.bank.durationMs,0),afterMs:after.reduce((n,p)=>n+p.bank.durationMs,0)};
  },
  action(prepared,time,duration,contact){
   if(time<0)return routeSample(prepared.before,time+prepared.beforeMs)??sample(prepared.rest,0,false);
   if(time>duration)return routeSample(prepared.after,time-duration)??sample(prepared.rest,0,false);
   const attack=prepared.attack;
   if(attack){return sample(attack,Math.min(time,attack.durationMs),true,false,true)??sample(prepared.rest,0,false);}
   return routeSample(prepared.before,prepared.beforeMs)??sample(prepared.rest,0,false);
  },
  dispose(){disposed=true;banks=[];restChoices.clear();images.clear();activeFrame=null;bytes=0;effectBytes=0;smokeBytes=0;currentEffect=null;effectLoads.clear();smokeClass=null;smokeImage=null;for(const job of activeJobs)job.cancel();for(const job of queue)job.resolve();queue.length=0;loading.clear();},
 };
}
