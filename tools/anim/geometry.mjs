/**
 * Locked character geometry for the animation pipeline.
 *
 * The shipped runtime bank is the approved authority. This tool reads the pivot, canvas, body height and board scale
 * of one character and army from the runtime manifest (or from the frozen catalog banks) and records the hash of the
 * file it read. A per-character source record in tools/anim/sources/<character>.json wins when it exists.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './frames.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const defaultManifest = resolve(root, 'public/character-runtime/manifest.json');
export const defaultCatalog = resolve(root, 'docs/specs/character-animation-samples/preview/consolidated-animations');
export const sourcesDir = resolve(root, 'tools/anim/sources');
const DIRECTION = /^(N|NE|E|SE|S|SW|W|NW)(?:-(N|NE|E|SE|S|SW|W|NW))?$/;

function common(values) {
  const counts = new Map();
  for (const value of values) { const key = JSON.stringify(value); counts.set(key, (counts.get(key) ?? 0) + 1); }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!ranked.length) throw Error('No value to choose a common geometry from');
  return ranked[0][0];
}

function numbers(value) {
  return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) ? value.map(n => Math.round(n * 1000) / 1000) : null;
}

/** Read a source record when the army colour branch has written one. It may hold geometry, masters or both. */
export async function readSourceRecord(character, directory = sourcesDir) {
  const path = join(directory, `${character}.json`);
  if (!existsSync(path)) return null;
  const bytes = await readFile(path), record = JSON.parse(bytes);
  const geometry = record.geometry ?? record.lockedGeometry ?? record;
  const canvas = numbers(geometry.canvas ?? geometry.canvasSize);
  const pivot = numbers(geometry.pivot ?? geometry.footPivot);
  const bodyHeightPx = geometry.bodyHeightPx ?? geometry.bodyHeight ?? geometry.registrationHeightPx;
  const complete = canvas && pivot && Number.isFinite(bodyHeightPx);
  return { path, record, complete, canvas, pivot, bodyHeightPx: complete ? Math.round(bodyHeightPx * 1000) / 1000 : null, boardScale: geometry.boardScale ?? null };
}

export function endpointsFromBanks(banks) {
  const endpoints = {};
  for (const bank of banks) {
    const first = bank.kind === 'turn' ? bank.from : bank.facing;
    const last = bank.kind === 'turn' ? bank.to : bank.facing;
    for (const [role, frame, facing] of [['first', bank.frames?.[0], first], ['last', bank.frames?.at(-1), last]]) {
      const hash = frame?.sourceSha256 ?? frame?.sha256;
      if (hash && !endpoints[hash]) endpoints[hash] = { bank: bank.id, role, facing: facing ?? null };
    }
  }
  return endpoints;
}

/** Geometry from the runtime manifest. Runtime values are half size; the source scale comes from the manifest. */
export async function geometryFromManifest(manifestPath, character, army) {
  const bytes = await readFile(manifestPath), manifest = JSON.parse(bytes);
  const scale = manifest.sourceToRuntimeScale;
  if (!Number.isFinite(scale) || scale <= 0) throw Error(`Runtime manifest has no sourceToRuntimeScale: ${manifestPath}`);
  const all = (manifest.banks ?? []).filter(bank => bank.character === character && bank.army === army);
  if (!all.length) throw Error(`Runtime manifest has no bank for ${character}/${army}`);
  const idles = all.filter(bank => bank.kind === 'idle');
  const group = idles.length ? idles : all;
  const canvasRuntime = JSON.parse(common(group.map(bank => bank.canvasSize).filter(Array.isArray)));
  const pivotRuntime = JSON.parse(common(group.map(bank => bank.pivot).filter(value => numbers(value))));
  const heights = group.map(bank => Number.isFinite(bank.registrationHeightPx) ? bank.registrationHeightPx : bank.bodyHeightPx).filter(Number.isFinite);
  if (!heights.length) throw Error(`Runtime manifest has no body height for ${character}/${army}`);
  const bodyHeightPx = JSON.parse(common(heights));
  const toSource = n => Math.round((n / scale) * 1000) / 1000;
  return {
    character, army,
    canvas: canvasRuntime.map(toSource),
    pivot: pivotRuntime.map(toSource),
    bodyHeightPx: toSource(bodyHeightPx),
    boardScale: group.find(bank => bank.boardScale != null)?.boardScale ?? null,
    authority: {
      kind: 'runtime-manifest', path: resolve(manifestPath), sha256: sha256(bytes), sourceToRuntimeScale: scale,
      banks: group.map(bank => bank.id).sort(), bankCount: group.length,
      bodyHeightSpreadPx: [Math.min(...heights.map(toSource)), Math.max(...heights.map(toSource))],
    },
    endpoints: endpointsFromBanks(all),
    directions: all.flatMap(bank => [bank.from, bank.to, bank.facing]).filter(value => DIRECTION.test(value ?? '')),
  };
}

