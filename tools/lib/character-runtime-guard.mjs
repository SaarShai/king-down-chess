/** Reject keys outside the runtime manifest schema. */
export function validateManifest(m) {
 const keys=(value, allowed)=>{if(!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(key=>!allowed.includes(key))) throw Error('Unknown character manifest metadata'); return Object.fromEntries(Object.entries(value).filter(([key])=>allowed.includes(key)));};
 const leaves=value=>{if(Array.isArray(value)) value.forEach(leaves); else if(value!==null && typeof value==='object') throw Error('Unknown character manifest metadata');};
 m=keys(m,['schemaVersion','sourceToRuntimeScale','selectionSha256','effects','banks']);
 if(!Array.isArray(m.banks)) throw Error('Invalid character manifest banks');
 for(const [name,value] of Object.entries(m)) if(!['effects','banks'].includes(name)) leaves(value);
 m.effects=keys(m.effects,['maester','queen','archer']);
 for(const [name,value] of Object.entries(m.effects)) {const effect=keys(value,['module','smoke','decodedBytes','smokeDecodedBytes','contactMs']); Object.values(effect).forEach(leaves);m.effects[name]=effect;}
 m.banks=m.banks.map(value=>{
  const b=keys(value,['character','army','id','kind','sourceSha256','canvasSize','pivot','durationMs','from','to','facing','bodyHeightPx','bodyTopPx','boardScale','targetPoint','beatTimes','effectAnchors','contactMs','nearest','frames','sourceBoardScale','registrationHeightPx','registrationSourceSha256']);
  for(const [name,value] of Object.entries(b)) if(!['beatTimes','frames','effectAnchors'].includes(name)) leaves(value);
  b.beatTimes=keys(b.beatTimes,['recovery','contact','contactMs','release','exactRest','releaseHoldEnd','holdEnd','aim','windup','rest','end','lift','peakMs','anticipation','lowering','beamEnd','recoil','nearPalmRelease','recoveryBreakdown','exactRestEnd','motionStart','initialRestMs','firstCloseMs','curlMs','relaxMs','neutralMs','endMs','restHoldEndMs','returnStartMs','restMs']);
  Object.values(b.beatTimes).forEach(leaves);
  if(!Array.isArray(b.frames)||!Array.isArray(b.effectAnchors)) throw Error('Invalid character manifest frames or anchors');
  b.frames=b.frames.map(value=>{const f=keys(value,['url','sourceSha256','timeMs','visibleIntervalMs','endMs','effectAnchor']);Object.values(f).forEach(leaves);return f;});
  b.effectAnchors=b.effectAnchors.map(value=>{const a=keys(value,['timeMs','point','id','visibility']);Object.values(a).forEach(leaves);return a;});
  return b;
 });
 return m;
}
export function privateRuntimeData(data, json = false) {
 let text=data.toString('utf8'), value;
 if(json) { try { value=JSON.parse(text); text=JSON.stringify(value); } catch {} }
 const drivePath=v=>typeof v==='string' ? /(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]/.test(v)
  : Array.isArray(v) ? v.some(drivePath) : v && typeof v==='object' ? Object.values(v).some(drivePath) : false;
 return /\/Users\/|\/home\/|\/private\/|\/var\/folders\/|file:\/\//.test(text)
  || (json && drivePath(value))
  || /\.codex|generated_images|"(?:prompt|provider|sourcePath|originalPath|localPath|sourceImagePath|sourceFramePath|reviewNotes|reviewer)"\s*:/.test(text);
}
/** Only image chunks needed to render are public. */
export function validateRuntimeImage(data, file) {
 if(file.endsWith('.png')) {
  if(!data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) throw Error(`Invalid runtime PNG: ${file}`);
  let i=8; while(i<data.length){if(i+12>data.length) throw Error(`Invalid runtime PNG: ${file}`); const n=data.readUInt32BE(i),name=data.toString('ascii',i+4,i+8); if(i+12+n>data.length||!['IHDR','IDAT','IEND'].includes(name)) throw Error(`Invalid runtime PNG chunk: ${file}`); i+=12+n;}
 } else if(file.endsWith('.webp')) {
  if(data.toString('ascii',0,4)!=='RIFF'||data.toString('ascii',8,12)!=='WEBP'||data.readUInt32LE(4)+8!==data.length) throw Error(`Invalid runtime WebP: ${file}`);
  let i=12;while(i<data.length){if(i+8>data.length) throw Error(`Invalid runtime WebP: ${file}`);const name=data.toString('ascii',i,i+4),n=data.readUInt32LE(i+4);if(i+8+n+(n%2)>data.length||!['VP8X','VP8 ','VP8L','ALPH'].includes(name)) throw Error(`Invalid runtime WebP chunk: ${file}`);i+=8+n+(n%2);}
 }
}
