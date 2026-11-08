// Ready character bodies. The scene keeps its travel, contact callbacks and separate effects.
export const FACINGS = ['N','NE','E','SE','S','SW','W','NW'];
export function facingOf(dx,dy) { return FACINGS[(Math.round(Math.atan2(dx,-dy)/(Math.PI/4))+8)%8]; }
export function frameAt(bank,time) {
 const frames=bank.frames,t=Math.max(0,Math.min(time,bank.durationMs));
 if(frames.some(f=>f.visibleIntervalMs))return frames.findLast(f=>f.visibleIntervalMs?.[0]<=t&&t<=f.visibleIntervalMs[1])??frames.at(-1);
 if(bank.nearest&&bank.kind!=='attack'&&bank.kind!=='move')return frames[Math.round(t/bank.durationMs*(frames.length-1))];
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
const jumps=character=>character==='knight'||character==='paladin';
const unique=frames=>{const seen=new Set();return frames.filter(f=>!seen.has(f.url)&&seen.add(f.url));};
/** A jump streams. first: its frames up to the crouch key and its landing; it starts once they are decoded. needed:
 * first and every second frame, or every third when that is too large for half the decoded budget (a Paladin), and so
 * on. latest(f): the jump clock time by which a needed frame must be decoded on a link limited by bandwidth, so the
 * needed pose before it holds at most POSE_HOLD ms past its slot. window(i): the frames that stay requested and decoded
 * while the playhead is at frame i: the needed frames not passed, then the next frames up to a quarter of the decoded
 * budget. */
function leapPlan(bank) {
 const frames=bank.frames,last=frames.at(-1),first=unique([...frames.slice(0,4),last]),each=bank.canvasSize[0]*bank.canvasSize[1]*4;
 let needed=first;
 for(let stride=2;stride<frames.length;stride++){needed=unique([...first,...frames.filter((_,k)=>k%stride===0)]);if(needed.length*each<=DECODED_BUDGET/2)break;}
 const order=needed.map(f=>frames.indexOf(f)).sort((a,b)=>a-b),latest=new Map(order.map((k,j)=>[frames[k].url,j?frames[order[j-1]+1].timeMs+POSE_HOLD:frames[k].timeMs]));
 const ahead=Math.max(4,Math.floor(DECODED_BUDGET/4/each));
 const window=i=>unique([...needed.filter(f=>f.url===last.url||frames.indexOf(f)>=i),...frames.slice(i,i+ahead+1)]);
 return {first,needed,window,latest:f=>latest.get(f.url)};
}
const HEIGHT={pawn:82,knight:129,bishop:125,rook:132,queen:132,archer:120,paladin:124,maester:84,ogre:116,guard:108,beast:104};
// The figure heights at which the catalog's strideSquares and contactCorrection were measured. The owner's
// final sizes changed the figures, not those numbers; tools/anim/stride still measures at these heights.
const MEASURED_HEIGHT={pawn:96,knight:112,bishop:114,queen:120,maester:112,ogre:136,guard:114,beast:130};
/** Board px per bank px of a body bank; figureHeight: how tall a character stands on the board. */
export const bankScale=bank=>bank.boardScale??(HEIGHT[bank.character]??130)/bank.registrationHeightPx;
export const figureHeight=character=>HEIGHT[character]??130;
/** A number that was measured in board px on the figure, at the figure's size today. */
export const measuredScale=character=>figureHeight(character)/(MEASURED_HEIGHT[character]??figureHeight(character));
/** Squares per walk cycle at the figure's size today: a smaller figure's painted step covers less floor. */
export const walkStride=bank=>bank.strideSquares*measuredScale(bank.character);
/** The bank a figure rests in, from one character's banks in one army: an idle (facing SE first), or a turn's end. */
export function restBankOf(all) {
 let rest=all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0];
 if(!rest){const turn=all.find(b=>b.kind==='turn'&&(b.from==='SE'||b.to==='SE'))??all.find(b=>b.kind==='turn');if(turn){const last=turn.to==='SE';rest={...turn,id:`${turn.id}:rest`,kind:'still',frames:[last?turn.frames.at(-1):turn.frames[0]],facing:last?turn.to:turn.from};}}
 return rest??null;
}
export const DECODED_BUDGET=64*1024*1024;
// Bound the wait for optional art so a stalled request cannot hold up a move indefinitely.
const LOAD_TIMEOUT=1000,IMAGE_TIMEOUT=5000,RETRY_DELAY=5000,LEAP_HOLD=200,POSE_HOLD=150,LEAP_LATE=500,FAST_FRAME=20;
const connected=()=>globalThis.navigator?.onLine!==false;
function bounded(promise,ms=LOAD_TIMEOUT,signal){
 return new Promise(resolve=>{let done=false;const finish=value=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);resolve(value);},abort=()=>finish(null),timer=setTimeout(abort,Math.max(0,ms));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();Promise.resolve(promise).then(finish,()=>finish(null));});
}
export function createCharacterRuntime({url=new URL('/character-runtime/manifest.json',import.meta.url).href,wake=()=>{},fetcher=fetch,image=()=>Object.assign(new Image(),{crossOrigin:'anonymous'}),drawnEffects=[]}={}) {
 let banks=[],disposed=false,bytes=0,peakBytes=0,active=0,activeFrame=null, idlePins=new Set(),idleGeneration=0,idleLoads=null,moveGeneration=0,moveLoads=null,movePins=null,movePrefetchActive=false;
 let effectEntries={},currentEffect=null,effectBytes=0,smokeBytes=0,smokeClass=null,smokeImage=null,smokeLoading=null,smokeBlocked=false;
 const images=new Map(),loading=new Map(),failed=new Map(),stills=new Set(),pins=new Map(),queue=[],activeJobs=new Set(),effectRetryAt=new Map(),effectLoads=new Map();
 // The link as frames arrive (leapWait): latency, the time from a request to its decoded frame; interval, the time
 // between two decoded frames while all six slots are busy; full, the last such frame.
 const link={latency:null,interval:null,full:null,rtt:null,each:null};
 function measure(job,full){
  const now=performance.now(),took=now-job.began;link.latency=link.latency==null?took:link.latency*.7+took*.3;
  if(full&&link.full!=null){const gap=now-link.full;link.interval=link.interval==null?gap:link.interval*.7+gap*.3;}
  link.full=full?now:null;
 }
 // Six loads at once share a slow link: each takes six times as long, so the frame due first comes late. The browser's
 // resource timing of the last eight frames gives the round trip (request to first byte) and the time the link takes
 // for one frame: the time in which bytes arrive (the union of their transfers) over the number of frames. slots():
 // enough loads to keep the link busy over a round trip, 2 to 6. A link that takes less than FAST_FRAME ms for a
 // frame (20 kB in 20 ms is 8 Mbps) is not limited by bandwidth and keeps six.
 const hrefs=new Set(),flows=[];let observer=null;
 try{observer=new PerformanceObserver(list=>{for(const e of list.getEntries()){
  if(!hrefs.has(e.name))continue;hrefs.delete(e.name);
  if(!(e.requestStart>0&&e.responseStart>=e.requestStart&&e.responseEnd>=e.responseStart&&e.transferSize>0))continue;
  const rtt=e.responseStart-e.requestStart;link.rtt=link.rtt==null?rtt:link.rtt*.7+rtt*.3;
  flows.push([e.responseStart,e.responseEnd]);if(flows.length>8)flows.shift();
  let busy=0,end=-Infinity;for(const [a,b] of [...flows].sort((x,y)=>x[0]-y[0])){busy+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}
  link.each=busy/flows.length;
 }});observer.observe({type:'resource'});}catch{observer=null;}
 const slots=()=>link.rtt==null||!(link.each>=FAST_FRAME)?6:Math.max(2,Math.min(6,Math.ceil(link.rtt/link.each)+1));
 // On such a link, loads that start together share it to the end and end together, and the link stands idle for the
 // next round trip: a load starts at least half a frame time after the one before it, so their ends stay apart.
 let lastStart=-Infinity,paceTimer=null;
 // A load that the runtime stopped while the browser kept its transfer finishes early when it is asked for again; its
 // time is not the link's.
 const stopped=new Set();
 function reserve(frames){const keys=[...new Set(frames.map(f=>f.url))];for(const key of keys)pins.set(key,(pins.get(key)??0)+1);let held=true;return ()=>{if(!held)return;held=false;for(const key of keys){const n=pins.get(key);if(n>1)pins.set(key,n-1);else pins.delete(key);}trim();};}
 let manifestReady=false,manifestLoading=null,manifestRetryAt=0,footprints=null,footprintsLoading=null;
 // Optional art never asks the network while the browser reports no connection: offline play keeps the plain figure.
 const reconnect=()=>{if(disposed)return;failed.clear();manifestRetryAt=0;effectRetryAt.clear();void loadManifest().then(()=>{if(!disposed)wake();});if(manifestReady)loadFootprints();};
 const listening=typeof globalThis.addEventListener==='function';
 if(listening)globalThis.addEventListener('online',reconnect);
 // The soft pool's table (tools/build-character-footprints.mjs) comes with the manifest and never holds it up: without
 // it, a figure has its still sprite's pool.
 function loadFootprints(){
  if(footprints||footprintsLoading||disposed||!connected())return;
  footprintsLoading=Promise.resolve().then(()=>fetcher(new URL('footprints.json',url).href)).then(r=>r.ok?r.json():null).then(t=>{if(!disposed&&t?.schemaVersion===1&&t.frames&&t.keyLength>0){footprints=t;wake();}}).catch(()=>{}).finally(()=>{footprintsLoading=null;});
 }
 function loadManifest(){
  if(disposed||manifestReady||!connected()||performance.now()<manifestRetryAt)return Promise.resolve();
  if(!manifestLoading)manifestLoading=Promise.resolve().then(()=>fetcher(url)).then(r=>{if(!r.ok)throw Error('Character package unavailable');return r.json();}).then(m=>{
   if(m?.schemaVersion!==1||!Array.isArray(m.banks))throw Error('Invalid character package');
   if(!disposed){banks=m.banks;effectEntries=m.effects??{};restChoices.clear();manifestReady=true;loadFootprints();wake();}
  }).catch(()=>{manifestRetryAt=performance.now()+RETRY_DELAY;}).finally(()=>{manifestLoading=null;});
  return manifestLoading;
 }
 const forPiece=(character,army)=>banks.filter(b=>b.character===character&&b.army===army);
 const restChoices=new Map();
 const idle=(character,army)=>{
  const key=`${character}:${army}`;if(restChoices.has(key))return restChoices.get(key);
  const rest=restBankOf(forPiece(character,army));
  if(rest)restChoices.set(key,rest);return rest;
 };
 // A frame's row in the table: [span, cx, cy, tilt × 100, air] in bank px, or its character's standing row, or null.
 const footprintOf=(frame,bank)=>{
  if(!footprints)return null;const row=footprints.frames[frame.sourceSha256?.slice(0,footprints.keyLength)];if(row)return row;
  const rest=idle(bank.character,bank.army);return rest?footprints.frames[rest.frames[0].sourceSha256?.slice(0,footprints.keyLength)]??null:null;
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
 let pumping=false,suspendPump=0;
 function pump(){
  if(pumping||suspendPump)return;pumping=true;
  if(!connected())while(queue.length){const job=queue.shift();loading.delete(job.frame.url);job.resolve();}
  if(queue.some(job=>job.priority===2)||[...activeJobs].some(job=>job.priority===2))for(const job of [...activeJobs])if(job.priority<2)job.cancel();
  while(queue.some(job=>job.priority)&&active>=slots()){const priority=Math.max(...queue.map(job=>job.priority));const victim=[...activeJobs].find(job=>job.priority<priority);if(!victim)break;victim.cancel();}
  while(active<slots()&&queue.length&&!disposed&&connected()){
   if(movePrefetchActive&&!queue[0].priority)break;
   if([...activeJobs].some(job=>job.priority>queue[0].priority))break;
   const wait=slots()<6?lastStart+link.each/2-performance.now():0;
   if(wait>0){if(!paceTimer)paceTimer=setTimeout(()=>{paceTimer=null;pump();},wait);break;}
   const job=queue.shift(),{frame}=job,art=image();active++;job.began=lastStart=performance.now();
   let done=false;const timer=setTimeout(()=>finish(false),IMAGE_TIMEOUT);
   function finish(ok,cancelled=false){
    if(done)return;done=true;clearTimeout(timer);art.onload=art.onerror=null;if(ok&&!stopped.delete(frame.url))measure(job,active>=slots());if(cancelled)stopped.add(frame.url);active--;activeJobs.delete(job);loading.delete(frame.url);
    if(!ok){art.removeAttribute?.('src');if(!disposed&&!cancelled)failed.set(frame.url,performance.now()+RETRY_DELAY);}else failed.delete(frame.url);job.resolve();pump();
   }
   job.cancel=()=>finish(false,true);activeJobs.add(job);
   art.onload=async()=>{
    try{await art.decode?.();if(done||disposed)return finish(false);
     const size=(art.naturalWidth||art.width)*(art.naturalHeight||art.height)*4;
     images.set(frame.url,{art,size});bytes+=size;trim();finish(true);
    }catch{finish(false);}
   };
   art.onerror=()=>finish(false);const href=new URL(frame.url,url).href;if(observer)hrefs.add(href);art.src=href;
  }
  pumping=false;
 }
 function requestFrame(frame,optional=false,priority=false,prefetch=null,behind=false){
  if(disposed||!connected()||images.has(frame.url)||performance.now()<(failed.get(frame.url)??0))return {promise:Promise.resolve()};
  let job=loading.get(frame.url);
  if(!job){job={frame,shared:!optional,owners:0,priority:0,priorityCounts:[0,0,0],prefetch};job.promise=new Promise(resolve=>{job.resolve=resolve;});loading.set(frame.url,job);queue.push(job);}
  else if(!prefetch)job.prefetch=null;
  if(optional)job.owners++;else job.shared=true;
  if(priority){job.priorityCounts[priority]++;job.priority=job.priorityCounts[2]?2:1;const index=queue.indexOf(job);if(index!==-1){queue.splice(index,1);const next=queue.findIndex(item=>priority===1||suspendPump||behind?item.priority<job.priority:item.priority<=job.priority);queue.splice(next<0?queue.length:next,0,job);}}
  pump();return {promise:job.promise,job};
 }
 const loadFrame=(frame,prefetch)=>requestFrame(frame,false,false,prefetch).promise;
 // behind: the frames queue behind the loads of their priority, not before them. release(keep): loads in progress
 // run on, so a new request can take them over.
 function loadPreparation(frames,priority=2,behind=false){
  const jobs=[];let released=false;
  const promises=[...new Map(frames.map(frame=>[frame.url,frame])).values()].map(frame=>{const {promise,job}=requestFrame(frame,true,priority,null,behind);if(job)jobs.push(job);return promise;});
  return {promise:Promise.all(promises),release(keep=false){
   if(released)return;released=true;
   for(const job of jobs){job.owners--;if(priority){job.priorityCounts[priority]--;job.priority=job.priorityCounts[2]?2:job.priorityCounts[1]?1:0;}}
   queue.sort((a,b)=>b.priority-a.priority);
   for(const job of jobs)if(!job.owners&&!job.shared&&!job.cancel){const index=queue.indexOf(job);if(index!==-1){queue.splice(index,1);loading.delete(job.frame.url);job.resolve();}}
   if(!keep)for(const job of jobs)if(!job.owners&&!job.shared)job.cancel?.();
   pump();
  }};
 }
 async function prepareFrames(frames,ms,signal,priority=2){
  const loads=loadPreparation(frames,priority);
  await bounded(loads.promise,ms,signal);loads.release();
 }
 const endpoints=bank=>[bank.frames[0],bank.frames.at(-1)];
 // When a loading frame is decoded at the link seen so far: an active load after its latency (a load past it is late
 // and takes as long again), a queued one also behind the frames before it in the queue. On a link limited by
 // bandwidth the latency is at least the round trip and the frames of all slots, which share the link.
 const spacing=()=>Math.max(link.interval??link.latency/slots(),link.each??0);
 const latency=()=>Math.max(link.latency,link.rtt==null?0:link.rtt+slots()*link.each);
 function eta(frame){
  const job=loading.get(frame.url);if(!job)return Infinity;
  if(activeJobs.has(job)){const took=performance.now()-job.began;return took<=latency()?latency()-took:took;}
  const place=queue.indexOf(job);return place<0?Infinity:latency()+(place+1)*spacing();
 }
 // A jump starts once, at the link seen so far, its first frame is decoded one frame before the jump clock reaches it
 // (lead ms after the start) and each other needed frame in time. On a link that bandwidth does not limit, a frame late
 // by the request latency is late once and the frames behind it come soon after: it may come LEAP_HOLD ms after its
 // time. On a link limited by bandwidth each later frame waits behind it: it must come by its latest time (leapPlan).
 // A fast link starts at once, also while its frames still load; a slow link waits for its frames, up to ms.
 // True when the frames are due in time.
 async function leapWait({needed:frames,latest},lead,ms,signal){
  const deadline=performance.now()+ms;
  for(;;){
   const left=frames.filter(f=>!images.has(f.url));
   if(!left.length||link.latency!=null&&left.every(f=>eta(f)+spacing()<lead+(slots()<6?latest(f):f.timeMs+(f===frames[0]?0:LEAP_HOLD))))return true;
   const loads=left.map(f=>loading.get(f.url)?.promise).filter(Boolean);
   if(!loads.length||performance.now()>=deadline||signal?.aborted)return false;
   await bounded(Promise.race(loads),deadline-performance.now(),signal);
  }
 }
 // Hold the start only until, at the decode rate seen so far, each strike frame still loading is ready one frame before
 // the attack clock reaches it (lead ms after the start), so a fast link starts at once and a slow decode waits.
 async function strikeWait(frames,lead,ms,signal){
  const began=performance.now(),deadline=began+ms,pending=()=>frames.filter(f=>!images.has(f.url)&&loading.has(f.url)),first=pending().length;
  for(let left=pending();left.length&&performance.now()<deadline&&!signal?.aborted;left=pending()){
   const done=first-left.length,each=(performance.now()-began)/Math.max(1,done);
   if(done&&left.every((f,i)=>(i+2)*each<=lead+f.timeMs))return;
   await bounded(Promise.race(left.map(f=>loading.get(f.url).promise)),deadline-performance.now(),signal);
  }
 }
 // An attack's frames up to and including its contact pose: each must be decoded before the attack clock reaches it.
 const strike=bank=>bank.frames.slice(0,Math.max(4,bank.frames.findLastIndex(f=>f.timeMs<=bank.contactMs)+1));
 // A jump's stream (leapPlan): advance(i) loads and pins the window at frame i and releases the frames behind it.
 function leapStream(bank){
  const plan=leapPlan(bank),held=new Map(),running=new Set();let at=-1,ended=false;
  return {...plan,
   advance(index){
    if(ended||index<=at)return;at=index;const want=plan.window(index);
    // A passed frame in transfer runs on: it is near its end, and until the next frame is decoded it is the nearer pose.
    for(const [key,release] of held)if(!want.some(f=>f.url===key)){held.delete(key);const job=loading.get(key);if(job&&activeJobs.has(job)){running.add(release);void job.promise.then(()=>{running.delete(release);release();});}else release();}
    for(const frame of want)if(!held.has(frame.url)){const loads=loadPreparation([frame],2,at>0),pin=reserve([frame]);held.set(frame.url,()=>{loads.release();pin();});}
   },
   release(){ended=true;for(const release of [...held.values(),...running])release();held.clear();running.clear();},
  };
 }
 async function loadSeparate(character){
  const entry=effectEntries[character];if(!connected()||!entry||performance.now()<(effectRetryAt.get(character)??0))return null;
  // The scene draws this one itself and takes only the contact time, so the package's images never load.
  if(drawnEffects.includes(character))return {player:null,contactMs:entry.contactMs};
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
  return {url:frame.url,image:entry.art,pivot:bank.pivot.map((n,i)=>n-offset[i]),scale:bankScale(bank),bank:bank.id,sourceSha256:frame.sourceSha256,sourceBankSha256:bank.sourceSha256,time:frame.timeMs,canvasSize:size,unitHeight:bank.registrationHeightPx,footprint:footprintOf(frame,bank),effectAnchor:frame.effectAnchor??anchorAt(bank,'arrowhead-smoke',frame.timeMs)??anchorAt(bank,'arrow',frame.timeMs)};
 }
 function routeSample(route,time){for(const part of route){if(time<=part.bank.durationMs)return sample(part.bank,part.reverse?part.bank.durationMs-time:time,true,part.reverse,true);time-=part.bank.durationMs;}const last=route.at(-1);return last?sample(last.bank,last.reverse?0:last.bank.durationMs,true,last.reverse,true):null;}
 return {
  ready:()=>bounded(loadManifest()).then(()=>{}),
  has:(character,army)=>{if(!manifestReady)void loadManifest();return !!idle(character,army);},
  get stats(){return {bytes:bytes+effectBytes+smokeBytes,peakBytes,framesLoaded:images.size,active,queued:queue.length,manifestReady,manifestLoading:!!manifestLoading};},
  smoke(){return smokeClass&&smokeImage?new smokeClass(smokeImage):null;},
  warm,
  async prefetchMoves(character,army,directions,captures=[]){
   const generation=++moveGeneration;movePrefetchActive=true;moveLoads?.release();moveLoads=null;movePins?.();movePins=null;
   try{
    await bounded(loadManifest());if(disposed||generation!==moveGeneration)return;
    const all=forPiece(character,army),rest=idle(character,army),turns=all.filter(b=>b.kind==='turn');
    // Decode capture starts before the click; the move keeps its existing wait limit.
    const attacks=all.filter(b=>b.kind==='attack'&&captures.includes(b.facing));
    // Past half the budget, a further capture prefetches only its first frames, so two large strikes do not evict each other.
    let prefetchBytes=0;const counted=new Set();
    const moves=all.filter(b=>(jumps(character)?b.kind==='movement':b.kind==='move')&&directions.includes(b.facing)),leaps=jumps(character)?moves:[];
    const routeOf=bank=>rest?turnRoute(turns,rest.facing,bank.facing):null;
    for(const bank of leaps.length?[]:[...attacks,...moves]){
     if(disposed||generation!==moveGeneration)return;
     const capture=bank.kind==='attack',route=routeOf(bank);
     if(capture&&(!rest||route===null))continue;
     const frames=[...(capture?prefetchBytes<=DECODED_BUDGET/2?strike(bank):bank.frames.slice(0,4):bank.frames),...(rest?[rest.frames[0]]:[]),...(route??[]).flatMap(part=>capture&&character.startsWith('king-')?part.bank.frames:endpoints(part.bank))];
     const loads=loadPreparation(frames,1);moveLoads=loads;await loads.promise;
     if(capture)for(const f of frames)if(!counted.has(f.url)){counted.add(f.url);prefetchBytes+=images.get(f.url)?.size??0;}
     if(moveLoads===loads){moveLoads=null;loads.release();}
    }
    // A jump prefetches toward all legal targets and its captures in one queue, so the loads overlap and a capture does
    // not take the whole half before the leaps: the first frames and turn of each capture and the first frame and turn
    // of each leap, then the needed frames of all leaps (leapPlan) and the strike frames of the captures in the order the
    // clocks reach them (a turn first delays them), while they fit in that half. They stay decoded while the piece is
    // selected, so the idle play of the figures cannot push them out.
    if(leaps.length&&!disposed&&generation===moveGeneration){
     const frames=[],of=(bank,list)=>list.map(frame=>[bank,frame]),lead=b=>(routeOf(b)??[]).reduce((n,p)=>n+p.bank.durationMs,0);
     const strikes=rest?attacks.filter(b=>routeOf(b)!==null):[],start=b=>[...(rest?of(rest,[rest.frames[0]]):[]),...(routeOf(b)??[]).flatMap(p=>of(p.bank,endpoints(p.bank)))];
     const due=[...leaps.flatMap(b=>leapPlan(b).needed.map(f=>[b,f,lead(b)+f.timeMs])),...strikes.flatMap(b=>strike(b).slice(4).map(f=>[b,f,lead(b)+f.timeMs]))].sort((x,y)=>x[2]-y[2]);
     for(const [bank,f] of [...strikes.flatMap(b=>[...of(b,b.frames.slice(0,4)),...start(b)]),...leaps.flatMap(b=>[...of(b,[b.frames[0]]),...start(b)]),...due]){
      if(counted.has(f.url))continue;const size=bank.canvasSize[0]*bank.canvasSize[1]*4;if(prefetchBytes+size>DECODED_BUDGET/2)break;counted.add(f.url);prefetchBytes+=size;frames.push(f);
     }
     movePins=reserve(frames);const loads=loadPreparation(frames,1);moveLoads=loads;await loads.promise;
     if(moveLoads===loads){moveLoads=null;loads.release();}
    }
   }finally{if(generation===moveGeneration){movePrefetchActive=false;pump();}}
  },
  releaseMovePrefetch(){moveGeneration++;movePrefetchActive=false;suspendPump++;try{moveLoads?.release(true);moveLoads=null;movePins?.();movePins=null;}finally{suspendPump--;}},
  async reserveIdle(character,army){
   idleLoads?.release();idleLoads=null;const generation=++idleGeneration;await bounded(loadManifest());if(disposed||generation!==idleGeneration)return false;
   const rest=idle(character,army),all=forPiece(character,army).filter(b=>b.kind==='idle');
   if(!rest||!all.length||all.some(b=>b.facing!==rest.facing||b.frames[0].url!==rest.frames[0].url||b.frames.at(-1).url!==rest.frames[0].url))return false;
   if(forPiece(character,army).some(b=>b.kind==='turn'&&((b.from===rest.facing&&b.frames[0].url!==rest.frames[0].url)||(b.to===rest.facing&&b.frames.at(-1).url!==rest.frames[0].url))))return false;
   const frames=[...new Map(all.flatMap(b=>b.frames).map(f=>[f.url,f])).values()];
   const loads=loadPreparation(frames,0);idleLoads=loads;
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
  async prepare(character,army,direction,capture,oneSquare=false,signal,bites=null){
   const deadline=performance.now()+LOAD_TIMEOUT,remaining=()=>Math.max(0,deadline-performance.now());
   await bounded(loadManifest(),remaining(),signal);if(disposed||signal?.aborted||!remaining())return null;
   const all=forPiece(character,army),rest=idle(character,army);if(!rest)return null;
   const attack=capture?all.find(b=>b.kind==='attack'&&b.facing===direction):null;
   const playable=b=>b.facing===direction&&Number.isFinite(b.durationMs)&&b.durationMs>0&&b.frames?.length&&(b.kind!=='move'||Number.isFinite(b.strideSquares)&&b.strideSquares>0);
   let movement=!capture?(jumps(character)?all.find(b=>b.kind==='movement'&&playable(b))??null:all.find(b=>b.kind==='move'&&playable(b))||oneSquare&&all.find(b=>b.kind==='movement'&&playable(b))||null):null;
   const movementRequested=!!movement;
   const turns=all.filter(b=>b.kind==='turn'),before=turnRoute(turns,rest.facing,direction),after=before&&reverseRoute(before);
   // A missing edge keeps the rest body coherent instead of jumping to an unsupported facing.
   if(before===null)return null;
   const routeFrames=character.startsWith('king-')&&capture?p=>p.bank.frames:p=>endpoints(p.bank);
   // A chain of captures: each bite has its own attack and the turn from the last bite's facing.
   let chain=null,back=after;
   if(attack&&bites?.length>1){
    chain=bites.map((facing,i)=>({attack:all.find(b=>b.kind==='attack'&&b.facing===facing),turn:i?turnRoute(turns,bites[i-1],facing):[]}));
    if(chain.some(bite=>!bite.attack||!bite.turn))chain=null;
    else{for(const bite of chain)bite.turnMs=bite.turn.reduce((n,p)=>n+p.bank.durationMs,0);back=turnRoute(turns,rest.facing,bites.at(-1))&&reverseRoute(turnRoute(turns,rest.facing,bites.at(-1)));if(!back){chain=null;back=after;}}
   }
   const start=[rest.frames[0],...before.flatMap(routeFrames),...back.flatMap(routeFrames),...(attack?attack.frames.slice(0,4):[]),...(chain?chain.flatMap(bite=>[...bite.attack.frames.slice(0,4),...bite.turn.flatMap(routeFrames)]):[])];
   // The attack frames from the fifth up to contact load behind the start frames and run on into the attack.
   const strikeFrames=attack?strike(attack).slice(4):[];
   let startLoads,movementLoads=null,strikeLoads=null;
   // A capture's start frames stay decoded while the selection's own loads run on, or the old figure would play it.
   const releasePins=movement||capture?reserve([...start,...strikeFrames]):null;
   let releaseFallback=releasePins&&(()=>{strikeLoads?.release();releasePins();});
   // A jump streams its frames during play (leapPlan, leapWait).
   const leap=movement&&jumps(character)?leapStream(movement):null,required=leap?[]:movement?.frames??[],beforeMs=before.reduce((n,p)=>n+p.bank.durationMs,0);
   // A jump bank can be partly cached; its stream keeps those frames while its missing frames load.
   let releaseMovement=leap?leap.release:null;
   if(movement||strikeFrames.length){suspendPump++;try{startLoads=loadPreparation(start);if(leap)leap.advance(0);else if(movement)movementLoads=loadPreparation(movement.frames);else strikeLoads=loadPreparation(strikeFrames);}finally{suspendPump--;pump();}}
   else startLoads=loadPreparation(start);
   await bounded(startLoads.promise,remaining(),signal);startLoads.release();
   if(disposed||signal?.aborted||!remaining()||start.some(frame=>!images.has(frame.url))){movementLoads?.release();releaseMovement?.();releaseFallback?.();return null;}
   const sizes=new Map(start.map(frame=>[frame.url,images.get(frame.url).size]));
   let releaseMovementStart=null;
   if(movement){
    // A jump that is not due in time by the limit still plays once its first frames are decoded: on a slow link it
    // waits up to LEAP_LATE ms more for its stream to come in time, as a held pose shows more than a later start.
    const onTime=leap?await leapWait(leap,beforeMs,remaining(),signal)||leap.first.every(frame=>images.has(frame.url))&&(await leapWait(leap,beforeMs,LEAP_LATE,signal),true):(await bounded(movementLoads.promise,remaining(),signal),remaining()>0);
    movementLoads?.release();
    if(disposed||signal?.aborted){releaseMovement?.();releaseFallback();return null;}
    if(!onTime||required.some(frame=>!images.has(frame.url))){movement=null;releaseMovement?.();releaseMovement=null;}
    else {releaseMovementStart=reserve([movement.frames[0]]);releaseMovement??=reserve([movement.frames.at(-1)]);}
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
   if(movement&&required.some(frame=>!images.has(frame.url))){movement=null;releaseMovementStart?.();releaseMovement?.();releaseMovementStart=null;releaseMovement=null;}
   if(strikeLoads){await strikeWait(strikeFrames,beforeMs,remaining(),signal);if(disposed||signal?.aborted){releaseFallback?.();return null;}}
   return {rest,attack,movement,leap:movement&&leap,effect,chain,before,after:back,releaseMovementStart,releaseMovement,releaseFallback,beforeMs,afterMs:back.reduce((n,p)=>n+p.bank.durationMs,0)};
  },
  action(prepared,time,duration,contact,boundary){
   if(time<0)return routeSample(prepared.before,time+prepared.beforeMs)??sample(prepared.rest,0,false);
   if(time>duration)return routeSample(prepared.after,time-duration)??sample(prepared.rest,0,false);
   if(boundary==='turn-end')return routeSample(prepared.before,prepared.beforeMs)??sample(prepared.rest,0,false);
   const attack=prepared.attack;
   if(prepared.chain){let t=time;for(const bite of prepared.chain){if(t<bite.turnMs)return routeSample(bite.turn,t)??sample(bite.attack,0,false);t-=bite.turnMs;if(t<=bite.attack.durationMs||bite===prepared.chain.at(-1))return sample(bite.attack,Math.min(t,bite.attack.durationMs),true,false,true)??sample(prepared.rest,0,false);t-=bite.attack.durationMs;}}
   if(attack){return sample(attack,Math.min(time,attack.durationMs),true,false,true)??sample(prepared.rest,0,false);}
   if(prepared.movement){const move=prepared.movement,frames=move.frames;if(boundary==='end'&&move.kind==='move')return routeSample(prepared.after,0)??sample(prepared.rest,0,false);const frame=boundary==='start'?frames[0]:boundary==='end'?frames.at(-1):null;const clock=move.kind==='move'?time*(prepared.movementRate??1)%move.durationMs:duration>0?time/duration*move.durationMs:0;prepared.leap?.advance(frames.indexOf(frame??frameAt(move,clock)));const body=sample(move,clock,true,false,true,frame);if(body)return body;}
   return routeSample(prepared.before,prepared.beforeMs)??sample(prepared.rest,0,false);
  },
  dispose(){disposed=true;observer?.disconnect();clearTimeout(paceTimer);if(listening)globalThis.removeEventListener('online',reconnect);banks=[];footprints=null;restChoices.clear();images.clear();idlePins.clear();pins.clear();activeFrame=null;bytes=0;effectBytes=0;smokeBytes=0;currentEffect=null;effectLoads.clear();smokeClass=null;smokeImage=null;for(const job of activeJobs)job.cancel();for(const job of queue)job.resolve();queue.length=0;loading.clear();},
 };
}
