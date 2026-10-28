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
export function createCharacterRuntime({url=new URL('/character-runtime/manifest.json',import.meta.url).href,wake=()=>{},fetcher=fetch,image=()=>Object.assign(new Image(),{crossOrigin:'anonymous'})}={}) {
 let banks=[],disposed=false,bytes=0,peakBytes=0,active=0;
 let effectEntries={},currentEffect=null,effectBytes=0,smokeBytes=0,smokeClass=null,smokeImage=null,smokeLoading=null;
 const images=new Map(),loading=new Map(),failed=new Set(),stills=new Set(),queue=[];
 const load=fetcher(url).then(r=>{if(!r.ok)throw Error('Character package unavailable');return r.json();}).then(m=>{if(m.schemaVersion!==1||!Array.isArray(m.banks))throw Error('Invalid character package');if(!disposed){banks=m.banks;effectEntries=m.effects??{};restChoices.clear();wake();}}).catch(()=>{});
 const forPiece=(character,army)=>banks.filter(b=>b.character===character&&b.army===army);
 const restChoices=new Map();
 const idle=(character,army)=>{
  const key=`${character}:${army}`;if(restChoices.has(key))return restChoices.get(key);
  const all=forPiece(character,army);let rest=all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0];
  if(!rest){const turn=all.find(b=>b.kind==='turn'&&(b.from==='SE'||b.to==='SE'))??all.find(b=>b.kind==='turn');if(turn){const last=turn.to==='SE';rest={...turn,id:`${turn.id}:rest`,kind:'still',frames:[last?turn.frames.at(-1):turn.frames[0]],facing:last?turn.to:turn.from};}}
  if(rest)restChoices.set(key,rest);return rest;
 };
 function trim(){
  const limit=Math.max(0,DECODED_BUDGET-effectBytes-smokeBytes);
  while(bytes>limit&&images.size){const key=[...images.keys()].find(key=>!stills.has(key))??images.keys().next().value;bytes-=images.get(key).size;images.delete(key);}
  peakBytes=Math.max(peakBytes,bytes+effectBytes+smokeBytes);
 }
 function pump(){
  while(active<6&&queue.length&&!disposed){
   const {frame,resolve}=queue.shift(),art=image();active++;
   const finish=()=>{active--;loading.delete(frame.url);resolve();pump();};
   art.onload=async()=>{
    try{await art.decode?.();if(!disposed){
     const size=(art.naturalWidth||art.width)*(art.naturalHeight||art.height)*4;
     images.set(frame.url,{art,size});bytes+=size;
     trim();
    }}catch{failed.add(frame.url);}finish();
   };
   art.onerror=()=>{failed.add(frame.url);finish();};art.src=new URL(frame.url,url).href;
  }
 }
 function loadFrame(frame){
  if(disposed||images.has(frame.url)||failed.has(frame.url))return Promise.resolve();
  if(!loading.has(frame.url)){loading.set(frame.url,new Promise(resolve=>queue.push({frame,resolve})));pump();}
  return loading.get(frame.url)??Promise.resolve();
 }
 const endpoints=bank=>[bank.frames[0],bank.frames.at(-1)];
 async function loadSeparate(character){
  const entry=effectEntries[character];if(!entry)return null;
  if(currentEffect?.character!==character){
   effectBytes=entry.decodedBytes;trim();
   currentEffect={character,promise:(async()=>{try{const moduleURL=new URL(entry.module,url).href,mod=await import(/* @vite-ignore */ moduleURL);return {player:await mod.loadEffect(moduleURL),contactMs:entry.contactMs};}catch{return null;}})()};
  }
  return currentEffect.promise;
 }
 async function loadSmoke(){
  const entry=effectEntries.archer;if(!entry?.smoke)return;
  if(!smokeLoading)smokeLoading=(async()=>{try{const mod=await import(/* @vite-ignore */ new URL(entry.smoke,url).href);const stream=new mod.ArrowSmoke();await stream.image.decode();if(!disposed){smokeClass=mod.ArrowSmoke;smokeImage=stream.image;smokeBytes=entry.smokeDecodedBytes;trim();wake();}}catch{}})();
  await smokeLoading;
 }
 async function warm(character,army,full=false){
  await load;const bank=idle(character,army);if(!bank)return;
  if(character==='archer')void loadSmoke();
  stills.add(bank.frames[0].url);const starts=full?forPiece(character,army).filter(b=>b.kind==='idle').flatMap(b=>b.frames.slice(0,6)):bank.frames.slice(0,1);await Promise.all(starts.map(loadFrame));if(!disposed)wake();
 }
 function sample(bank,time,prefetch=true,reverse=false){
  if(!bank)return null;const wanted=frameAt(bank,time),index=bank.frames.indexOf(wanted);
  const nearby=prefetch?bank.frames.slice(Math.max(0,index-(reverse?4:1)),index+(reverse?2:5)):[wanted];
  for(const frame of nearby)if(!images.has(frame.url)&&!failed.has(frame.url))void loadFrame(frame).then(()=>{if(!disposed)wake();});
  const frame=images.has(wanted.url)?wanted:bank.frames.slice(0,index+1).findLast(frame=>images.has(frame.url));
  const entry=frame&&images.get(frame.url);if(!entry)return null;images.delete(frame.url);images.set(frame.url,entry);
  return {image:entry.art,pivot:bank.pivot,scale:bank.boardScale??(HEIGHT[bank.character]??130)/bank.registrationHeightPx,bank:bank.id,sourceSha256:frame.sourceSha256,sourceBankSha256:bank.sourceSha256,time:frame.timeMs,canvasSize:bank.canvasSize,unitHeight:bank.registrationHeightPx,effectAnchor:frame.effectAnchor??anchorAt(bank,'arrowhead-smoke',frame.timeMs)??anchorAt(bank,'arrow',frame.timeMs)};
 }
 function routeSample(route,time){for(const part of route){if(time<=part.bank.durationMs)return sample(part.bank,part.reverse?part.bank.durationMs-time:time,true,part.reverse);time-=part.bank.durationMs;}const last=route.at(-1);return last?sample(last.bank,last.reverse?0:last.bank.durationMs):null;}
 return {
  ready:()=>load,
  has:(character,army)=>!!idle(character,army),
  get stats(){return {bytes:bytes+effectBytes+smokeBytes,peakBytes,active,queued:queue.length};},
  smoke(){return smokeClass&&smokeImage?new smokeClass(smokeImage):null;},
  warm,
  rest(character,army,time=0,active=false){const bank=idle(character,army);if(!bank)return null;if(active){const all=forPiece(character,army),choice=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time);if(choice){const next=idleBankAt(all.filter(b=>b.kind==='idle').sort((a,b)=>Number(b===bank)-Number(a===bank)),all.filter(b=>b.kind==='turn'),bank.facing,time+160);if(next&&next.bank!==choice.bank)for(const frame of next.bank.frames.slice(0,6))void loadFrame(frame);return sample(choice.bank,choice.time,true,choice.reverse)??sample(bank,0,false);}}return sample(bank,0,false);},
  async prepare(character,army,direction,capture){
   await load;if(disposed)return null;
   const all=forPiece(character,army),rest=idle(character,army);if(!rest)return null;
   const attack=capture?all.find(b=>b.kind==='attack'&&b.facing===direction):null;
   const turns=all.filter(b=>b.kind==='turn'),before=turnRoute(turns,rest.facing,direction),after=before&&reverseRoute(before);
   // A missing edge keeps the rest body coherent instead of jumping to an unsupported facing.
   if(before===null)return null;
   const start=[rest.frames[0],...before.flatMap(p=>endpoints(p.bank)),...after.flatMap(p=>endpoints(p.bank)),...(attack?attack.frames.slice(0,6):[])];
   await Promise.all(start.map(loadFrame));
   if(disposed||start.some(frame=>!images.has(frame.url)))return null;
   const effect=attack?await loadSeparate(character):null;
   if(disposed||attack&&effectEntries[character]&&!effect)return null;
   return {rest,attack,effect,before,after,beforeMs:before.reduce((n,p)=>n+p.bank.durationMs,0),afterMs:after.reduce((n,p)=>n+p.bank.durationMs,0)};
  },
  action(prepared,time,duration,contact){
   if(time<0)return routeSample(prepared.before,time+prepared.beforeMs)??sample(prepared.rest,0,false);
   if(time>duration)return routeSample(prepared.after,time-duration)??sample(prepared.rest,0,false);
   const attack=prepared.attack;
   if(attack){return sample(attack,Math.min(time,attack.durationMs))??sample(prepared.rest,0,false);}
   return routeSample(prepared.before,prepared.beforeMs)??sample(prepared.rest,0,false);
  },
  dispose(){disposed=true;banks=[];restChoices.clear();images.clear();bytes=0;effectBytes=0;smokeBytes=0;currentEffect=null;smokeClass=null;smokeImage=null;for(const job of queue)job.resolve();queue.length=0;loading.clear();},
 };
}
