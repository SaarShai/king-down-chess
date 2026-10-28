/** Build the game's ready-only character frames from a pinned frozen catalog. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {buildRuntimeEffects} from './character-runtime-effects.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const direction = value => directions.includes(value) ? value : null;
const inside = (base, path) => { const rel = relative(base, path); if (rel.startsWith('..') || rel.startsWith('/')) throw Error(`Asset outside frozen package: ${rel}`); return path; };

export function registerBanks(banks) {
  const groups = new Map();
  for (const bank of banks) { const key = `${bank.character}:${bank.army}`; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(bank); }
  for (const group of groups.values()) {
    const parent=group.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i])),owners=new Map();
    for(const [i,bank]of group.entries())for(const frame of [bank.frames[0],bank.frames.at(-1)]){
      const previous=owners.get(frame.sourceSha256);if(previous!=null)parent[find(i)]=find(previous);else owners.set(frame.sourceSha256,i);
    }
    const components=new Map();for(const [i,bank]of group.entries()){const key=find(i);if(!components.has(key))components.set(key,[]);components.get(key).push(bank);}
    for(const component of components.values()){
      const rest=component.filter(b=>b.kind==='idle').sort((a,b)=>Number(b.facing==='SE')-Number(a.facing==='SE'))[0]??component.find(b=>b.kind==='turn'&&(b.from==='SE'||b.to==='SE'))??component[0];
      const endpoints=new Map();
      for(const bank of component){
        bank.sourceBoardScale=bank.boardScale==null?null:bank.boardScale/2;
        bank.registrationHeightPx=rest.bodyHeightPx;bank.registrationSourceSha256=rest.sourceSha256;bank.boardScale=null;
        for(const frame of [bank.frames[0],bank.frames.at(-1)]){
          const transform=JSON.stringify([bank.pivot,bank.registrationHeightPx,bank.boardScale]),previous=endpoints.get(frame.sourceSha256);
          if(previous&&previous!==transform)throw Error(`Inconsistent shared endpoint transform: ${bank.character}/${bank.army}/${frame.sourceSha256}`);
          endpoints.set(frame.sourceSha256,transform);
        }
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
    if (!current || current.status !== 'ready' || current.sha256 !== entry.sha256 || current.manifest !== entry.manifest) throw Error(`Ready selection changed: ${entry.character}/${entry.id}`);
    if (!['idle', 'turn', 'attack'].includes(entry.kind)) throw Error(`Unsupported runtime kind: ${entry.kind}`);
    const path = inside(source, resolve(source, entry.manifest)), bytes = await readFile(path);
    if (digest(bytes) !== entry.sha256) throw Error(`Bank hash mismatch: ${entry.id}`);
    const raw = JSON.parse(bytes), bank = { ...(raw.metadata ?? {}), ...raw };
    if (bank.status !== 'ready' || !bank.frames?.length || !(bank.durationMs > 0)) throw Error(`Invalid ready bank: ${entry.id}`);
    const canvas = bank.canvasSize;
    if (!Array.isArray(canvas) || canvas.length !== 2 || canvas.some(n => !(n > 0))) throw Error(`Invalid canvas: ${entry.id}`);
    const idDirections = entry.id.match(/(?:^|-)(N|NE|E|SE|S|SW|W|NW)(?=-|$)/g)?.map(s => s.replace(/^-/, '')) ?? [];
    const edge = (bank.direction ?? entry.direction ?? '').split('-');
    const from = direction(bank.from ?? entry.from ?? edge[0] ?? idDirections.at(-2));
    const to = direction(bank.to ?? entry.to ?? edge[1] ?? idDirections.at(-1));
    const facing = direction(bank.facing ?? bank.direction ?? entry.direction) ?? direction(idDirections.at(-1));
    const pivot = bank.footPivot ?? bank.pivot ?? [canvas[0] / 2, 700 + (canvas[1] - 768) / 2];
    if (pivot.length !== 2 || pivot.some(n => !Number.isFinite(n))) throw Error(`Invalid foot pivot: ${entry.id}`);
    const frames = [];
    for (let index = 0; index < bank.frames.length; index++) {
      const frame = bank.frames[index], timeMs = frame.timeMs ?? bank.times?.[index] ?? index * bank.durationMs / (bank.frames.length - 1);
      if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs > bank.durationMs || index && timeMs < frames[index - 1].timeMs) throw Error(`Invalid frame time: ${entry.id}`);
      const image = await asset({ ...frame, timeMs }, dirname(path));
      frames.push({ url: image.url, sourceSha256: image.sourceSha256, timeMs, ...(Array.isArray(frame.effectAnchor) ? { effectAnchor: frame.effectAnchor.map(n => n / 2) } : {}), ...(frame.visibleIntervalMs ? { visibleIntervalMs: frame.visibleIntervalMs } : {}), ...(frame.endMs == null ? {} : { endMs: frame.endMs }) });
    }
    const sampling = [bank.sampling, bank.schedule?.sampling, bank.selectedSchedule?.sampling, bank.approvedPlayerSchedule?.sampling];
    const floor = sampling.some(s => typeof s === 'string' && /\bfloor\b/.test(s));
    banks.push({ character: entry.character, army: entry.army, id: entry.id, kind: entry.kind, sourceSha256: entry.sha256, canvasSize: canvas.map(n => n / 2), pivot: pivot.map(n => n / 2), durationMs: bank.durationMs, from: from ?? (entry.kind === 'turn' ? direction(idDirections.at(-2)) : null), to, facing,
      bodyHeightPx: (bank.bodyHeightPx ?? Math.max(1, pivot[1] - assets.get(bank.frames[0].sha256).top)) / 2, boardScale: bank.boardScale == null ? null : bank.boardScale * 2, targetPoint: Array.isArray(bank.targetPoint) ? bank.targetPoint.map(n => n / 2) : null,
      beatTimes: bank.beatTimes ?? {}, effectAnchors: (Array.isArray(bank.effectAnchors) ? bank.effectAnchors : (bank.effectAnchors?.timedframes?.[entry.army] ?? []).map(frame => ({ id: 'contact-bloom', timeMs: frame.timeMs, point: frame.contactBloomAnchor }))).filter(anchor => Array.isArray(anchor.point) && anchor.point.length === 2 && anchor.point.every(Number.isFinite) && Number.isFinite(anchor.timeMs)).map(anchor => ({ id: anchor.id, timeMs: anchor.timeMs, point: anchor.point.map(n => n / 2), ...(anchor.visibility ? { visibility: anchor.visibility } : {}) })),
      contactMs: bank.beatTimes?.contact ?? bank.beatTimes?.contactMs ?? bank.beatTimes?.release ?? bank.frames.find(f => f.phase === 'release' || f.phase === 'contact')?.timeMs ?? null,
      nearest: !floor && (entry.kind === 'turn' || sampling.some(s => s === 'nearest')), frames });
  }
  for (const bank of banks.filter(b => b.kind === 'idle')) {
    const hash = bank.frames[0].sourceSha256;
    const match = banks.find(b => b.kind === 'turn' && b.character === bank.character && b.army === bank.army && (b.frames[0].sourceSha256 === hash || b.frames.at(-1).sourceSha256 === hash));
    bank.facing ??= match ? (match.frames[0].sourceSha256 === hash ? match.from : match.to) : null;
    bank.facing ??= bank.army === 'white' ? 'SE' : 'SW';
  }
  registerBanks(banks);
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
