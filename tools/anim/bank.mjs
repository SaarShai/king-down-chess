/**
 * Make one candidate animation bank from authored keys.
 *
 *   node tools/anim/bank.mjs make --character pawn --army white --kind turn --facing SE-S --keys <dir>
 *
 * The keys are registered to the locked geometry, in-betweens come from the retained alpha RIFE, the gates run, and
 * the command writes a candidate bank, per-frame provenance and board-size previews outside git.
 */
import { execFile } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { edgeFor, loadGeometryFile, resolveGeometry, root, sourcesDir, defaultManifest, defaultCatalog } from './geometry.mjs';
import { encodeFrame, ghostScore, matteFringe, measureFrame, readFrame, registerFrame } from './frames.mjs';
import { ghostLimit, runGates } from './gates.mjs';
import { chooseMachine, interpolate } from './infer.mjs';
import { describePlan, midpointPlan, planTiming, timeOf } from './plan.mjs';
import { matchesRest, movementGeometry, padRest } from './movement.mjs';

const exec = promisify(execFile);
export const KINDS = ['idle', 'turn', 'attack', 'movement'];
export const animationsRoot = process.env.KINGDOWN_ANIM_OUT ?? resolve(root, '../../../../anim-out');
const pad = index => String(index).padStart(3, '0');

export async function listKeys(keys) {
  const info = await stat(keys).catch(() => null);
  if (!info) throw Error(`Key frames not found: ${keys}`);
  const files = info.isDirectory()
    ? (await readdir(keys)).filter(name => name.toLowerCase().endsWith('.png')).sort().map(name => join(keys, name))
    : keys.split(',').map(path => resolve(path.trim()));
  if (!files.length) throw Error(`No PNG key frames in ${keys}`);
  return files;
}

export async function readTiming(value) {
  if (!value) return undefined;
  if (typeof value === 'object') return value;
  const bytes = await readFile(resolve(value));
  return JSON.parse(bytes);
}

/** Remove an earlier candidate in this folder, but never a folder that holds other work. */
async function cleanOutput(output) {
  const info = await stat(output).catch(() => null);
  if (!info) return;
  if (!info.isDirectory()) throw Error(`Output is not a folder: ${output}`);
  const names = await readdir(output);
  const allowed = new Set(['frames', 'previews', 'rife', 'bank.json', 'gates.json', 'provenance.json', 'comparison.json']);
  const foreign = names.filter(name => !allowed.has(name));
  if (foreign.length) throw Error(`Output folder holds other files (${foreign.slice(0, 3).join(', ')}); choose a new --output`);
  for (const name of names) await rm(join(output, name), { recursive: true, force: true });
}

export function defaultOutput(character, army, id) {
  return join(animationsRoot, character, army, id);
}

