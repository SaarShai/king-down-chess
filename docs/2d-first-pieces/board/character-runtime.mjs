// Ready character bodies. The scene keeps its travel, contact callbacks and separate effects.
export const FACINGS = ['N','NE','E','SE','S','SW','W','NW'];
export function facingOf(dx,dy) { return FACINGS[(Math.round(Math.atan2(dx,-dy)/(Math.PI/4))+8)%8]; }
export function frameAt(bank,time) {
 const frames=bank.frames,t=Math.max(0,Math.min(time,bank.durationMs));
 if(frames.some(f=>f.visibleIntervalMs))return frames.findLast(f=>f.visibleIntervalMs?.[0]<=t&&t<=f.visibleIntervalMs[1])??frames.at(-1);
 if(bank.nearest&&bank.kind!=='attack')return frames[Math.round(t/bank.durationMs*(frames.length-1))];
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
const connected=()=>globalThis.navigator?.onLine!==false;
function bounded(promise,ms=LOAD_TIMEOUT,signal){
 return new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(value);},abort=()=>finish(null),timer=setTimeout(abort,Math.max(0,ms));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();Promise.resolve(promise).then(finish,()=>finish(null));});
}
export function createCharacterRuntime({url=new URL('/character-runtime/manifest.json',import.meta.url).href,wake=()=>{},fetcher=fetch,image=()=>Object.assign(new Image(),{crossOrigin:'anonymous'})}={}) {
 let banks=[],disposed=false,bytes=0,peakBytes=0,active=0,activeFrame=null, idlePins=new Set(),idleGeneration=0,idleLoads=null;
 let effectEntries={},currentEffect=null,effectBytes=0,smokeBytes=0,smokeClass=null,smokeImage=null,smokeLoading=null,smokeBlocked=false;
 const images=new Map(),loading=new Map(),failed=new Map(),stills=new Set(),pins=new Map(),queue=[],activeJobs=new Set(),effectRetryAt=new Map(),effectLoads=new Map();
 function reserve(frames){const keys=[...new Set(frames.map(f=>f.url))];for(const key of keys)pins.set(key,(pins.get(key)??0)+1);let held=true;return ()=>{if(!held)return;held=false;for(const key of keys){const n=pins.get(key);if(n>1)pins.set(key,n-1);else pins.delete(key);}trim();};}
 let manifestReady=false,manifestLoading=null,manifestRetryAt=0;
 // Optional art never asks the network while the browser reports no connection: offline play keeps the plain figure.
 const reconnect=()=>{if(disposed)return;failed.clear();manifestRetryAt=0;effectRetryAt.clear();void loadManifest().then(()=>{if(!disposed)wake();});};
 const listening=typeof globalThis.addEventListener==='function';
 if(listening)globalThis.addEventListener('online',reconnect);
 function loadManifest(){
  if(disposed||manifestReady||!connected()||performance.now()<manifestRetryAt)return Promise.resolve();
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
  while(bytes>limit&&images.size){const keys=[...images.keys()].filter(key=>!idlePins.has(key)&&!pins.has(key)),key=keys.find(key=>key!==activeFrame&&!stills.has(key))??keys.find(key=>key!==activeFrame)??keys[0];if(!key)break;bytes-=images.get(key).size;images.delete(key);}
  peakBytes=Math.max(peakBytes,bytes+effectBytes+smokeBytes);
 }
 let pumping=false;
 function pump(){
  if(pumping)return;pumping=true;
  if(!connected())while(queue.length){const job=queue.shift();loading.delete(job.frame.url);job.resolve();}
  while(queue.some(job=>job.priority)&&active>=6){const victim=[...activeJobs].find(job=>!job.priority);if(!victim)break;victim.cancel();}
  while(active<6&&queue.length&&!disposed&&connected()){
   const job=queue.shift(),{frame}=job,art=image();active++;
   let done=false;const timer=setTimeout(()=>finish(false),IMAGE_TIMEOUT);
   function finish(ok,cancelled=false){
    if(done)return;done=true;clearTimeout(timer);art.onload=art.onerror=null;active--;activeJobs.delete(job);loading.delete(frame.url);
    if(!ok){art.removeAttribute?.('src');if(!disposed&&!cancelled)failed.set(frame.url,performance.now()+RETRY_DELAY);}else failed.delete(frame.url);job.resolve();pump();
   }
   job.cancel=()=>finish(false,true);activeJobs.add(job);
   art.onload=async()=>{
    try{await art.decode?.();if(done||disposed)return finish(false);
     const size=(art.naturalWidth||art.width)*(art.naturalHeight||art.height)*4;
     images.set(frame.url,{art,size});bytes+=size;trim();finish(true);
    }catch{finish(false);}
   };
   art.onerror=()=>finish(false);art.src=new URL(frame.url,url).href;
  }
  pumping=false;
 }
 function requestFrame(frame,optional=false,priority=false,prefetch=null){
  if(disposed||!connected()||images.has(frame.url)||performance.now()<(failed.get(frame.url)??0))return {promise:Promise.resolve()};
  let job=loading.get(frame.url);
  if(!job){job={frame,shared:!optional,owners:0,priority:0,prefetch};job.promise=new Promise(resolve=>{job.resolve=resolve;});loading.set(frame.url,job);queue.push(job);}
  else if(!prefetch)job.prefetch=null;
  if(optional)job.owners++;else job.shared=true;
  if(priority){job.priority++;const index=queue.indexOf(job);if(index!==-1){queue.splice(index,1);queue.unshift(job);}}
  pump();return {promise:job.promise,job};
 }
 const loadFrame=(frame,prefetch)=>requestFrame(frame,false,false,prefetch).promise;
 function loadPreparation(frames,priority=true){
  const jobs=[];let released=false;
  const promises=[...new Map(frames.map(frame=>[frame.url,frame])).values()].map(frame=>{const {promise,job}=requestFrame(frame,true,priority);if(job)jobs.push(job);return promise;});
  return {promise:Promise.all(promises),release(){
   if(released)return;released=true;
   for(const job of jobs){job.owners--;if(priority)job.priority--;}
   for(const job of jobs)if(!job.owners&&!job.shared&&!job.cancel){const index=queue.indexOf(job);if(index!==-1){queue.splice(index,1);loading.delete(job.frame.url);job.resolve();}}
   for(const job of jobs)if(!job.owners&&!job.shared)job.cancel?.();
  }};
 }
 async function prepareFrames(frames,ms,signal){
  const loads=loadPreparation(frames);
  await bounded(loads.promise,ms,signal);loads.release();
 }
 const endpoints=bank=>[bank.frames[0],bank.frames.at(-1)];
 async function loadSeparate(character){
  const entry=effectEntries[character];if(!connected()||!entry||performance.now()<(effectRetryAt.get(character)??0))return null;
  if(currentEffect?.character!==character){
   let selected=effectLoads.get(character);
   if(selected){effectLoads.delete(character);effectLoads.set(character,selected);currentEffect=selected;}
   else{
    selected={character,size:entry.decodedBytes,pending:true,promise:null};currentEffect=selected;trim(selected.size);
    if(bytes+effectBytes+smokeBytes+selected.size>DECODED_BUDGET){currentEffect=null;return null;}
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
  if(!connected())return;
  if(!smokeLoading)smokeLoading=(async()=>{try{const mod=await import(/* @vite-ignore */ new URL(entry.smoke,url).href);const stream=new mod.ArrowSmoke();await stream.image.decode();if(!disposed){trim(entry.smokeDecodedBytes);if(bytes+effectBytes+smokeBytes+entry.smokeDecodedBytes<=DECODED_BUDGET){smokeClass=mod.ArrowSmoke;smokeImage=stream.image;smokeBytes=entry.smokeDecodedBytes;trim();wake();}else smokeBlocked=true;}}catch{}})();
  await smokeLoading;
 }
 async function warm(character,army,full=false){
  await bounded(loadManifest());const bank=idle(character,army);if(!bank)return;
  if(character==='archer')void loadSmoke();
  stills.add(bank.frames[0].url);const starts=full?forPiece(character,army).filter(b=>b.kind==='idle').flatMap(b=>b.frames.slice(0,6)):bank.frames.slice(0,1);await Promise.all(starts.map(frame=>loadFrame(frame)));if(!disposed)wake();
 }
 function sample(bank,time,prefetch=true,reverse=false,pin=false,directFrame=null){
  if(!bank)return null;const wanted=directFrame??frameAt(bank,time),index=bank.frames.indexOf(wanted);
  const nearby=prefetch?bank.frames.slice(Math.max(0,index-(reverse?4:1)),index+(reverse?2:5)):[wanted];
  if(prefetch&&bank.kind==='idle')for(const job of [...queue])if(job.prefetch===bank&&!nearby.some(frame=>frame.url===job.frame.url)){queue.splice(queue.indexOf(job),1);loading.delete(job.frame.url);job.resolve();}
  for(const frame of nearby)if(!images.has(frame.url)&&!loading.get(frame.url)?.shared&&(loading.has(frame.url)||queue.length<6)&&performance.now()>=(failed.get(frame.url)??0))void loadFrame(frame,prefetch&&bank.kind==='idle'?bank:null).then(()=>{if(!disposed)wake();});
  const frame=images.has(wanted.url)?wanted:reverse?bank.frames.slice(index).find(frame=>images.has(frame.url)):bank.frames.slice(0,index+1).findLast(frame=>images.has(frame.url));
  const entry=frame&&images.get(frame.url);if(!entry)return null;if(pin)activeFrame=frame.url;images.delete(frame.url);images.set(frame.url,entry);
  const size=bank.kind==='attack'?[entry.art.naturalWidth,entry.art.naturalHeight]:bank.canvasSize,offset=bank.canvasSize.map((n,i)=>(n-size[i])/2);
  return {url:frame.url,image:entry.art,pivot:bank.pivot.map((n,i)=>n-offset[i]),scale:bank.boardScale??(HEIGHT[bank.character]??130)/bank.registrationHeightPx,bank:bank.id,sourceSha256:frame.sourceSha256,sourceBankSha256:bank.sourceSha256,time:frame.timeMs,canvasSize:size,unitHeight:bank.registrationHeightPx,effectAnchor:frame.effectAnchor??anchorAt(bank,'arrowhead-smoke',frame.timeMs)??anchorAt(bank,'arrow',frame.timeMs)};
 }
 function routeSample(route,time){for(const part of route){if(time<=part.bank.durationMs)return sample(part.bank,part.reverse?part.bank.durationMs-time:time,true,part.reverse,true);time-=part.bank.durationMs;}const last=route.at(-1);return last?sample(last.bank,last.reverse?0:last.bank.durationMs,true,last.reverse,true):null;}
 return {
  ready:()=>bounded(loadManifest()).then(()=>{}),
  has:(character,army)=>{if(!manifestReady)void loadManifest();return !!idle(character,army);},
  get stats(){return {bytes:bytes+effectBytes+smokeBytes,peakBytes,framesLoaded:images.size,active,queued:queue.length,manifestReady,manifestLoading:!!manifestLoading};},
  smoke(){return smokeClass&&smokeImage?new smokeClass(smokeImage):null;},
  warm,
  async reserveIdle(character,army){
   idleLoads?.release();idleLoads=null;const generation=++idleGeneration;await bounded(loadManifest());if(disposed||generation!==idleGeneration)return false;
   const rest=idle(character,army),all=forPiece(character,army).filter(b=>b.kind==='idle');
   if(!rest||!all.length||all.some(b=>b.facing!==rest.facing||b.frames[0].url!==rest.frames[0].url||b.frames.at(-1).url!==rest.frames[0].url))return false;
   if(forPiece(character,army).some(b=>b.kind==='turn'&&((b.from===rest.facing&&b.frames[0].url!==rest.frames[0].url)||(b.to===rest.facing&&b.frames.at(-1).url!==rest.frames[0].url))))return false;
   const frames=[...new Map(all.flatMap(b=>b.frames).map(f=>[f.url,f])).values()];
   const loads=loadPreparation(frames,false);idleLoads=loads;
   await bounded(loads.promise);
   if(disposed||generation!==idleGeneration||frames.some(f=>!images.has(f.url)))return false;
   const size=frames.reduce((n,f)=>n+images.get(f.url).size,0);
   if(size+effectBytes+smokeBytes>DECODED_BUDGET)return false;
   idlePins=new Set(frames.map(f=>f.url));trim();return true;
  },
  releaseIdle(){idleGeneration++;idleLoads?.release();idleLoads=null;idlePins.clear();trim();if(smokeBlocked&&!disposed){smokeBlocked=false;smokeLoading=null;void loadSmoke();}},
  idleExit(character,army,body){
   const bank=forPiece(character,army).find(b=>b.id===body.bank&&b.kind==='idle'),rest=idle(character,army);
   if(!bank||!rest||!idlePins.has(body.url)||!idlePins.has(rest.frames[0].url))return null;
   let path=null;
   for(let i=0;i<bank.frames.length;i++)if(bank.frames[i].url===body.url)
    for(let j=0;j<bank.frames.length;j++)if(bank.frames[j].url===rest.frames[0].url&&(!path||Math.abs(i-j)<Math.abs(path[0]-path[1])))path=[i,j];
   if(!path)return null;
   return t=>sample(bank,0,false,false,false,bank.frames[Math.round(path[0]+(path[1]-path[0])*Math.min(1,Math.max(0,t)))]);
  },
  rest(character,army,time=0,active=false){const bank=idle(character,army);if(!bank)return null;if(active){const all=forPiece(character,army),choice=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time);if(choice){const next=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time+160);if(next&&next.bank!==choice.bank)for(const frame of next.bank.frames.slice(0,6))void loadFrame(frame);return sample(choice.bank,choice.time,true,choice.reverse,true)??sample(bank,0,false);}}return sample(bank,0,false);},
  async prepare(character,army,direction,capture,oneSquare=false,signal){
   const deadline=performance.now()+LOAD_TIMEOUT,remaining=()=>Math.max(0,deadline-performance.now());
   await bounded(loadManifest(),remaining(),signal);if(disposed||signal?.aborted||!remaining())return null;
   const all=forPiece(character,army),rest=idle(character,army);if(!rest)return null;
   const attack=capture?all.find(b=>b.kind==='attack'&&b.facing===direction):null;
   let movement=!capture&&oneSquare?all.find(b=>b.kind==='movement'&&b.facing===direction&&b.durationMs>0&&b.frames?.length):null;
   const movementRequested=!!movement;
   const turns=all.filter(b=>b.kind==='turn'),before=turnRoute(turns,rest.facing,direction),after=before&&reverseRoute(before);
   // A missing edge keeps the rest body coherent instead of jumping to an unsupported facing.
   if(before===null)return null;
   const routeFrames=character.startsWith('king-')&&capture?p=>p.bank.frames:p=>endpoints(p.bank);
   const start=[rest.frames[0],...before.flatMap(routeFrames),...after.flatMap(routeFrames),...(attack?attack.frames.slice(0,4):[])];
   await prepareFrames(start,remaining(),signal);
   if(disposed||signal?.aborted||!remaining()||start.some(frame=>!images.has(frame.url)))return null;
   const sizes=new Map(start.map(frame=>[frame.url,images.get(frame.url).size]));
   let releaseMovementStart=null,releaseMovement=null,releaseFallback=character.startsWith('king-')&&capture?reserve(start):null;
   if(movement){
    releaseFallback=reserve(start);
    await prepareFrames(movement.frames,remaining(),signal);
    if(disposed||signal?.aborted){releaseFallback();return null;}
    if(!remaining()||movement.frames.some(frame=>!images.has(frame.url)))movement=null;
    else {releaseMovementStart=reserve([movement.frames[0]]);releaseMovement=reserve([movement.frames.at(-1)]);}
   }
   const effect=attack?await bounded(loadSeparate(character),remaining(),signal):null;
   if(disposed||signal?.aborted||!remaining()&&!movementRequested||attack&&effectEntries[character]&&!effect){releaseMovementStart?.();releaseMovement?.();releaseFallback?.();return null;}
   if(start.some(frame=>!images.has(frame.url))){
    const missing=[...sizes].reduce((sum,[key,size])=>sum+(images.has(key)?0:size),0);
    for(const cached of effectLoads.values()){
     if(bytes+effectBytes+smokeBytes+missing<=DECODED_BUDGET)break;
     if(!cached.pending&&cached!==currentEffect){effectLoads.delete(cached.character);effectBytes-=cached.size;}
    }
    await prepareFrames(start,remaining(),signal);
    if(disposed||signal?.aborted||!remaining()||start.some(frame=>!images.has(frame.url))){releaseMovementStart?.();releaseMovement?.();releaseFallback?.();return null;}
   }
   if(movement&&movement.frames.some(frame=>!images.has(frame.url))){movement=null;releaseMovementStart?.();releaseMovement?.();releaseMovementStart=null;releaseMovement=null;}
   return {rest,attack,movement,effect,before,after,releaseMovementStart,releaseMovement,releaseFallback,beforeMs:before.reduce((n,p)=>n+p.bank.durationMs,0),afterMs:after.reduce((n,p)=>n+p.bank.durationMs,0)};
  },
  action(prepared,time,duration,contact,boundary){
   if(time<0)return routeSample(prepared.before,time+prepared.beforeMs)??sample(prepared.rest,0,false);
   if(time>duration)return routeSample(prepared.after,time-duration)??sample(prepared.rest,0,false);
   const attack=prepared.attack;
   if(attack){return sample(attack,Math.min(time,attack.durationMs),true,false,true)??sample(prepared.rest,0,false);}
   if(prepared.movement){const frames=prepared.movement.frames,frame=boundary==='start'?frames[0]:boundary==='end'?frames.at(-1):null;const body=sample(prepared.movement,duration>0?time/duration*prepared.movement.durationMs:0,true,false,true,frame);if(body)return body;}
   return routeSample(prepared.before,prepared.beforeMs)??sample(prepared.rest,0,false);
  },
  dispose(){disposed=true;if(listening)globalThis.removeEventListener('online',reconnect);banks=[];restChoices.clear();images.clear();idlePins.clear();pins.clear();activeFrame=null;bytes=0;effectBytes=0;smokeBytes=0;currentEffect=null;effectLoads.clear();smokeClass=null;smokeImage=null;for(const job of activeJobs)job.cancel();for(const job of queue)job.resolve();queue.length=0;loading.clear();},
 };
}
