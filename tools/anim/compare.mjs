/**
 * Compare a candidate bank with the shipped bank it rebuilds.
 *
 *   node tools/anim/compare.mjs <candidate bank.json> --catalog <frozen catalog> [--id white-turn-SE-S]
 *
 * The shipped bank comes from the frozen catalog entry with the same character, army and id. The report matches
 * frames by time, so a shared key must have zero difference, and an inferred frame reports its distance from the
 * shipped pixels. A difference is evidence for review, not a pass or fail of its own.
 */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { defaultCatalog } from './geometry.mjs';

const exec = promisify(execFile);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function pixels(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

export async function compare(candidate, { catalog = process.env.KINGDOWN_CATALOG ?? defaultCatalog, id } = {}) {
  const bankPath = candidate.endsWith('.json') ? resolve(candidate) : join(resolve(candidate), 'bank.json');
  const bank = JSON.parse(await readFile(bankPath));
  const catalogBytes = await readFile(join(catalog, 'manifest.json'));
  const entries = JSON.parse(catalogBytes).entries ?? [];
  const entry = entries.find(row => row.character === bank.character && row.army === bank.army && row.id === (id ?? bank.id));
  if (!entry) throw Error(`No shipped bank ${id ?? bank.id} for ${bank.character}/${bank.army} in ${catalog}`);
  const shipped = JSON.parse(await readFile(join(catalog, entry.manifest)));
  const folder = dirname(bankPath);
  const records = [];
  for (const frame of bank.frames) {
    const match = shipped.frames.reduce((best, other) => Math.abs(other.timeMs - frame.timeMs) < Math.abs(best.timeMs - frame.timeMs) ? other : best);
    const left = await pixels(join(folder, frame.url));
    const right = await pixels(resolve(dirname(join(catalog, entry.manifest)), match.url));
    if (left.width !== right.width || left.height !== right.height) throw Error(`Canvas differs at ${frame.timeMs} ms: ${left.width}x${left.height} against ${right.width}x${right.height}`);
    let absolute = 0, alpha = 0, max = 0, changed = 0;
    for (let index = 0; index < left.data.length; index += 4) {
      const deltaAlpha = Math.abs(left.data[index + 3] - right.data[index + 3]);
      alpha += deltaAlpha;
      for (let channel = 0; channel < 4; channel++) {
        const delta = Math.abs(left.data[index + channel] - right.data[index + channel]);
        absolute += delta;
        if (delta > max) max = delta;
        if (delta > 1) changed++;
      }
    }
    const samples = left.data.length / 4;
    records.push({
      timeMs: frame.timeMs, method: frame.method, shippedSha256: match.sha256, candidateSha256: frame.sha256,
      candidateFile: join(folder, frame.url), shippedFile: resolve(dirname(join(catalog, entry.manifest)), match.url),
      identicalPixels: max === 0, meanAbsoluteRgba255: Math.round((absolute / (samples * 4)) * 1000) / 1000,
      meanAlpha255: Math.round((alpha / samples) * 1000) / 1000, maxAbsolute255: max,
      changedChannels: changed, changedFraction: Math.round((changed / (samples * 4)) * 10000) / 10000,
      shippedTimeMs: match.timeMs,
    });
  }
  const report = {
    id: bank.id, character: bank.character, army: bank.army, catalog: resolve(catalog), catalogSha256: digest(catalogBytes),
    shippedBankSha256: entry.sha256, shippedFrames: shipped.frames.length, candidateFrames: bank.frames.length,
    keys: records.filter(record => record.method !== 'rife').every(record => record.identicalPixels),
    records,
  };
  const reportPath = join(folder, 'comparison.json');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const sheet = join(folder, 'comparison-sheet.png');
  const python = fileURLToPath(new URL('./compare_sheet.py', import.meta.url));
  if (existsSync(python)) await exec(process.env.KINGDOWN_PREVIEW_PYTHON ?? 'python3', [python, '--report', reportPath, '--out', sheet]).catch(() => {});
  return { ...report, reportPath, sheet: existsSync(sheet) ? sheet : null };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), options = {};
  let candidate = null;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--catalog') options.catalog = args[++index];
    else if (args[index] === '--id') options.id = args[++index];
    else if (args[index].startsWith('--')) throw Error(`Unknown option ${args[index]}`);
    else candidate = args[index];
  }
  if (!candidate) { console.error('Use: compare.mjs <candidate> [--catalog <dir>] [--id <bank id>]'); process.exitCode = 1; }
  else compare(candidate, options).then(result => console.log(JSON.stringify({ report: result.reportPath, keysIdentical: result.keys, records: result.records }, null, 2))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