/** Make a candidate bank. Returns its path and the gate report. */
export async function makeBank(options) {
  const { character, army, kind } = options;
  if (options.ghostRepair !== undefined && options.ghostRepair !== 'hold') throw Error('--ghost-repair must be hold');
  if (!character || !army) throw Error('make needs --character and --army');
  if (!KINDS.includes(kind)) throw Error(`--kind must be one of ${KINDS.join(', ')}`);
  const edge = edgeFor(kind, options.facing);
  const id = options.id ?? `${army}-${kind}-${options.facing}`;
  const output = resolve(options.output ?? defaultOutput(character, army, id));
  const framesDir = join(output, 'frames'), previewDir = join(output, 'previews');

  const geometry = options.geometryRecord
    ?? (options.geometry ?? process.env.KINGDOWN_BANK_GEOMETRY ? await loadGeometryFile(resolve(options.geometry ?? process.env.KINGDOWN_BANK_GEOMETRY)) : await resolveGeometry({
      character, army,
      manifest: options.manifest ?? process.env.KINGDOWN_RUNTIME_MANIFEST ?? defaultManifest,
      catalog: options.catalog ?? process.env.KINGDOWN_CATALOG ?? defaultCatalog,
      sources: options.sources ?? sourcesDir,
    }));
  if (geometry.character !== character || geometry.army !== army) throw Error(`Geometry is for ${geometry.character}/${geometry.army}, not ${character}/${army}`);

  const keys = await listKeys(options.keys);
  const plan = planTiming(await readTiming(options.timing), keys.length, { frameMs: options.frameMs, durationMs: options.durationMs });
  if (plan.hold && kind !== 'idle') throw Error('A one-key bank is a hold; use at least two keys for a turn, attack or movement');
  const sources = kind === 'movement' ? await Promise.all(keys.map(readFrame)) : null;
  const movement = sources ? await movementGeometry(geometry, sources, edge.facing) : null;
  const placement = movement ? { ...geometry, ...movement, pivot: [movement.footCenterX, movement.baseline] } : geometry;

  await cleanOutput(output);
  await mkdir(framesDir, { recursive: true });

  const registered = [];
  for (let position = 0; position < keys.length; position++) {
    const source = sources?.[position] ?? await readFrame(keys[position]);
    const index = plan.keyIndexes[position];
    const placed = movement && source.sha256 === movement.rest.sha256
      ? { frame: padRest(movement), transform: { scale: 1, dx: movement.offset[0], dy: movement.offset[1], identity: false } }
      : await registerFrame(source, placement);
    const bytes = placed.transform.identity ? source.bytes : await encodeFrame(placed.frame);
    const file = `frames/${pad(index)}.png`;
    await writeFile(join(output, file), bytes);
    registered.push({ index, timeMs: timeOf(index, plan), method: 'authored', sources: [source.sha256], file, sourcePath: keys[position], transform: placed.transform });
  }

  const midpoints = plan.hold ? [] : midpointPlan(plan.keyIndexes);
  const byIndex = new Map(registered.map(frame => [frame.index, frame]));
  const inferCommand = options.infer ?? process.env.KINGDOWN_BANK_INFER;
  let machine = null, rifeReport = null;
  if (midpoints.length) {
    machine = inferCommand ? { machine: 'custom command' } : options.machineInfo ?? await chooseMachine({ prefer: options.machine ?? 'auto' });
    const result = await interpolate({
      work: output,
      machine,
      inferCommand,
      frames: [
        ...registered.map(frame => ({ index: frame.index, input: join(output, frame.file) })),
        ...midpoints.map(point => ({ index: point.index, left: point.left, right: point.right, t: point.t })),
      ],
    });
    rifeReport = result.report;
    for (const point of midpoints) byIndex.set(point.index, { index: point.index, timeMs: timeOf(point.index, plan), method: 'rife', sources: [point.left, point.right], file: `frames/${pad(point.index)}.png` });
    for (const point of midpoints) {
      await copyFile(join(output, 'rife', 'out', `${pad(point.index)}.png`), join(output, byIndex.get(point.index).file));
    }
  }

  if (plan.hold) for (let index = 1; index < plan.frameCount; index++) {
    const origin = byIndex.get(0);
    const file = `frames/${pad(index)}.png`;
    await copyFile(join(output, origin.file), join(output, file));
    byIndex.set(index, { index, timeMs: timeOf(index, plan), method: 'hold', sources: [0], file });
  }

  const frames = [];
  for (let index = 0; index < plan.frameCount; index++) {
    const frame = byIndex.get(index);
    if (!frame) throw Error(`Frame ${index} was not produced`);
    const decoded = await readFrame(join(output, frame.file));
    const measure = measureFrame(decoded);
    const restMatch = movement && frame.method === 'authored' && frame.sources[0] === movement.rest.sha256 ? matchesRest(decoded, movement.rest, movement.offset) : undefined;
    frames.push({ ...frame, sha256: decoded.sha256, metadata: decoded.metadata, measure, fringe: matteFringe(decoded, measure), ghost: ghostScore(decoded), restMatch, timeMs: timeOf(index, plan) });
  }
  const hashByIndex = new Map(frames.map(frame => [frame.index, frame.sha256]));
  if (options.ghostRepair === 'hold') {
    const limit = ghostLimit(frames);
    const clean = frames.filter(frame => frame.method === 'authored' || frame.ghost <= limit);
    for (let index = 0; index < frames.length; index++) {
      const frame = frames[index];
      if (frame.method !== 'rife' || frame.ghost <= limit) continue;
      const source = clean.reduce((best, candidate) => Math.abs(candidate.index - frame.index) < Math.abs(best.index - frame.index) ? candidate : best);
      await copyFile(join(output, source.file), join(output, frame.file));
      frames[index] = {
        index: frame.index, file: frame.file, timeMs: frame.timeMs, method: 'hold', sources: [source.index], transform: null,
        sha256: source.sha256, metadata: source.metadata, measure: source.measure, fringe: source.fringe, ghost: source.ghost,
      };
    }
  }
  for (const frame of frames) {
    frame.sources = frame.method === 'hold' ? frame.sources.map(index => hashByIndex.get(index)) : frame.method === 'authored' ? frame.sources : frame.sources.map(index => hashByIndex.get(index));
    if (frame.sources.some(source => !source)) throw Error(`Frame ${frame.index} has a missing source frame`);
  }

  const bank = {
    schemaVersion: 1, id, character, army, kind, ...edge, ...(movement ? { direction: edge.facing } : {}), status: 'candidate',
    durationMs: plan.durationMs, frameMs: plan.frameMs, canvasSize: movement?.canvas ?? geometry.canvas, times: frames.map(frame => frame.timeMs),
    pivot: movement?.pivot ?? geometry.pivot, bodyHeightPx: movement?.registrationHeightPx ?? geometry.bodyHeightPx, boardScale: geometry.boardScale ?? null,
    frames: frames.map(frame => ({ url: frame.file, timeMs: frame.timeMs, sha256: frame.sha256, method: frame.method, sources: frame.sources })),
    previewGeometry: { pivot: movement?.pivot ?? geometry.pivot, bodyHeightPx: movement?.registrationHeightPx ?? geometry.bodyHeightPx },
    geometry: { authority: geometry.authority, canvas: geometry.canvas, pivot: geometry.pivot, bodyHeightPx: geometry.bodyHeightPx },
    provenance: {
      generator: 'tools/anim/bank.mjs', timing: describePlan(plan),
      keys: registered.map(frame => ({ index: frame.index, file: basename(frame.sourcePath), sha256: frame.sources[0], transform: frame.transform })),
      rife: machine ? { machine: machine.machine, runtimeManifestSha256: rifeReport?.runtimeManifestSha256 ?? null, inferred: midpoints.length } : null,
    },
  };

  const endpoints = options.geometryRecord?.endpoints ?? geometry.endpoints ?? {};
  const gates = runGates({ bank, frames, geometry, endpoints, plan, movement });
  await writeFile(join(output, 'gates.json'), `${JSON.stringify(gates, null, 2)}\n`);
  await writeFile(join(output, 'provenance.json'), `${JSON.stringify({ id, character, army, kind, frames: frames.map(frame => ({ index: frame.index, timeMs: frame.timeMs, sha256: frame.sha256, method: frame.method, sources: frame.sources, transform: frame.transform ?? null })), geometry: bank.geometry, rife: bank.provenance.rife }, null, 2)}\n`);

  const previews = [];
  const preview = options.preview !== undefined ? options.preview : process.env.KINGDOWN_BANK_PREVIEW !== 'off';
  if (preview) {
    await mkdir(previewDir, { recursive: true });
    const script = fileURLToPath(new URL('./preview.py', import.meta.url));
    const previewBank = join(output, 'bank.preview.json');
    await writeFile(previewBank, `${JSON.stringify(bank)}\n`);
    try {
      await exec(process.env.KINGDOWN_PREVIEW_PYTHON ?? 'python3', [script, '--frames', framesDir, '--bank', previewBank, '--out', previewDir], { cwd: root });
      for (const name of ['light', 'dark', 'checker', 'board']) previews.push(`previews/preview-${name}.gif`);
    } catch (error) {
      throw Error(`Preview failed (python3 with Pillow is required): ${error.stderr?.trim() || error.message}`);
    }
    await rm(previewBank);
  }
  bank.previews = previews;
  bank.gates = gates.status;
  const bankPath = join(output, 'bank.json');
  await writeFile(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
  if (gates.status !== 'pass') throw Object.assign(Error(`Gates failed for ${id}:\n${gates.failing.map(line => `  - ${line}`).join('\n')}`), { gates, bankPath });
  return { candidate: bankPath, gates: gates.status, frames: frames.length, durationMs: plan.durationMs, machine: machine?.machine ?? null, previews, output };
}

const values = ['character', 'army', 'kind', 'facing', 'keys', 'timing', 'output', 'id', 'geometry', 'manifest', 'catalog', 'sources', 'machine', 'infer', 'frame-ms', 'duration-ms', 'ghost-repair'];
const camel = name => name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

export async function main(argv = process.argv.slice(2)) {
  const [command, ...rest] = argv;
  if (command !== 'make') throw Error('Use: bank.mjs make --character <c> --army <a> --kind <k> --facing <F> --keys <dir> [--timing <json>] [--output <dir>]');
  const options = {};
  for (let index = 0; index < rest.length; index++) {
    const name = rest[index].replace(/^--/, '');
    if (name === 'no-preview') { options.preview = false; continue; }
    if (!values.includes(name)) throw Error(`Unknown option --${name}`);
    const value = rest[++index];
    if (value == null) throw Error(`--${name} needs a value`);
    options[camel(name)] = name === 'frame-ms' || name === 'duration-ms' ? Number(value) : value;
  }
  const result = await makeBank(options);
  console.log(JSON.stringify(result));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    if (error.gates) console.error(JSON.stringify({ gates: error.gates.status, failing: error.gates.failing }));
    process.exitCode = 1;
  });
}
