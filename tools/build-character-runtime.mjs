/** Build the game's ready-only character frames from a pinned frozen catalog. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {buildRuntimeEffects} from './character-runtime-effects.mjs';
import {runMoveGates} from './anim/move-gates.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const direction = value => directions.includes(value) ? value : null;
const inside = (base, path) => { const rel = relative(base, path); if (rel.startsWith('..') || rel.startsWith('/')) throw Error(`Asset outside frozen package: ${rel}`); return path; };

export function registerBanks(banks, assets = new Map()) {
  const groups = new Map();
  for (const bank of banks) { const key = `${bank.character}:${bank.army}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(bank); }
  for (const all of groups.values()) {
    const group=all.filter(bank=>bank.kind!=='movement'&&bank.kind!=='move');
    const parent=group.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i])),owners=new Map();
    for(const [i,bank]of group.entries())for(const frame of [bank.frames[0],bank.frames.at(-1)]){
      const previous=owners.get(frame.sourceSha256);if(previous!=null)parent[find(i)]=find(previous);else owners.set(frame.sourceSha256,i);
    }
    const components=new Map();for(const [i,bank]of group.entries()){const key=find(i);if(!components.has(key))components.set(key,[]);components.get(key).push(bank);}
    for(const component of components.values()){
      const authoredPivot=component.find(bank=>bank.pivot)?.pivot;
      for(const bank of component){
        bank.pivot??=authoredPivot??[bank.canvasSize[0]/2,350+(bank.canvasSize[1]-384)/2];
        bank.bodyHeightPx??=Math.max(.5,bank.pivot[1]-bank.bodyTopPx);
        delete bank.bodyTopPx;
      }
      const rest=component.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0]??component.find(b=>b.kind==='turn'&&(b.from==='SE'||b.to==='SE'))??component[0];
      const endpoints=new Map();
      for(const bank of component){
        bank.sourceBoardScale=bank.boardScale==null?null:bank.boardScale/2;
        bank.registrationHeightPx=rest.bodyHeightPx;bank.registrationSourceSha256=rest.sourceSha256;bank.boardScale=null;
        for(const frame of [bank.frames[0],bank.frames.at(-1)]){
          const size=assets.get(frame.sourceSha256)?.size??bank.canvasSize;
          const pivot=bank.pivot.map((n,i)=>n-(bank.canvasSize[i]-size[i])/2);
          const transform=JSON.stringify([pivot,bank.registrationHeightPx,bank.boardScale]),previous=endpoints.get(frame.sourceSha256);
          if(previous&&previous!==transform)throw Error(`Inconsistent shared endpoint transform: ${bank.character}/${bank.army}/${frame.sourceSha256}`);
          endpoints.set(frame.sourceSha256,transform);
        }
      }
    }
    const movements=all.filter(bank=>bank.kind==='movement'||bank.kind==='move');
    if(movements.length){
      const rest=group.filter(bank=>bank.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0];
      for(const bank of movements){
        if(bank.bodyHeightPx == null && !rest)throw Error(`Movement bank needs a registration height: ${bank.character}/${bank.army}`);
        bank.sourceBoardScale=bank.boardScale==null?null:bank.boardScale/2;
        bank.registrationHeightPx=bank.bodyHeightPx ?? rest.registrationHeightPx;
        bank.registrationSourceSha256=bank.bodyHeightPx == null ? rest.registrationSourceSha256 : bank.sourceSha256;
        bank.bodyHeightPx??=Math.max(.5,bank.pivot[1]-bank.bodyTopPx);delete bank.bodyTopPx;bank.boardScale=null;
      }
    }
  }
  return banks;
}

export async function buildCharacterRuntime({ source, output, selection = resolve(root, 'docs/specs/character-animation-samples/runtime-selection.json'), characters = null }) {
  const outputFromSource = relative(source, output);
  if (!outputFromSource || !outputFromSource.startsWith('..')) throw Error('Runtime output must be outside the frozen source');
  const selected = JSON.parse(await readFile(selection, 'utf8'));
  if (selected.schemaVersion !== 1 || selected.status !== 'ready' || !Array.isArray(selected.entries)) throw Error('Invalid ready selection');
  const catalogBytes=await readFile(resolve(source,'manifest.json'));
  if(digest(catalogBytes)!==selected.catalogSha256)throw Error('Pinned character catalog changed');
  const catalog=JSON.parse(catalogBytes);
  const accepted = new Map(catalog.entries.map(entry => [`${entry.character}:${entry.army}:${entry.id}`, entry]));
  const paintedSources=new Set(catalog.entries.filter(entry=>entry.kind==='movement-study').map(entry=>`${entry.character}:${entry.army}:${entry.direction}:${entry.sha256}`));
  const catalogFrames=new Set();
  const selectedFacings=new Set(selected.entries.filter(e=>e.kind==='move').map(e=>`${e.character}:${e.army}:${e.direction}`));
  for(const entry of catalog.entries.filter(e=>e.kind==='movement-study'&&selectedFacings.has(`${e.character}:${e.army}:${e.direction}`))){
    const bytes=await readFile(inside(source,resolve(source,entry.manifest)));
    if(digest(bytes)!==entry.sha256)throw Error(`Bank hash mismatch: ${entry.id}`);
    for(const frame of JSON.parse(bytes).frames??[])if(frame.sha256)catalogFrames.add(frame.sha256);
  }
  const restHashes=new Map();
  for(const entry of selected.entries.filter(e=>e.kind==='idle'||e.kind==='turn')){
    const bytes=await readFile(inside(source,resolve(source,entry.manifest)));if(digest(bytes)!==entry.sha256)throw Error(`Bank hash mismatch: ${entry.id}`);
    const frames=JSON.parse(bytes).frames??[],key=`${entry.character}:${entry.army}`;
    if(!restHashes.has(key))restHashes.set(key,new Set());
    for(const frame of [frames[0],frames.at(-1)])if(frame?.sha256)restHashes.get(key).add(frame.sha256);
  }
  const assets = new Map(), banks = [];
  let previous=new Map();
  try { if(JSON.parse(await readFile(resolve(output,'manifest.json'))).sourceToRuntimeScale===0.5)previous=new Map(JSON.parse(await readFile(resolve(output,'assets.json'))).map(asset=>[asset.sourceSha256,asset])); } catch {}
  await mkdir(resolve(output, 'assets'), { recursive: true });
  async function asset(frame, base) {
    if (!/^[a-f0-9]{64}$/.test(frame.sha256)) throw Error('Frame has no content hash');
    if (!assets.has(frame.sha256)) {
      const bytes = await readFile(inside(source, resolve(base, frame.url)));
      if (digest(bytes) !== frame.sha256) throw Error(`Frame hash mismatch: ${frame.sha256}`);
      const cached=previous.get(frame.sha256);
      if(cached&&Number.isFinite(cached.top)&&Array.isArray(cached.size)){
        const derived=await readFile(inside(output,resolve(output,cached.url)));
        if(digest(derived)!==cached.sha256)throw Error(`Cached runtime frame hash mismatch: ${cached.sha256}`);
        const sourceInfo=await sharp(bytes).metadata(),decoded=await sharp(derived).ensureAlpha().extractChannel('alpha').raw().toBuffer({resolveWithObject:true});
        if(sourceInfo.width!==cached.size[0]*2||sourceInfo.height!==cached.size[1]*2||decoded.info.width!==cached.size[0]||decoded.info.height!==cached.size[1]||!decoded.data.includes(0)||!decoded.data.some(a=>a>0))throw Error('Cached runtime geometry or alpha mismatch');
        assets.set(frame.sha256,cached);return {...cached,timeMs:frame.timeMs};
      }
      const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let low = 255, high = 0;
      for (let i = 3; i < data.length; i += 4) { low = Math.min(low, data[i]); high = Math.max(high, data[i]); }
      if (low !== 0 || high === 0) throw Error(`Character frame has no transparent edge: ${frame.sha256}`);
      if (info.width % 2 || info.height % 2) throw Error(`Cannot halve odd canvas: ${frame.sha256}`);
      const derived = await sharp(bytes).resize(info.width / 2, info.height / 2).png().toBuffer();
      const alpha = await sharp(derived).ensureAlpha().extractChannel('alpha').raw().toBuffer();
      if (!alpha.includes(0) || !alpha.some(value => value > 0)) throw Error(`Derived frame has no transparent edge: ${frame.sha256}`);
      const hash = digest(derived), url = `assets/${hash}.png`;
      await writeFile(resolve(output, url), derived);
      let top = info.height;
      for (let y = 0; y < info.height && top === info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 128) { top = y; break; }
      assets.set(frame.sha256, { url, sha256: hash, sourceSha256: frame.sha256, size: [info.width / 2, info.height / 2], top });
    }
    return { ...assets.get(frame.sha256), timeMs: frame.timeMs };
  }
  for (const entry of selected.entries) {
    if (characters && !characters.includes(entry.character)) continue;
    const current = accepted.get(`${entry.character}:${entry.army}:${entry.id}`);
    if (!current || current.kind !== entry.kind || !(current.status === 'ready' || entry.kind === 'movement-study' && current.status === 'draft') || current.sha256 !== entry.sha256 || current.manifest !== entry.manifest) throw Error(`Ready selection changed: ${entry.character}/${entry.id}`);
    if (!['idle', 'turn', 'attack', 'movement-study', 'move'].includes(entry.kind)) throw Error(`Unsupported runtime kind: ${entry.kind}`);
    const path = inside(source, resolve(source, entry.manifest)), bytes = await readFile(path);
    if (digest(bytes) !== entry.sha256) throw Error(`Bank hash mismatch: ${entry.id}`);
    const raw = JSON.parse(bytes), bank = { ...(raw.metadata ?? {}), ...raw };
    if (!(bank.status === 'ready' || entry.kind === 'movement-study' && bank.status === 'draft' && current.status === 'draft') || !Array.isArray(bank.frames) || bank.frames.length < (entry.kind === 'movement-study' ? 2 : 1) || !Number.isFinite(bank.durationMs) || !(bank.durationMs > 0)) throw Error(`Invalid ready bank: ${entry.id}`);
    let canvas = bank.canvasSize;
    if (canvas == null) {
      const info = await sharp(await readFile(inside(source, resolve(dirname(path), bank.frames[0].url)))).metadata();
      canvas = [info.width, info.height];
    }
    if (!Array.isArray(canvas) || canvas.length !== 2 || canvas.some(n => !(n > 0))) throw Error(`Invalid canvas: ${entry.id}`);
    const idDirections = entry.id.match(/(?:^|-)(N|NE|E|SE|S|SW|W|NW)(?=-|$)/g)?.map(s => s.replace(/^-/, '')) ?? [];
    const edge = (bank.direction ?? entry.direction ?? '').split('-');
    const from = direction(bank.from ?? entry.from ?? edge[0] ?? idDirections.at(-2));
    const to = direction(bank.to ?? entry.to ?? edge[1] ?? idDirections.at(-1));
    const facing = direction(bank.facing ?? bank.direction ?? entry.direction) ?? direction(idDirections.at(-1));
    if (entry.kind === 'move' && (!facing || bank.facing !== facing || bank.direction !== facing || current.direction !== facing || entry.direction !== facing || bank.character !== entry.character || bank.army !== entry.army || bank.sampling !== 'nearest' || new Set(bank.frames.map(f => f.sha256)).size < 4 || !Number.isFinite(bank.bodyHeightPx) || bank.bodyHeightPx <= 0 || !Number.isFinite(bank.strideSquares) || bank.strideSquares <= 0)) throw Error(`Invalid painted move: ${entry.id}`);
    if (entry.kind === 'move' && banks.some(b => b.kind === 'move' && b.character === entry.character && b.army === entry.army && b.facing === facing)) throw Error(`Duplicate painted move: ${entry.id}`);
    if (entry.kind === 'movement-study' && (!direction(current.direction) || bank.direction !== current.direction || bank.army !== entry.army || bank.character != null && bank.character !== entry.character || bank.facing != null && bank.facing !== current.direction || entry.direction != null && entry.direction !== current.direction)) throw Error(`Invalid movement facing: ${entry.id}`);
    if (entry.kind === 'movement-study' && banks.some(b => b.kind === 'movement' && b.character === entry.character && b.army === entry.army && b.facing === facing)) throw Error(`Duplicate movement facing: ${entry.character}/${entry.army}/${facing}`);
    let sourceFrames=bank.frames, durationMs=bank.durationMs;
    if(entry.kind==='move'&&bank.playOrder!=null){
      const order=bank.playOrder;
      if(!Array.isArray(order)||order.length!==bank.frames.length||order.some(index=>!Number.isInteger(index)||index<0||index>=bank.frames.length)||new Set(order).size!==order.length)throw Error(`Invalid painted move order: ${entry.id}`);
      const ordered=order.map(index=>bank.frames[index]);
      let time=0,total=0;
      sourceFrames=ordered.map(frame=>{const next={...frame,timeMs:time};time+=frame.durationMs;total+=frame.durationMs;return next;});
      if(total!==durationMs)throw Error(`Invalid painted move order timing: ${entry.id}`);
    }
    if (entry.kind === 'movement-study' && (bank.entryFrames != null || bank.settleFrames != null)) {
      const entryFrames=bank.entryFrames ?? [], settleFrames=bank.settleFrames ?? [];
      if (!Array.isArray(entryFrames) || !Array.isArray(settleFrames)) throw Error(`Invalid movement sections: ${entry.id}`);
      const sectionDuration = section => {
        if (section.some(f => !Number.isFinite(f.timeMs) || f.timeMs < 0 || !Number.isFinite(f.durationMs) || f.durationMs <= 0)) throw Error(`Invalid movement section time: ${entry.id}`);
        return section.length ? section.at(-1).timeMs + section.at(-1).durationMs : 0;
      };
      // Each authored section starts its clock at zero.
      const before=sectionDuration(entryFrames), after=sectionDuration(settleFrames);
      const shift=(frames,offset)=>frames.map((f,i)=>({...f,timeMs:(f.timeMs ?? (frames === bank.frames ? bank.times?.[i] ?? i*bank.durationMs/(bank.frames.length-1) : NaN))+offset,
        ...(f.endMs == null ? {} : {endMs:f.endMs+offset}),
        ...(f.visibleIntervalMs ? {visibleIntervalMs:f.visibleIntervalMs.map(t=>t+offset)} : {})}));
      sourceFrames=[...entryFrames, ...shift(bank.frames,before), ...shift(settleFrames,before+bank.durationMs)];
      durationMs=before+bank.durationMs+after;
    }
    const pivot = bank.footPivot ?? bank.pivot ?? (entry.kind === 'movement-study' ? bank.frames[0].pivot : null);
    if (entry.kind === 'move' && (!Array.isArray(pivot) || pivot.length !== 2 || pivot.some(n => !Number.isFinite(n)))) throw Error(`Invalid painted move pivot: ${entry.id}`);
    if (entry.kind === 'movement-study' && (!Array.isArray(pivot) || sourceFrames.some(frame => frame.pivot != null && (!Array.isArray(frame.pivot) || frame.pivot.length !== 2 || frame.pivot.some((n, i) => n !== pivot[i]))))) throw Error(`Invalid movement pivot: ${entry.id}`);
    if (pivot != null && (pivot.length !== 2 || pivot.some(n => !Number.isFinite(n)))) throw Error(`Invalid foot pivot: ${entry.id}`);
    const frames = [], moveBounds = [];
    for (let index = 0; index < sourceFrames.length; index++) {
      const frame = sourceFrames[index], timeMs = frame.timeMs ?? bank.times?.[index] ?? index * durationMs / (sourceFrames.length - 1);
      if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs > durationMs || index && timeMs < frames[index - 1].timeMs) throw Error(`Invalid frame time: ${entry.id}`);
      if (entry.kind === 'move' && (!Number.isFinite(frame.durationMs) || frame.durationMs <= 0 || timeMs !== (index ? sourceFrames[index - 1].timeMs + sourceFrames[index - 1].durationMs : 0) || index === sourceFrames.length - 1 && timeMs + frame.durationMs !== durationMs)) throw Error(`Invalid painted move timing: ${entry.id}`);
      if (entry.kind === 'movement-study' || entry.kind === 'move') {
        const bytes = await readFile(inside(source, resolve(dirname(path), frame.url)));
        const metadata = await sharp(bytes).metadata(), { data, info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true });
        if (metadata.channels !== 4 || !metadata.hasAlpha || !data.some((n, i) => i % 4 === 3 && n > 0)) throw Error(`Invalid movement RGBA: ${entry.id}`);
        if(entry.kind==='move'){
          let top=info.height,bottom=-1;
          for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>8){top=Math.min(top,y);bottom=y;}
          if(bottom<top)throw Error(`Empty painted move frame: ${entry.id}`);
          moveBounds.push({top,bottom:bottom+1});
        }
        for (let x = 0; x < info.width; x++) if (data[x * 4 + 3] || data[((info.height - 1) * info.width + x) * 4 + 3]) throw Error(`Movement frame has no transparent exterior: ${entry.id}`);
        for (let y = 0; y < info.height; y++) if (data[y * info.width * 4 + 3] || data[(y * info.width + info.width - 1) * 4 + 3]) throw Error(`Movement frame has no transparent exterior: ${entry.id}`);
      }
      const image = await asset({ ...frame, timeMs }, dirname(path));
      const offset=frame.offset??[0,0];
      if (!Array.isArray(offset) || offset.length!==2 || offset.some((n,i)=>!Number.isInteger(n)||n<0||n%2||image.size[i]*2+2*n!==canvas[i])) throw Error(`Frame canvas mismatch: ${entry.id}`);
      frames.push({ url: image.url, sourceSha256: image.sourceSha256, timeMs, ...(Array.isArray(frame.effectAnchor) ? { effectAnchor: frame.effectAnchor.map(n => n / 2) } : {}), ...(frame.visibleIntervalMs ? { visibleIntervalMs: frame.visibleIntervalMs } : {}), ...(frame.endMs == null ? {} : { endMs: frame.endMs }) });
    }
    if(entry.kind==='move'){
      if(!/^[a-f0-9]{64}$/.test(bank.walkSourceBankSha256??''))throw Error(`Missing painted move source: ${entry.id}`);
      if(!paintedSources.has(`${entry.character}:${entry.army}:${facing}:${bank.walkSourceBankSha256}`))throw Error(`Painted move source is not in the catalog for this facing: ${entry.id}`);
      const originalBytes=await readFile(resolve(source,'banks',`${bank.walkSourceBankSha256}.json`));
      if(digest(originalBytes)!==bank.walkSourceBankSha256)throw Error(`Painted move source hash mismatch: ${entry.id}`);
      const original=JSON.parse(originalBytes),sourceFrames=original.frames.map((f,i)=>({sha256:f.sha256,durationMs:f.durationMs,pivot:f.pivot,scale:f.uniformScale??f.scale??f.registration?.scale??f.registration?.uniformScale??bank.frames[i]?.walkSourceScale,translation:(f.translation??f.registrationTranslation??f.registration?.translation??f.registration?.paste??bank.frames[i]?.walkSourceTranslation)?.slice(0,2)}));
      const rests=new Set(restHashes.get(`${entry.character}:${entry.army}`)??[]);rests.add(bank.walkRestTransform?.standSha256);
      const heights={pawn:96,knight:112,bishop:114,rook:132,queen:120,archer:120,paladin:124,maester:112,ogre:136,guard:114};
      const sizes=moveBounds.map(b=>b.bottom-b.top).sort((a,b)=>a-b),median=sizes[Math.floor(sizes.length/2)];
      const range=field=>Math.round((Math.max(...moveBounds.map(b=>b[field]))-Math.min(...moveBounds.map(b=>b[field])))*160/median*100)/100;
      const ranges={topRangeAt160:range('top'),groundRangeAt160:range('bottom')};
      const result=runMoveGates({bank,source:sourceFrames,catalogHashes:catalogFrames,restHashes:rests,transform:bank.walkRestTransform,height:heights[entry.character]??130,ranges});
      if(result.status!=='pass')throw Error(`Painted move gates failed: ${entry.id}: ${result.failures.join(', ')}`);
    }
    const sampling = [bank.sampling, bank.schedule?.sampling, bank.selectedSchedule?.sampling, bank.approvedPlayerSchedule?.sampling];
    const floor = sampling.some(s => typeof s === 'string' && /\bfloor\b/.test(s));
    banks.push({ character: entry.character, army: entry.army, id: entry.id, kind: entry.kind === 'movement-study' ? 'movement' : entry.kind, sourceSha256: entry.sha256, canvasSize: canvas.map(n => n / 2), pivot: pivot?.map(n => n / 2) ?? null, durationMs, from: from ?? (entry.kind === 'turn' ? direction(idDirections.at(-2)) : null), to, facing,
      bodyHeightPx: bank.bodyHeightPx == null ? null : bank.bodyHeightPx / 2, bodyTopPx: assets.get(bank.frames[0].sha256).top / 2, boardScale: bank.boardScale == null ? null : bank.boardScale * 2, targetPoint: Array.isArray(bank.targetPoint) ? bank.targetPoint.map(n => n / 2) : null,
      beatTimes: bank.beatTimes ?? {}, effectAnchors: (Array.isArray(bank.effectAnchors) ? bank.effectAnchors : (bank.effectAnchors?.timedframes?.[entry.army] ?? []).map(frame => ({ id: 'contact-bloom', timeMs: frame.timeMs, point: frame.contactBloomAnchor }))).filter(anchor => Array.isArray(anchor.point) && anchor.point.length === 2 && anchor.point.every(Number.isFinite) && Number.isFinite(anchor.timeMs)).map(anchor => ({ id: anchor.id, timeMs: anchor.timeMs, point: anchor.point.map(n => n / 2), ...(anchor.visibility ? { visibility: anchor.visibility } : {}) })),
      contactMs: bank.beatTimes?.contact ?? bank.beatTimes?.contactMs ?? bank.beatTimes?.release ?? bank.frames.find(f => f.phase === 'release' || f.phase === 'contact')?.timeMs ?? null,
      nearest: sourceFrames === bank.frames && !floor && (entry.kind === 'turn' || sampling.some(s => s === 'nearest')), ...(entry.kind === 'move' ? {strideSquares:bank.strideSquares} : {}), frames });
  }
  for (const bank of banks.filter(b => b.kind === 'idle')) {
    const hash = bank.frames[0].sourceSha256;
    const match = banks.find(b => b.kind === 'turn' && b.character === bank.character && b.army === bank.army && (b.frames[0].sourceSha256 === hash || b.frames.at(-1).sourceSha256 === hash));
    bank.facing ??= match ? (match.frames[0].sourceSha256 === hash ? match.from : match.to) : null;
    bank.facing ??= bank.army === 'white' ? 'SE' : 'SW';
  }
  registerBanks(banks,assets);
  const separate=await buildRuntimeEffects(source,output,banks,resolve(root,'docs/specs/character-animation-samples/runtime-effects.json'));
  for(const bank of banks){const action=separate.cues.find(a=>a.character===bank.character&&a.kind===bank.kind&&a.facing===bank.facing);const cue=action?.[bank.army];if(cue&&(!bank.beatTimes||!Object.keys(bank.beatTimes).length))bank.beatTimes=cue.beatTimes??{};}
  const manifest = { schemaVersion: 1, sourceToRuntimeScale: 0.5, effects: separate.effects, selectionSha256: digest(await readFile(selection)), banks };
  const keep = new Set([...assets.values()].map(asset => asset.url.slice(7)));
  for (const name of await readdir(resolve(output, 'assets'))) if (/^[a-f0-9]{64}\.(?:png|webp)$/.test(name) && !keep.has(name)) await rm(resolve(output, 'assets', name));
  await writeFile(resolve(output, 'assets.json'), JSON.stringify([...assets.values()]) + '\n');
  await writeFile(resolve(output, 'manifest.next.json'), JSON.stringify(manifest) + '\n');
  await rename(resolve(output, 'manifest.next.json'),resolve(output, 'manifest.json'));
  return { banks: banks.length, assets: assets.size };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), take = name => { const i = args.indexOf(name); return i < 0 ? null : args[i + 1]; };
  if (!take('--source')) throw Error('Use --source <frozen catalog directory> [--output public/character-runtime] [--characters pawn,knight]');
  console.log(JSON.stringify(await buildCharacterRuntime({ source: resolve(take('--source')), output: resolve(take('--output') ?? resolve(root, 'public/character-runtime')), selection: take('--selection') ? resolve(take('--selection')) : undefined, characters: take('--characters')?.split(',') ?? null })));
}