/** Geometry from the frozen catalog banks. Catalog values are already at source scale. */
export async function geometryFromCatalog(catalogDir, character, army, manifest = 'manifest.json') {
  const path = resolve(catalogDir, manifest), bytes = await readFile(path), catalog = JSON.parse(bytes);
  const entries = (catalog.entries ?? []).filter(entry => entry.character === character && entry.army === army);
  if (!entries.length) throw Error(`Catalog has no bank for ${character}/${army}`);
  const banks = [];
  for (const entry of entries) {
    try {
      const bankBytes = await readFile(resolve(catalogDir, entry.manifest));
      banks.push({ ...JSON.parse(bankBytes), id: entry.id, character: entry.character, army: entry.army, kind: entry.kind });
    } catch { /* a missing bank does not hide the others */ }
  }
  if (!banks.length) throw Error(`Catalog banks for ${character}/${army} are unreadable`);
  const idles = banks.filter(bank => bank.kind === 'idle');
  const group = idles.length ? idles : banks;
  const canvas = JSON.parse(common(group.map(bank => bank.canvasSize).filter(Array.isArray)));
  const pivot = JSON.parse(common(group.map(bank => bank.pivot ?? bank.footPivot).filter(value => numbers(value))));
  const heights = group.map(bank => bank.bodyHeightPx).filter(Number.isFinite);
  if (!heights.length) throw Error(`Catalog banks for ${character}/${army} have no body height; use the runtime manifest as the authority`);
  return {
    character, army, canvas, pivot, bodyHeightPx: JSON.parse(common(heights)),
    boardScale: group.find(bank => bank.boardScale != null)?.boardScale ?? null,
    authority: { kind: 'catalog', path, sha256: sha256(bytes), banks: group.map(bank => bank.id), bankCount: group.length },
    endpoints: endpointsFromBanks(banks),
    directions: banks.flatMap(bank => [bank.from, bank.to, bank.facing]).filter(value => DIRECTION.test(value ?? '')),
  };
}

/** Resolve one locked geometry record. A source record wins; then the runtime manifest; then the frozen catalog. */
export async function resolveGeometry({ character, army, manifest = defaultManifest, catalog = defaultCatalog, sources = sourcesDir } = {}) {
  if (!character || !army) throw Error('resolveGeometry needs a character and an army');
  const source = await readSourceRecord(character, sources);
  if (source?.complete) {
    return {
      character, army, canvas: source.canvas, pivot: source.pivot, bodyHeightPx: source.bodyHeightPx, boardScale: source.boardScale,
      authority: { kind: 'source-record', path: source.path, sha256: sha256(await readFile(source.path)) },
      endpoints: {}, directions: [], sourceRecord: true,
    };
  }
  if (existsSync(manifest)) {
    const geometry = await geometryFromManifest(manifest, character, army);
    return { ...geometry, sourceRecord: false };
  }
  if (existsSync(resolve(catalog, 'manifest.json'))) {
    const geometry = await geometryFromCatalog(catalog, character, army);
    return { ...geometry, sourceRecord: false };
  }
  throw Error(`No locked geometry: no source record for ${character} and no runtime manifest or catalog`);
}

export async function loadGeometryFile(path) {
  const geometry = JSON.parse(await readFile(path));
  for (const key of ['character', 'army']) if (typeof geometry[key] !== 'string') throw Error(`Geometry file needs ${key}: ${path}`);
  if (!numbers(geometry.canvas) || !numbers(geometry.pivot)) throw Error(`Geometry file needs canvas and pivot: ${path}`);
  if (!Number.isFinite(geometry.bodyHeightPx)) throw Error(`Geometry file needs bodyHeightPx: ${path}`);
  if (!geometry.authority?.sha256) throw Error(`Geometry file needs an authority hash: ${path}`);
  return geometry;
}

/** Direction fields of one bank. A turn names both edges; every other kind names one facing. */
export function edgeFor(kind, facing) {
  const match = DIRECTION.exec(facing ?? '');
  if (!match) throw Error(`Facing must be one of N, NE, E, SE, S, SW, W, NW${kind === 'turn' ? ' or a pair such as SE-S' : ''}: ${facing}`);
  if (kind === 'turn') {
    if (!match[2]) throw Error(`A turn needs a from and to facing such as SE-S: ${facing}`);
    return { from: match[1], to: match[2], facing: match[2] };
  }
  if (match[2]) throw Error(`Only a turn takes two facings: ${facing}`);
  return { from: null, to: null, facing: match[1] };
}

export const repoMain = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
