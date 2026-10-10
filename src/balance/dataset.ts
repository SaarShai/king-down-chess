import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { homedir } from 'node:os';
import { CARD_POOL, RULE_POWERS } from '../sim/tournament';
import { addMoment, estimate, markdownTables, moments, numericCell, stable, unknownContext, type Measure, type Measurement, type MeasurementContext, type Moments, type Validity } from './measurements';

type Json = Record<string, any>;
export interface SourceOverride {
  /** Match the portable source name exactly. An override never applies by run ID alone. */
  source: string;
  validity?: Validity;
  reason: string;
  commit?: string;
  machine?: string;
  complete?: boolean;
}
export interface SourceCoverage {
  source: string; run: string | null; kind: string; status: string; reasons: string[];
  bytes: number; records: number; accepted: number; duplicates: number; invalid: number;
  sha256?: string;
}
export interface RunCoverage {
  run: string; queue: string[]; status: Validity | 'missing'; sources: string[];
  reasons: string[]; expectedGames: number | null;
}
export interface BalanceDataset {
  schemaVersion: 1; measurements: Measurement[];
  sources: SourceCoverage[]; runs: RunCoverage[]; warnings: string[];
}
export interface DatasetOptions {
  root: string;
  sources?: (string | { path: string; alias: string })[];
  overrides?: SourceOverride[];
  onProgress?: (message: string) => void;
}
interface File { path: string; id: string; run: string; kind: string; entry: SourceCoverage }
interface Metadata { spec: Json; context: MeasurementContext; expected: number | null; reasons: string[]; sources: string[] }
interface Aggregate {
  run: string; key: string; context: MeasurementContext; expected: number | null;
  sources: Set<string>; reasons: Set<string>; validity: Validity; games: number;
  stats: Map<string, { score: Moments; draws: Moments; plies: Moments; activity: Moments }>;
  records: Map<number, string>;
  family?: { records: Map<number, string>; conflict: boolean };
}
/** Released power flags recorded by kp2-r18 and the repaired dt runs in QUEUE. */
export const HISTORIC_RELEASE_FLAGS = Object.freeze({
  markFree: true, freezeUses: 1, hasteCaptures: false, strikePawns: false,
  strikeCaptures: false, mercyAura: true, mercyAuraPawnsTake: true,
  mercyTakesPawns: true, marchUses: 0, holyLightTakesPawns: true,
  holyLightShelter: true, holyLightShelterOrtho: true, darknessMoves: true,
  darknessKingStep2: true, deathTouchReach: true, deathTouchReachOrtho: true,
});
const pendingRuns = new Set(['deal-c4k', 'deal-d4k', 'deal-nosalv2', 'ab-guard-drop-any']);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const object = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);
const hash = (s: string): string => createHash('sha256').update(s).digest('hex');
const cleanRun = (name: string): string => name.replace(/\.gz$/, '').replace(/\.(?:jsonl|summary\.json|report\.(?:json|md)|tournament\.json|experiment\.md|kaggle\.json|log|done|tuned\.json)$/, '').replace(/\.shard\d+of\d+$/, '');
const severity: Record<Validity, number> = { valid: 0, unverified: 1, pending: 2, incomplete: 3, void: 4, conflict: 5 };
function worsen(a: Aggregate, validity: Validity, reason: string): void {
  if (severity[validity] > severity[a.validity]) a.validity = validity;
  a.reasons.add(reason);
}
function context(spec: Json, rec?: Json): MeasurementContext {
  const c = unknownContext();
  const flags = rec?.rules ?? spec.rules;
  if (object(flags)) { c.flags = flags; c.flagsKind = rec?.rulesKey ? 'full' : 'diff'; }
  c.commit = typeof (rec?.commit ?? spec.commit) === 'string' ? (rec?.commit ?? spec.commit) : null;
  c.sourceHash = typeof (rec?.src ?? spec.src) === 'string' ? (rec?.src ?? spec.src) : null;
  c.specKey = typeof rec?.specKey === 'string' ? rec.specKey : null;
  c.pool = typeof (rec?.pool ?? spec.pool ?? spec.backRanks?.pool) === 'string' ? (rec?.pool ?? spec.pool ?? spec.backRanks?.pool) : null;
  c.depth = finite(spec.depth) ? spec.depth : finite(spec.ai?.depth) ? spec.ai.depth : null;
  const sideDepths = [spec.ai?.white?.depth ?? c.depth, spec.ai?.black?.depth ?? c.depth].filter(finite);
  if (new Set(sideDepths).size > 1) c.depth = null;
  c.machine = typeof spec.machine === 'string' ? spec.machine : null;
  c.settings = Object.keys(spec).length ? spec : null;
  c.variantScope = object(spec.variants) && Object.keys(spec.variants).length ? rec ? 'matchup' : 'mixed' : 'none';
  if (rec && Array.isArray(spec.entrants)) {
    const variant = (entrant: unknown): Json => { const name = typeof entrant === 'string' ? /~v([^@]+)(?:@|$)/.exec(entrant)?.[1] : undefined; return name && object(spec.variants?.[name]) ? spec.variants[name] : {}; };
    c.flags = { ...c.flags, ...variant(rec.white), ...variant(rec.black) };
    c.flagsKind = 'diff';
  }
  return c;
}
export function expectedGames(spec: Json): number | null {
  if (Number.isSafeInteger(spec.games) && spec.games >= 0) return spec.games;
  if (!Array.isArray(spec.entrants) || !Number.isSafeInteger(spec.pairs) || spec.pairs < 0) return null;
  const bare = (e: string): string => e.split('@')[0];
  const held = (e: string): string[] => e.startsWith('card:') ? bare(e).slice(5).split('+') : e.startsWith('cards') ? spec.cardPool ?? [...CARD_POOL] : bare(e).split('~')[0] === 'none' ? [] : [bare(e).split('~')[0]];
  const clash = (a: string, b: string): boolean => {
    const name = /~v(.+)$/.exec(bare(a))?.[1];
    if (!name) return false;
    const variant = spec.variants?.[name];
    if (!object(variant)) throw new Error(`Missing variant ${name} in historic spec.`);
    return Object.keys(variant).some(k => (RULE_POWERS as Record<string, readonly string[] | undefined>)[k]?.some(p => held(b).includes(p)));
  };
  let matchups = 0;
  for (let i = 0; i < spec.entrants.length; i++) for (let j = spec.mirror ? i : i + 1; j < spec.entrants.length; j++) {
    const a = spec.entrants[i], b = spec.entrants[j];
    if (typeof a !== 'string' || typeof b !== 'string') throw new Error('Non-string tournament entrant.');
    if (clash(a, b) || clash(b, a)) continue;
    if (spec.anchor !== undefined && a !== spec.anchor && b !== spec.anchor) continue;
    if (spec.mirrorOnly && i !== j) continue;
    matchups++;
  }
  return spec.pairs * matchups * (spec.mirrorOnly ? 1 : 2);
}
function sourceValidity(file: File, c: MeasurementContext): { validity: Validity; reasons: string[] } {
  if (/(?:^|\/)(?:void(?:[-/]|$)|unvalidated(?:[-/]|$))/i.test(file.id)) return { validity: 'void', reasons: ['Source is stored in a void or unvalidated archive.'] };
  if (file.run === 'pb-ab-base') return { validity: 'void', reasons: ['QUEUE: this control mixes the two-guard and one-guard pools.'] };
  if (file.run === 'cards-b1') return { validity: 'void', reasons: ['QUEUE: this run has the mark-slot bug.'] };
  if (/^dt-(?:r0|t2|t3)(?:-d4)?$/.test(file.run)) {
    const missing = Object.entries(HISTORIC_RELEASE_FLAGS).filter(([k, v]) => c.flags?.[k] !== v).map(([k]) => k);
    if (missing.length) return { validity: c.flags && Object.keys(c.flags).length ? 'unverified' : 'void', reasons: [`QUEUE: this source does not prove the recorded kp2-r18 release flags: ${missing.join(', ')}.`] };
  }
  if (/^(?:nnue-g1|nnue-res-d[34])$/.test(file.run) && !c.sourceHash && !c.commit) return { validity: 'void', reasons: ['QUEUE and UNVALIDATED-Q6.md exclude this unstamped inherited Q6 source.'] };
  if (/^(?:q6|train10x)/i.test(file.run) && !c.sourceHash && !c.commit && !/q6-g2/.test(file.id)) return { validity: 'unverified', reasons: ['QUEUE excludes the unstamped inherited Q6 chain. This source has no source stamp.'] };
  return { validity: 'valid', reasons: [] };
}
async function inventory(path: string, alias: string, into: File[]): Promise<void> {
  for (const dirent of (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = join(path, dirent.name), id = `${alias}/${dirent.name}`;
    if (dirent.isDirectory()) { await inventory(child, id, into); continue; }
    if (!dirent.isFile()) {
      into.push({ path: child, id, run: '', kind: 'unsupported', entry: { source: id, run: null, kind: 'unsupported', status: 'unsupported', reasons: ['Not a regular file; links are not followed.'], bytes: 0, records: 0, accepted: 0, duplicates: 0, invalid: 0 } }); continue;
    }
    const name = dirent.name.replace(/\.gz$/, '');
    const kind = name.endsWith('.jsonl') ? 'raw' : name.endsWith('.summary.json') ? 'summary' : name.endsWith('.tournament.json') ? 'spec' : name.endsWith('.kaggle.json') ? 'manifest' : name.endsWith('.report.json') ? 'report-json' : /\.(?:report|experiment)\.md$/.test(name) ? 'report-md' : 'unsupported';
    const run = cleanRun(dirent.name);
    into.push({ path: child, id, run, kind, entry: { source: id, run: kind === 'unsupported' ? null : run, kind, status: kind === 'unsupported' ? 'unsupported' : 'unread', reasons: kind === 'unsupported' ? ['No measurement reader for this file type. The file remains in coverage.'] : [], bytes: (await stat(child)).size, records: 0, accepted: 0, duplicates: 0, invalid: 0 } });
  }
}
async function textFile(file: File): Promise<string> {
  if (file.entry.bytes > 32 * 1024 * 1024) throw new Error('Metadata or report exceeds the 32 MiB reader limit.');
  if (!file.path.endsWith('.gz')) return readFile(file.path, 'utf8');
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of createReadStream(file.path).pipe(createGunzip())) { size += chunk.length; if (size > 32 * 1024 * 1024) throw new Error('Expanded metadata or report exceeds 32 MiB.'); chunks.push(chunk); }
  return Buffer.concat(chunks).toString('utf8');
}
function queueIndex(text: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const line of text.split('\n')) {
    if (!line.startsWith('|')) continue;
    const first = line.split('|')[1]?.replace(/`|\*|\(.*?\)/g, '').trim() ?? '';
    for (const id of first.split(/,\s*/)) {
      if (!/^[a-z][a-z0-9]*(?:[.-][a-zA-Z0-9]+)+$/.test(id) || id === 'rule-set') continue;
      map.set(id, [...(map.get(id) ?? []), line]);
    }
  }
  for (const id of pendingRuns) if (!map.has(id)) map.set(id, []);
  for (const id of ['pb-ab-base', 'cards-b1']) if (!map.has(id)) map.set(id, []);
  return map;
}
function queueMachine(rows: readonly string[]): string | null {
  const machines = rows.map(row => {
    const column = row.split('|')[2] ?? '';
    const named = ['Kaggle', 'M1', 'Mac'].filter(machine => new RegExp(`\\b${machine}\\b`, 'i').test(column));
    return named.length === 1 ? named[0] : null;
  });
  return machines.length && machines[0] !== null && machines.every(machine => machine === machines[0]) ? machines[0] : null;
}
export async function defaultSources(root: string): Promise<{ path: string; alias: string }[]> {
  let primary = join(root, 'sim/out');
  const marker = `${join('.claude', 'worktrees')}/`;
  const at = root.indexOf(marker);
  if (at >= 0) primary = join(root.slice(0, at), 'sim/out');
  const sources = existsSync(primary) ? [{ path: primary, alias: 'sim/out' }] : [];
  const cloud = join(homedir(), 'Library/CloudStorage');
  if (existsSync(cloud)) {
    for (const entry of await readdir(cloud)) {
      if (!entry.startsWith('GoogleDrive-')) continue;
      const backup = join(cloud, entry, 'My Drive/king-down-sim-out');
      if (existsSync(backup)) sources.push({ path: backup, alias: 'backup' });
    }
  }
  return sources;
}
/** Read local evidence only. This does not launch games, fetch records, or replay moves. */
export async function buildDataset(options: DatasetOptions): Promise<BalanceDataset> {
  const root = resolve(options.root), files: File[] = [], warnings: string[] = [];
  const supplied = options.sources ?? await defaultSources(root);
  for (const [i, source] of supplied.entries()) {
    const path = typeof source === 'string' ? resolve(source) : resolve(source.path);
    const alias = typeof source === 'string' ? (i === 0 ? 'sim/out' : `backup${i === 1 ? '' : i}`) : source.alias;
    if (!existsSync(path)) { warnings.push(`Missing source root: ${alias}`); continue; }
    await inventory(path, alias, files);
  }
  let queueText = '';
  try { queueText = await readFile(join(root, 'docs/QUEUE.md'), 'utf8'); } catch { warnings.push('docs/QUEUE.md is missing. Run index is incomplete.'); }
  const queue = queueIndex(queueText), overrides = new Map((options.overrides ?? []).map(x => [x.source, x]));
  const metadata = new Map<string, Metadata>(), reports = new Map<string, { file: File; data: Json | string }>();
  const metaKey = (f: File): string => `${dirname(f.id)}/${f.run}`;
  for (const file of files.filter(f => f.kind !== 'raw' && f.kind !== 'unsupported')) {
    try {
      const text = await textFile(file);
      file.entry.sha256 = hash(text);
      const parsed: Json | string = file.kind === 'report-md' ? text : JSON.parse(text);
      if (file.kind === 'manifest') {
        if (!object(parsed) || parsed.id !== file.run) throw new Error('Launch manifest ID does not match its source name.');
        file.entry.status = 'metadata'; file.entry.reasons.push('Launch manifest only; it does not prove a completed sample.');
      } else if (file.kind === 'spec' || file.kind === 'summary') {
        if (!object(parsed)) throw new Error('Metadata is not an object.');
        const spec = file.kind === 'summary' ? parsed.spec : parsed;
        if (!object(spec)) throw new Error('Source has no run spec.');
        const key = metaKey(file), prior = metadata.get(key);
        if (prior && stable(prior.spec) !== stable(spec)) prior.reasons.push('Source specs disagree.');
        else metadata.set(key, { spec, context: context(spec), expected: expectedGames(spec), sources: [file.id], reasons: [] });
        if (prior) prior.sources.push(file.id);
        file.entry.status = 'metadata'; file.entry.reasons.push('Run settings and completion target; no independent game sample.');
        if (file.kind === 'summary') reports.set(file.id, { file, data: parsed });
      } else { reports.set(file.id, { file, data: object(parsed) ? { games: parsed.games, overall: parsed.overall, rules: parsed.rules } : parsed }); file.entry.status = 'report'; }
    } catch (error) { file.entry.status = 'error'; file.entry.reasons.push(String(error)); }
  }
  const aggregates = new Map<string, Aggregate>();
  const families = new Map<string, { records: Map<number, string>; conflict: boolean }>();
  let rawCount = 0;
  for (const file of files.filter(f => f.kind === 'raw')) {
    const meta = metadata.get(metaKey(file));
    const spec = meta?.spec ?? {};
    const settings = { ...spec }; delete settings.id; delete settings.note; delete settings.games;
    const settingsKey = hash(stable(settings));
    const groups = new Set<Aggregate>(), digest = createHash('sha256');
    let lastByte = 10;
    const input = createReadStream(file.path);
    const stream = file.path.endsWith('.gz') ? input.pipe(createGunzip()) : input;
    input.on('error', error => stream.destroy(error));
    stream.on('data', (chunk: Buffer) => { digest.update(chunk); if (chunk.length) lastByte = chunk[chunk.length - 1]; });
    const override = overrides.get(file.id);
    try {
      for await (const line of createInterface({ input: stream, crlfDelay: Infinity })) {
        if (!line.trim()) continue;
        file.entry.records++;
        let rec: Json;
        try { rec = JSON.parse(line); } catch { file.entry.invalid++; continue; }
        if (!object(rec) || !Number.isSafeInteger(rec.gameId) || rec.gameId < 0 || ![0, .5, 1].includes(rec.result) || !Number.isSafeInteger(rec.plies) || rec.plies < 0 || typeof rec.reason !== 'string') { file.entry.invalid++; continue; }
        const c = context(spec, rec);
        if (override?.commit) c.commit = override.commit;
        if (override?.machine) c.machine = override.machine;
        const queueLines = queue.get(file.run) ?? [];
        if (!c.commit) c.commit = queueLines.map(x => /\b([a-f0-9]{7,40})\b/.exec(x)?.[1]).find((x): x is string => !!x) ?? null;
        if (!c.machine) c.machine = /(?:^|\/)m1\//.test(file.id) ? 'M1' : /mac-runs\//.test(file.id) ? 'Mac' : null;
        const sourceState = sourceValidity(file, c);
        const key = `${file.run}:${hash(stable({ c: { ...c, machine: null, settings: null }, settingsKey, sourceValidity: sourceState.validity })).slice(0, 20)}`;
        const familyKey = Array.isArray(spec.entrants) ? `${file.run}:${settingsKey}:${c.commit ?? '?'}:${c.sourceHash ?? '?'}:${sourceState.validity}` : key;
        let family = families.get(familyKey);
        if (!family) { family = { records: new Map(), conflict: false }; families.set(familyKey, family); }
        let a = aggregates.get(key);
        if (!a) {
          const validity = sourceValidity(file, c);
          a = { run: file.run, key, context: c, expected: meta?.expected ?? null, sources: new Set(), reasons: new Set(validity.reasons), validity: validity.validity, games: 0, stats: new Map(), records: new Map(), family };
          aggregates.set(key, a);
          if (meta?.reasons.length) worsen(a, 'conflict', meta.reasons.join(' '));
        }
        groups.add(a); a.sources.add(file.id);
        if (object(rec.rules) && object(spec.rules) && Object.entries(spec.rules).some(([k, v]) => stable(rec.rules[k]) !== stable(v))) worsen(a, 'conflict', 'Record rules contradict the stored source spec.');
        if (meta) for (const source of meta.sources) a.sources.add(source);
        if (override?.validity) { a.validity = override.validity; a.reasons.add(override.reason); }
        const signature = hash(line);
        const familyPrevious = family.records.get(rec.gameId);
        if (familyPrevious && familyPrevious !== signature) { family.conflict = true; worsen(a, 'conflict', `Game ${rec.gameId} has conflicting records across tournament contexts.`); }
        else family.records.set(rec.gameId, signature);
        const previous = a.records.get(rec.gameId);
        if (previous) {
          if (previous === signature) file.entry.duplicates++;
          else { file.entry.invalid++; worsen(a, 'conflict', `Game ${rec.gameId} has conflicting records in the same context.`); }
          continue;
        }
        a.records.set(rec.gameId, signature); a.games++; file.entry.accepted++;
        const update = (element: string, score: number, uses?: number): void => {
          let row = a!.stats.get(element);
          if (!row) { row = { score: moments(), draws: moments(), plies: moments(), activity: moments() }; a!.stats.set(element, row); }
          addMoment(row.score, score); addMoment(row.draws, rec.result === .5 ? 1 : 0); addMoment(row.plies, rec.plies);
          if (finite(uses)) addMoment(row.activity, uses);
        };
        update('run', rec.result);
        if (typeof rec.white === 'string' && typeof rec.black === 'string') {
          if (rec.white === rec.black) update(`mirror:${rec.white}`, rec.result, Array.isArray(rec.uses) && rec.uses.every(finite) ? (rec.uses[0] + rec.uses[1]) / 2 : undefined);
          else { update(rec.white, rec.result, rec.uses?.[0]); update(rec.black, 1 - rec.result, rec.uses?.[1]); }
        }
      }
      if (lastByte !== 10) { file.entry.invalid++; file.entry.reasons.push('The final record has no newline; run output can be torn.'); }
      file.entry.sha256 = digest.digest('hex');
      file.entry.status = file.entry.invalid ? 'invalid' : file.entry.accepted ? 'used' : file.entry.duplicates ? 'duplicate' : 'incomplete';
      if (file.entry.duplicates) file.entry.reasons.push(`${file.entry.duplicates} identical game records are already counted.`);
      if (file.entry.invalid) for (const a of groups) worsen(a, 'incomplete', `${file.id} has ${file.entry.invalid} malformed or conflicting records.`);
      if (!groups.size) file.entry.reasons.push('No valid completed game record.');
    } catch (error) {
      file.entry.status = 'error'; file.entry.reasons.push(String(error));
      for (const a of groups) worsen(a, 'incomplete', `${file.id} cannot be fully read.`);
    }
    for (const a of groups) {
      if (a.validity === 'void' || a.validity === 'conflict') file.entry.status = a.validity;
      for (const reason of a.reasons) if (!file.entry.reasons.includes(reason)) file.entry.reasons.push(reason);
    }
    rawCount++;
    if (rawCount % 20 === 0) options.onProgress?.(`Read ${rawCount} raw sources of ${files.filter(f => f.kind === 'raw').length}.`);
  }
  const measurements: Measurement[] = [];
  for (const a of aggregates.values()) {
    const queueTarget = (queue.get(a.run) ?? []).map(line => {
      const cell = line.split('|')[4] ?? '';
      return Number(/([\d,]+)\s*$/.exec(cell.trim())?.[1]?.replace(/,/g, '')) || null;
    }).find(n => n !== null) ?? null;
    const target = pendingRuns.has(a.run) && queueTarget !== null ? queueTarget : a.expected;
    const completedRecords = a.family?.records ?? a.records;
    const complete = (n: number): boolean => completedRecords.size === n && [...completedRecords.keys()].every(i => i >= 0 && i < n);
    const completed = target !== null && complete(target);
    if (a.family?.conflict) worsen(a, 'conflict', 'Conflicting records in this tournament source population.');
    const overridden = [...a.sources].some(s => overrides.get(s)?.complete === true);
    if (a.expected !== null && !complete(a.expected)) worsen(a, 'incomplete', `Read ${completedRecords.size} unique games in the source population; source spec expects IDs 0 through ${a.expected - 1}.`);
    if (pendingRuns.has(a.run) && !completed && !overridden && severity[a.validity] <= severity.incomplete) {
      a.validity = 'pending'; a.reasons.add('QUEUE: pending until an authorized source unambiguously proves completion.');
    }
    if (a.expected === null) { a.reasons.add('No completion target in source metadata.'); if (a.validity === 'valid') a.validity = 'unverified'; }
    if (a.validity !== 'valid' && a.validity !== 'unverified') for (const source of a.sources) {
      const entry = files.find(f => f.id === source)?.entry;
      if (entry?.kind === 'raw' && (severity[entry.status as Validity] ?? 0) <= severity[a.validity]) { entry.status = a.validity; entry.reasons = [...new Set([...entry.reasons, ...a.reasons])]; }
    }
    for (const [statsKey, row] of a.stats) {
      const mirror = statsKey.startsWith('mirror:');
      const element = mirror ? statsKey.slice(7) : statsKey;
      for (const [measure, m, unit] of [['whiteScore', row.score, 'fraction'], ['drawRate', row.draws, 'fraction'], ['meanPlies', row.plies, 'plies'], ['activity', row.activity, 'uses per side']] as [Measure, Moments, string][]) {
        if (!m.n) continue;
        const result = estimate(m), blocked = !['valid', 'unverified'].includes(a.validity);
        measurements.push({ id: `${a.key}:${statsKey}:${measure}`, run: a.run, element, version: a.context.commit ?? a.context.sourceHash, context: { ...a.context, population: element === 'run' ? 'run' : mirror ? 'mirror' : 'field' }, measure: measure === 'whiteScore' && element !== 'run' && !mirror ? 'score' : measure, value: blocked ? null : result.value, error: blocked ? null : result.error, errorKind: '95% normal interval over games; army variation is not included', sample: m.n, sampleUnit: 'games', unit, validity: a.validity, reasons: [...a.reasons], sources: [...a.sources], method: 'streamed completed records; identical game IDs and contents counted once within context' });
      }
    }
  }
  importReports(reports, metadata, measurements, overrides);
  const runs: RunCoverage[] = [];
  const ids = new Set([...queue.keys(), ...files.filter(f => f.kind !== 'unsupported').map(f => f.run)]);
  for (const run of [...ids].sort()) {
    const runFiles = files.filter(f => f.run === run && f.kind !== 'unsupported');
    const rows = measurements.filter(m => m.run === run), values = rows.filter(m => m.validity === 'valid' || m.validity === 'unverified');
    const status = !runFiles.length ? ['pb-ab-base', 'cards-b1'].includes(run) ? 'void' : pendingRuns.has(run) ? 'pending' : 'missing' : values.length ? values.some(m => m.validity === 'valid') ? 'valid' : 'unverified' : rows.length ? rows.reduce((a, b) => severity[b.validity] > severity[a] ? b.validity : a, rows[0].validity) : pendingRuns.has(run) ? 'pending' : 'unverified';
    runs.push({ run, queue: queue.get(run) ?? [], status, sources: runFiles.map(f => f.id), reasons: runFiles.length ? [...new Set(rows.flatMap(m => m.reasons))] : ['QUEUE references this run; no source is present.'], expectedGames: [...metadata.values()].find(m => m.spec.id === run)?.expected ?? null });
    if (!runFiles.length) files.push({ path: '', id: `queue:${run}`, run, kind: 'missing', entry: { source: `queue:${run}`, run, kind: 'missing', status, reasons: ['No local source is present.'], bytes: 0, records: 0, accepted: 0, duplicates: 0, invalid: 0 } });
    if (pendingRuns.has(run) && !rows.length) measurements.push({ id: `${run}:pending`, run, element: 'run', version: null, context: unknownContext(), measure: 'whiteScore', value: null, error: null, errorKind: null, sample: null, sampleUnit: 'unknown', unit: 'fraction', validity: 'pending', reasons: ['QUEUE: no complete authorized source.'], sources: runFiles.map(f => f.id), method: 'queue index' });
  }
  for (const row of measurements) if (row.context.machine === null) row.context.machine = queueMachine(queue.get(row.run) ?? []);
  return { schemaVersion: 1, measurements, sources: files.map(f => f.entry), runs, warnings };
}

function importReports(reports: Map<string, { file: File; data: Json | string }>, metadata: Map<string, Metadata>, measurements: Measurement[], overrides: Map<string, SourceOverride>): void {
  const seen = new Map<string, string>();
  const identicalReports = new Map<string, string>();
  for (const { file, data } of reports.values()) {
    const meta = metadata.get(`${dirname(file.id)}/${file.run}`);
    let c = meta?.context ?? unknownContext();
    let sample: number | null = null, target = meta?.expected ?? null;
    let mixedDepth = false;
    if (typeof data === 'string') {
      const counts = /(\d[\d,]*) of (\d[\d,]*) games, depth (\d+)/.exec(data);
      if (counts) { sample = +counts[1].replace(/,/g, ''); target = +counts[2].replace(/,/g, ''); c = { ...c, depth: +counts[3] }; }
      const rules = /Rules: `(\{[^\n]+\})`/.exec(data);
      if (rules) { try { c = { ...c, flags: JSON.parse(rules[1]), flagsKind: 'diff' }; } catch { /* The report is still covered; no rules are inferred. */ } }
      const depths = /\bdepths?\s+(\d+(?:\s*\/\s*\d+)+)/i.exec(data);
      if (depths) { mixedDepth = true; c = { ...c, depth: null, settings: { ...c.settings, depths: depths[1].split('/').map(x => +x.trim()) } }; }
      if (c.depth === null && !mixedDepth) { const depth = /\bDepth (\d+)/i.exec(data); if (depth) c = { ...c, depth: +depth[1] }; }
    } else { sample = finite(data.games) ? data.games : null; if (object(data.rules) && !c.flags) c = { ...c, flags: data.rules, flagsKind: 'diff' }; }
    const override = overrides.get(file.id);
    if (override?.commit) c = { ...c, commit: override.commit };
    if (override?.machine) c = { ...c, machine: override.machine };
    const localRaw = measurements.filter(m => m.run === file.run && m.method.startsWith('streamed') && m.sources.some(source => dirname(source) === dirname(file.id)));
    const contexts = [...new Map(localRaw.map(m => [stable({ ...m.context, population: 'run' }), { ...m.context, population: 'run' as const }])).values()];
    if (contexts.length === 1 && localRaw.some(m => m.sample === sample) && Object.entries(c.flags ?? {}).every(([k, v]) => stable(contexts[0].flags?.[k]) === stable(v))) c = { ...contexts[0], ...c, sourceHash: contexts[0].sourceHash, commit: contexts[0].commit, specKey: contexts[0].specKey, pool: contexts[0].pool };
    const sourceState = sourceValidity(file, c);
    let validity = override?.validity ?? sourceState.validity;
    const reasons = [...sourceState.reasons, ...(meta?.reasons ?? [])];
    if (override) reasons.push(override.reason);
    if (meta?.reasons.length) validity = 'conflict';
    if (target !== null && sample !== null && sample !== target && severity[validity] < severity.incomplete) { validity = 'incomplete'; reasons.push(`Report has ${sample} games; source expects ${target}.`); }
    if (pendingRuns.has(file.run) && !measurements.some(m => m.run === file.run && m.validity === 'valid') && !override?.complete && severity[validity] < severity.void) { validity = 'pending'; reasons.push('QUEUE: pending until an authorized source proves completion.'); }
    for (const row of localRaw) if (severity[row.validity] > severity[validity]) { validity = row.validity; reasons.push(...row.reasons); }
    if (c.variantScope === 'mixed' && validity === 'valid') { validity = 'unverified'; reasons.push('Report pools rule variants; per-matchup effective flags are not proved.'); }
    if (mixedDepth && validity === 'valid') { validity = 'unverified'; reasons.push('Report pools search depths; a single depth is not proved.'); }
    if (target === null && validity === 'valid') { validity = 'unverified'; reasons.push('Report has no proved completion target.'); }
    if (c.machine === null) c = { ...c, machine: /(?:^|\/)m1\//.test(file.id) ? 'M1' : /mac-runs\//.test(file.id) ? 'Mac' : null };
    const copyKey = stable({ run: file.run, hash: file.entry.sha256, context: { ...c, machine: null }, validity });
    const original = identicalReports.get(copyKey);
    if (original) {
      file.entry.status = 'duplicate'; file.entry.reasons.push(`Byte-identical report and context are already covered by ${original}.`);
      for (const row of measurements) if (row.sources.includes(original)) row.sources = [...new Set([...row.sources, file.id])];
      continue;
    }
    identicalReports.set(copyKey, file.id);
    const raw = measurements.filter(m => m.run === file.run && m.method.startsWith('streamed') && m.validity === validity);
    const add = (element: string, measure: Measure, cell: { value: number | null; error: number | null; bound?: 'lessThan' | 'greaterThan' }, unit: string, n = sample, errorKind: string | null = null, reference?: string, calibration?: Measurement['calibration']): void => {
      if (cell.value === null) return;
      const blocked = !['valid', 'unverified'].includes(validity);
      const sourceIds = [file.id, ...(meta?.sources ?? [])];
      const existing = raw.find(m => m.sample === n && m.sources.some(source => dirname(source) === dirname(file.id)) && m.context.commit === c.commit && m.context.sourceHash === c.sourceHash && m.context.specKey === c.specKey && m.context.pool === c.pool && stable(m.context.settings) === stable(c.settings) && m.context.variantScope !== 'matchup' && m.element === element && m.measure === measure && (m.context.depth === c.depth || c.depth === null) && (stable(m.context.flags) === stable(c.flags) || c.flagsKind === 'diff' && Object.entries(c.flags ?? {}).every(([k, v]) => stable(m.context.flags?.[k]) === stable(v))));
      // Reports are views of the same games. Use a report interval, never a second sample.
      if (existing && !reference) {
        existing.sources = [...new Set([...existing.sources, ...sourceIds])];
        if (cell.error !== null && errorKind?.includes('armies')) { existing.error = blocked ? null : cell.error; existing.errorKind = errorKind; existing.method += '; interval from stored report'; }
        return;
      }
      const key = stable({ run: file.run, element, measure, c: { ...c, machine: null }, reference, validity, sourceGroup: dirname(file.id) });
      const previous = seen.get(key);
      const fingerprint = stable({ cell, n });
      if (previous === fingerprint) { file.entry.status = 'duplicate'; file.entry.reasons.push('This report measurement is already covered by an identical source.'); return; }
      if (previous) { file.entry.status = 'conflict'; file.entry.reasons.push('Reports disagree for the same run, element and context.'); for (const m of measurements.filter(m => m.id === `report:${hash(key).slice(0, 24)}`)) { m.validity = 'conflict'; m.value = null; m.error = null; m.reasons.push('Stored reports disagree.'); } return; }
      seen.set(key, fingerprint);
      measurements.push({ id: `report:${hash(key).slice(0, 24)}`, run: file.run, element, version: c.commit ?? c.sourceHash, context: { ...c, population: 'report' }, measure, value: blocked ? null : cell.value, error: blocked ? null : cell.error, errorKind, sample: n, sampleUnit: 'games', unit, validity, reasons: [...reasons], sources: sourceIds, method: 'stored report; not an independent sample from raw games of this run', ...(cell.bound ? { bound: cell.bound } : {}), ...(reference ? { reference } : {}), ...(calibration ? { calibration } : {}) });
      file.entry.accepted++;
    };
    if (typeof data !== 'string') {
      const g = object(data.overall) ? data.overall : data;
      const score = finite(g.score) ? g.score : g.whiteScore;
      const ci = Array.isArray(g.ci) && finite(score) ? Math.max(score - g.ci[0], g.ci[1] - score) : null;
      add('run', 'whiteScore', { value: finite(score) ? score : null, error: finite(ci) ? ci : null }, 'fraction', sample, ci === null ? null : '95% interval as stored in report');
      const draws = finite(g.drawRate) ? g.drawRate : finite(g.draws) && sample ? g.draws / sample : null;
      add('run', 'drawRate', { value: draws, error: null }, 'fraction');
      add('run', 'meanPlies', { value: finite(g.meanPlies) ? g.meanPlies : null, error: finite(g.sdPlies) && sample ? 1.96 * g.sdPlies / Math.sqrt(sample) : null }, 'plies', sample, '95% normal interval over games as stored in report');
      if (object(g.utilisation)) for (const [piece, value] of Object.entries(g.utilisation)) if (finite(value)) add(piece, 'activity', { value, error: null }, 'report utilisation');
    } else {
      const scale = /(?:at|=)\s*(\d+(?:\.\d+)?)\s*(?:±\s*(\d+)\s*)?Elo per pawn/i.exec(data) ?? /One pawn = (\d+(?:\.\d+)?)(?: ± (\d+(?:\.\d+)?))? Elo/i.exec(data);
      const scaleRelative = /calibration is itself ±(\d+)%/i.exec(data);
      const calibration = scale ? { eloPerPawn: +scale[1], relativeError: scaleRelative ? +scaleRelative[1] / 100 : scale[2] ? +scale[2] / +scale[1] : null } : undefined;
      const tables = markdownTables(data);
      const armSamples = new Map<string, number>();
      for (const table of tables) {
        const arm = table.headers.findIndex(h => h.toLowerCase() === 'arm');
        const games = table.headers.findIndex(h => h.toLowerCase() === 'games');
        if (arm >= 0 && games >= 0) for (const row of table.rows) { const n = numericCell(row[games] ?? '').value; if (n !== null) armSamples.set(row[arm], n); }
      }
      for (const table of tables) {
        const h = table.headers.map(x => x.toLowerCase().replace(/\*|`/g, ''));
        const col = (name: string): number => h.indexOf(name);
        const isWorth = /implied values/i.test(table.heading);
        const anchor = /^Against (.+)/.exec(table.heading)?.[1];
        for (const row of table.rows) {
          const element = row[0]?.replace(/\*|`/g, '').trim(); if (!element) continue;
          const gamesCol = col('games'), pairsCol = col('pairs');
          const n = gamesCol >= 0 ? numericCell(row[gamesCol] ?? '').value : pairsCol >= 0 ? (numericCell(row[pairsCol] ?? '').value ?? 0) * (meta?.spec.mirrorOnly ? 1 : 2) : sample;
          const get = (i: number, percent = false, errorAt = -1) => {
            const cell = numericCell(row[i] ?? '');
            if (cell.error === null && errorAt >= 0) cell.error = numericCell(row[errorAt] ?? '').value;
            if (percent) { if (cell.value !== null) cell.value /= 100; if (cell.error !== null) cell.error /= 100; }
            return cell;
          };
          if (isWorth) {
            const i = h.findIndex(x => x.includes('implied value'));
            if (i >= 0) add(element.replace(/\s*\(.*/, ''), 'pawnWorth', get(i), 'pawns', armSamples.get(element.replace(/\s*\(.*/, '')) ?? n, 'report ±95%; calibration error is separate', 'knight substitution', calibration);
            continue;
          }
          if (col('power') === 0 && col('score vs field') >= 0) {
            const i = col('score vs field'), err = h.indexOf('±95% armies', i);
            add(element, 'score', get(i, true, err >= 0 ? err : i + 1), 'fraction', n, err >= 0 ? '95% armies interval from stored report' : '95% game interval from stored report');
            const d = col('draws'); if (d >= 0) add(element, 'drawRate', get(d, true), 'fraction', n);
            const p = col('plies'); if (p >= 0) add(element, 'meanPlies', get(p), 'plies', n);
            const u = col('used / game'); if (u >= 0) add(element, 'activity', get(u), 'uses per side', n);
          }
          if (col('white %') >= 0) {
            const i = col('white %'); add(element, 'whiteScore', get(i, true, i + 1), 'fraction', n, '95% pairs interval from stored report');
            const d = col('draws %'); if (d >= 0) add(element, 'drawRate', get(d, true, d + 1), 'fraction', n, '95% pairs interval from stored report');
            const t = col('turns'); if (t >= 0) add(element, 'meanTurns', get(t, false, t + 1), 'turns', n, '95% pairs interval from stored report');
          }
          if (anchor && col('pawns') >= 0) {
            const i = col('pawns'); add(element, 'pawnWorth', get(i, false, i + 1), 'pawns', n, 'report ±95%; calibration error is separate', anchor, calibration);
            const e = col('elo'); if (e >= 0) add(element, 'elo', get(e), 'Elo', n, null, anchor);
          }
        }
      }
    }
    if (!file.entry.accepted && file.entry.status !== 'duplicate' && file.entry.status !== 'conflict') { file.entry.status = 'summary-only'; file.entry.reasons.push('No additional supported measurement, or this is a view of records already counted.'); }
    if (['void', 'pending', 'incomplete', 'conflict'].includes(validity)) { file.entry.status = validity; file.entry.reasons.push(...reasons); }
  }
}

export function coverageMarkdown(dataset: BalanceDataset): string {
  const counts: Record<string, number> = {};
  for (const source of dataset.sources) counts[source.status] = (counts[source.status] ?? 0) + 1;
  const lines = ['# Balance source coverage', '', 'Local source snapshot. No games run. No moves replayed.', '', `${dataset.sources.length} sources; ${dataset.runs.length} run IDs; ${dataset.measurements.length} measurements.`, '', '| Source status | Count |', '|---|---:|', ...Object.entries(counts).sort().map(([s, n]) => `| ${s} | ${n} |`), '', 'An empty rule diff is historical and incomplete. It does not name current rules. Game intervals do not include army variation. Stored report views are not independent samples. Missing errors stay unknown.', '', '## Runs', '', '| Run | Status | Expected games | Sources | Reason |', '|---|---|---:|---:|---|'];
  const escape = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const run of dataset.runs) lines.push(`| ${run.run} | ${run.status} | ${run.expectedGames ?? '?'} | ${run.sources.length} | ${escape(run.reasons.join(' '))} |`);
  lines.push('', 'The `sources` array in `measurements.json` is the full per-file ledger. It gives the status, reason, record count, counted records, duplicate count and content hash for each source.');
  if (dataset.warnings.length) lines.push('', '## Gaps', '', ...dataset.warnings.map(w => `- ${w}`));
  return `${lines.join('\n')}\n`;
}
export async function writeDataset(dataset: BalanceDataset, output: string): Promise<void> {
  await mkdir(output, { recursive: true });
  const array = (rows: unknown[]): string => `[\n${rows.map(row => `    ${JSON.stringify(row)}`).join(',\n')}\n  ]`;
  const text = `{\n  \"schemaVersion\": ${dataset.schemaVersion},\n  \"measurements\": ${array(dataset.measurements)},\n  \"sources\": ${array(dataset.sources)},\n  \"runs\": ${array(dataset.runs)},\n  \"warnings\": ${JSON.stringify(dataset.warnings)}\n}\n`;
  await writeFile(join(output, 'measurements.json'), text);
  await writeFile(join(output, 'coverage.md'), coverageMarkdown(dataset));
}
