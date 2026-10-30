/**
 * Promote an accepted candidate bank into the frozen catalog that tools/build-character-runtime.mjs reads.
 *
 *   node tools/anim/promote.mjs <candidate folder or bank.json> [--catalog <frozen catalog>] [--dry-run]
 *
 * Promotion verifies the candidate, then writes under the catalog's own lock. It does not re-pin
 * runtime-selection.json: the owner re-pins the selection after review, so the shipped build stays unchanged.
 */
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { defaultCatalog, defaultManifest, resolveGeometry } from './geometry.mjs';
import { readFrame, sha256 } from './frames.mjs';

const exec = promisify(execFile);
const script = fileURLToPath(new URL('./publish_bank.py', import.meta.url));

export async function promote(candidate, { catalog = process.env.KINGDOWN_CATALOG ?? defaultCatalog, manifest = process.env.KINGDOWN_RUNTIME_MANIFEST ?? defaultManifest, dryRun = false } = {}) {
  const given = resolve(candidate);
  const bankPath = given.endsWith('.json') ? given : join(given, 'bank.json');
  const folder = dirname(bankPath);
  if (!existsSync(bankPath)) throw Error(`No bank.json in ${candidate}`);
  const bankBytes = await readFile(bankPath), bank = JSON.parse(bankBytes);
  if (bank.status !== 'candidate') throw Error(`Bank status is ${bank.status}; promote takes a candidate`);
  const gatesPath = join(folder, 'gates.json');
  if (!existsSync(gatesPath)) throw Error(`No gates.json next to ${bankPath}; rebuild with bank.mjs make`);
  const gates = JSON.parse(await readFile(gatesPath));
  if (gates.status !== 'pass') throw Error(`Gates did not pass; promote needs a green candidate (${gates.failing?.join('; ') ?? 'no detail'})`);
  for (const check of ['rgba', 'exterior', 'matte-halo', 'geometry', 'endpoints', 'timing', 'provenance']) {
    if (!gates.checks?.some(entry => entry.name === check && entry.ok)) throw Error(`Gate ${check} did not pass; rebuild the candidate`);
  }
  const current = await resolveGeometry({ character: bank.character, army: bank.army, catalog, manifest });
  if (bank.geometry) {
    const locked = bank.geometry;
    if (JSON.stringify(locked.pivot) !== JSON.stringify(current.pivot) || JSON.stringify(locked.canvas) !== JSON.stringify(current.canvas) || Math.abs(locked.bodyHeightPx - current.bodyHeightPx) > 1e-6) {
      throw Error(`Locked geometry changed for ${bank.character}/${bank.army}; rebuild the candidate against the current authority`);
    }
  }
  if (bank.kind === 'movement') {
    const authority = bank.geometry?.authority;
    const bytes = await readFile(manifest);
    if (authority?.kind !== 'runtime-manifest' || sha256(bytes) !== authority.sha256) throw Error('Movement runtime manifest changed; rebuild the candidate');
    const runtime = JSON.parse(bytes), scale = runtime.sourceToRuntimeScale;
    const source = bank.provenance?.keys?.[0], offset = [source?.transform?.dx, source?.transform?.dy];
    const rests = runtime.banks.filter(rest => rest.character === bank.character && rest.army === bank.army && [[rest.frames?.[0], rest.kind === 'turn' ? rest.from : rest.facing], [rest.frames?.at(-1), rest.kind === 'turn' ? rest.to : rest.facing]].some(([frame, facing]) => facing === bank.facing && frame?.sourceSha256 === source?.sha256));
    if (!rests.length || !Number.isFinite(scale) || scale <= 0 || offset.some(n => !Number.isFinite(n)) || rests.some(rest => rest.boardScale != null || rest.registrationHeightPx / scale !== bank.bodyHeightPx || rest.pivot.some((n, i) => n / scale + offset[i] !== bank.pivot[i]))) throw Error('Movement facing-rest transform changed; rebuild the candidate');
  }
  for (const frame of bank.frames) {
    const path = join(folder, frame.url);
    const decoded = await readFrame(path);
    if (decoded.sha256 !== frame.sha256) throw Error(`Frame hash mismatch: ${frame.url}`);
  }
  const entry = { id: bank.id, character: bank.character, army: bank.army, kind: bank.kind === 'movement' ? 'movement-study' : bank.kind, action: null, direction: bank.facing, from: bank.from, to: bank.to };
  if (dryRun) return { dryRun: true, catalog: resolve(catalog), entry, frames: bank.frames.length };

  const staging = await mkdtemp(join(folder, '.promote-'));
  try {
    await writeFile(join(staging, 'bank.json'), bankBytes);
    await writeFile(join(staging, 'entry.json'), `${JSON.stringify(entry, null, 2)}\n`);
    const { stdout } = await exec(process.env.KINGDOWN_PUBLISH_PYTHON ?? 'python3', [
      script, '--catalog', resolve(catalog), '--bank', bankPath, '--frames', folder, '--entry', join(staging, 'entry.json'),
    ], { cwd: dirname(script) });
    const result = JSON.parse(stdout);
    return { ...result, next: `Re-pin docs/specs/character-animation-samples/runtime-selection.json, then run: node tools/build-character-runtime.mjs --source ${resolve(catalog)}` };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), options = {};
  let candidate = null;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--dry-run') options.dryRun = true;
    else if (args[index] === '--catalog') options.catalog = args[++index];
    else if (args[index] === '--manifest') options.manifest = args[++index];
    else if (args[index].startsWith('--')) throw Error(`Unknown option ${args[index]}`);
    else candidate = args[index];
  }
  if (!candidate) { console.error('Use: promote.mjs <candidate folder or bank.json> [--catalog <dir>] [--dry-run]'); process.exitCode = 1; }
  else promote(candidate, options)
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
