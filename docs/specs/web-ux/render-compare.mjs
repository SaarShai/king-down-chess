// Compares the renders of two capture runs (capture.mjs) pixel by pixel, for a proof of no visible change
// (after-redesign spec, §4.4).
//
//   node docs/specs/web-ux/render-compare.mjs <folder A> <folder B> [threshold]
//   node docs/specs/web-ux/render-compare.mjs --against <revision> [--samples 00,W1,…] [--out <folder>] [--threshold <n>]
//
// The two-folder form pairs each PNG under A with the PNG of the same relative path under B (one sample
// folder, or a parent with one folder for each sample) and counts the pixels whose red, green or blue value
// differs by more than the threshold (default 16 of 255). It prints each pair with such pixels and a summary,
// and exits 1 when a pair differs or a PNG has no partner.
//
// The --against form is the whole proof for this checkout against a revision (for example main). It builds
// the revision in a scratch worktree outside the checkout and this checkout's working tree in place, serves
// both builds, and renders each sample three times, one after the other: the revision, this checkout, the
// revision again. For each sample it prints the stable changes (a render that differs between the revision
// and this checkout in a state that is the same in the two renders of the revision), the unstable renders,
// and each fault of this checkout's build (a render check that fails; the same fault on the revision marks a
// sample problem, not a change; a fault on the revision only is a change too, because a check result differs).
// It exits 1 on a stable change or a fault of this checkout's build, else 0. A folder from an earlier run is
// removed before its capture, so no stale render counts.
// The renders stay in the out folder (default: a new folder under <system temp folder>/kingdown-render-compare),
// one subfolder for each render pass (rev, tree, rev2) and each sample. The run takes about a quarter of an
// hour for all samples: start it detached and read its log when it ends.
//
// Two renders of one build are not the same pixel for pixel: a phone render (device scale 2) carries a dither
// pattern of about 140,000 pixels that differ by 1, and a state with motion (a haste chain, a replay) can
// catch another frame. The threshold removes the dither. For the motion states, render the same build twice
// (A against A2): a pair that differs there is unstable, and its A against B result proves nothing.
import sharp from 'sharp';
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync, writeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isInside } from '../../../tools/lib/checks.mjs';

const usage = 'usage: node docs/specs/web-ux/render-compare.mjs <folder A> <folder B> [threshold]\n'
  + '       node docs/specs/web-ux/render-compare.mjs --against <revision> [--samples 00,W1,…] [--out <folder>] [--threshold <n>]';
const raw = path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

/** The state of a render file: `<state>-<size>.png` without the size (a size name holds no hyphen). */
const stateOf = name => name.replace(/-[^-]+\.png$/, '');

const args = process.argv.slice(2);
if (args[0] === '--against') process.exit(await against(args.slice(1)));
const [a, b, limit = '16'] = args;
if (!a || !b) { console.error(usage); process.exit(2); }
for (const folder of [a, b]) if (!existsSync(folder)) { console.error(`render-compare: no folder ${folder}`); process.exit(2); }
const result = await compare(a, b, Number(limit));
for (const row of result.rows) console.log(row.text);
console.log(`render-compare: ${result.pairs} pairs, ${result.differ} differ, ${result.missing} with no partner; threshold ${result.threshold}`);
process.exit(result.differ || result.missing ? 1 : 0);

/** Every PNG under a folder, as paths relative to it (none for a folder that does not exist). */
function pngs(root, dir = root) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? pngs(root, path) : name.endsWith('.png') ? [relative(root, path)] : [];
  }).sort();
}

/** The PNGs of A against those of B: one row (kind DIFF, SIZE or MISSING) for each pair that differs or PNG with no partner. */
async function compare(a, b, threshold) {
  const left = pngs(a), right = new Set(pngs(b));
  const rows = [];
  let pairs = 0;
  for (const name of left) {
    if (!right.has(name)) { rows.push({ kind: 'MISSING', name, text: `MISSING ${name}: not in ${b}` }); continue; }
    right.delete(name);
    const [x, y] = await Promise.all([raw(join(a, name)), raw(join(b, name))]);
    pairs++;
    if (x.info.width !== y.info.width || x.info.height !== y.info.height) {
      rows.push({ kind: 'SIZE', name, text: `SIZE ${name}: ${x.info.width}x${x.info.height} against ${y.info.width}x${y.info.height}` });
      continue;
    }
    let strong = 0, any = 0;
    for (let i = 0; i < x.data.length; i += 4) {
      const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]));
      if (d) any++;
      if (d > threshold) strong++;
    }
    if (strong) rows.push({ kind: 'DIFF', name, text: `DIFF ${name}: ${strong} pixels differ by more than ${threshold} (${any} differ at all) of ${x.info.width * x.info.height}` });
  }
  for (const name of right) rows.push({ kind: 'MISSING', name, text: `MISSING ${name}: not in ${a}` });
  const missing = rows.filter(row => row.kind === 'MISSING').length;
  return { rows, pairs, differ: rows.length - missing, missing, threshold };
}

/** The --against form; see the header. Gives the exit code. */
async function against(rest) {
  const rev = rest.shift();
  if (!rev || rev.startsWith('--')) { console.error(usage); return 2; }
  const opt = { samples: null, out: null, threshold: 16 };
  while (rest.length) {
    const [flag, value] = rest.splice(0, 2);
    if (flag === '--samples' && value) opt.samples = value.split(',').filter(Boolean);
    else if (flag === '--out' && value) opt.out = resolve(value);
    else if (flag === '--threshold' && value) opt.threshold = Number(value);
    else { console.error(usage); return 2; }
  }
  const checkout = fileURLToPath(new URL('../../../', import.meta.url));
  const git = (...cmd) => {
    const run = spawnSync('git', ['-C', checkout, ...cmd], { encoding: 'utf8' });
    if (run.status !== 0) throw new Error(`git ${cmd.join(' ')}: ${run.stderr.trim()}`);
    return run.stdout.trim();
  };
  let sha;
  try { sha = git('rev-parse', '--verify', '-q', `${rev}^{commit}`); } catch { console.error(`render-compare: ${rev} is not a revision of this repository`); return 2; }
  const head = git('rev-parse', 'HEAD');
  const dirty = git('status', '--porcelain', '--untracked-files=no') !== '';
  const samplesDir = join(checkout, 'docs/specs/web-redesign/samples');
  const known = readdirSync(samplesDir).filter(n => /^(?:\d\d[a-z]?|W\d{1,2})\.mjs$/.test(n)).map(n => n.slice(0, -4))
    .sort((p, q) => p.localeCompare(q, 'en', { numeric: true }));
  const samples = opt.samples ?? known;
  const unknown = samples.filter(s => !known.includes(s));
  if (unknown.length) { console.error(`render-compare: no sample ${unknown.join(', ')}; known: ${known.join(', ')}`); return 2; }
  const outRoot = join(tmpdir(), 'kingdown-render-compare');
  mkdirSync(opt.out ?? outRoot, { recursive: true });
  const out = opt.out ?? mkdtempSync(join(outRoot, `${sha.slice(0, 7)}-`));
  if (isInside(checkout, out)) { console.error(`render-compare: the out folder ${out} is inside the checkout; renders stay out of Git`); return 2; }

  const say = line => console.log(line);
  const parent = mkdtempSync(join(tmpdir(), 'kingdown-render-base-'));
  const base = join(parent, 'w');
  const servers = [];
  let child = null; // the running capture, if any
  const cleanup = async () => {
    if (child) child.kill();
    for (const server of servers) await server.close().catch(() => {});
    spawnSync('git', ['-C', checkout, 'worktree', 'remove', '--force', base]);
    rmSync(parent, { recursive: true, force: true });
  };
  process.on('SIGINT', () => { void cleanup().then(() => process.exit(130)); });
  try {
    git('worktree', 'add', '-q', '--detach', base, sha);
    symlinkSync(join(checkout, 'node_modules'), join(base, 'node_modules'));
    say(`render-compare: ${rev} (${sha.slice(0, 7)}) against this checkout (${head.slice(0, 7)}${dirty ? ', with uncommitted changes' : ''}); ${samples.length} samples; renders in ${out}`);
    if (git('diff', '--name-only', sha, 'HEAD', '--', 'package-lock.json')) say('render-compare: package-lock.json differs between the two revisions; both builds use this checkout\'s packages');
    // Build both: the revision in its scratch worktree, this checkout in place (dist/ is ignored by Git).
    for (const [label, root] of [['rev', base], ['tree', checkout]]) {
      const build = spawnSync(join(checkout, 'node_modules/.bin/vite'), ['build'], { cwd: root, encoding: 'utf8' });
      writeFileSync(join(out, `build-${label}.log`), `${build.stdout ?? ''}${build.stderr ?? ''}`);
      if (build.status !== 0) { say(`render-compare: the build of ${label === 'rev' ? rev : 'this checkout'} failed; see ${join(out, `build-${label}.log`)}`); return 1; }
    }
    const { preview } = await import('vite');
    const serve = async root => {
      const server = await preview({ root, logLevel: 'silent', preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
      servers.push(server);
      return server.resolvedUrls.local[0];
    };
    const urls = { rev: await serve(base), tree: await serve(checkout) };
    const capture = fileURLToPath(new URL('./capture.mjs', import.meta.url));
    /** One capture of a sample against a build, in a fresh folder, with its log beside it; gives the exit code. */
    const render = (nn, url, dir) => new Promise(done => {
      rmSync(dir, { recursive: true, force: true }); // a folder from an earlier run would pass off stale renders as this run's
      mkdirSync(dir, { recursive: true });
      const log = openSync(`${dir}.log`, 'w');
      let ended = false;
      const end = code => { if (ended) return; ended = true; child = null; closeSync(log); done(code); };
      child = spawn(process.execPath, [capture, url, dir], { env: { ...process.env, SAMPLE: nn }, stdio: ['ignore', log, log] });
      child.on('error', e => { writeSync(log, `capture: cannot start: ${e.message}\n`); end(1); });
      child.on('exit', code => end(code ?? 1));
    });
    /** The faults of a capture, by render file (or `capture` when it left no report, or exited non-zero with none). */
    const faultsOf = (dir, code) => {
      const file = join(dir, 'report.json');
      if (!existsSync(file)) return new Map([['capture', `exit ${code}, no report.json; see ${dir}.log`]]);
      const report = JSON.parse(readFileSync(file, 'utf8'));
      const faults = new Map(report.renders.filter(r => r.faults.length).map(r => [relative(dir, r.file), r.faults.join('; ')]));
      if (code !== 0 && !faults.size) faults.set('capture', `exit ${code} with a report of no faults; see ${dir}.log`);
      return faults;
    };

    let pairs = 0, changes = 0, unstable = 0, treeFaults = 0;
    for (const nn of samples) {
      const dirs = { rev: join(out, 'rev', nn), tree: join(out, 'tree', nn), rev2: join(out, 'rev2', nn) };
      const codes = {};
      for (const pass of ['rev', 'tree', 'rev2']) codes[pass] = await render(nn, urls[pass === 'tree' ? 'tree' : 'rev'], dirs[pass]);
      // A state is unstable when the two renders of the revision differ in it, one of them lacks it, or its
      // faults differ between them. A difference against this checkout in such a state proves nothing.
      const faults = { rev: faultsOf(dirs.rev, codes.rev), tree: faultsOf(dirs.tree, codes.tree), rev2: faultsOf(dirs.rev2, codes.rev2) };
      const flicker = new Set((await compare(dirs.rev, dirs.rev2, opt.threshold)).rows.map(row => stateOf(row.name)));
      for (const file of new Set([...faults.rev.keys(), ...faults.rev2.keys()])) if (faults.rev.get(file) !== faults.rev2.get(file)) flicker.add(stateOf(file));
      const result = await compare(dirs.rev, dirs.tree, opt.threshold);
      const lines = [];
      let sampleChanges = 0, sampleUnstable = 0;
      for (const row of result.rows) {
        if (flicker.has(stateOf(row.name))) { sampleUnstable++; lines.push(`  unstable ${row.name}: the state is not the same in the two renders of ${rev}`); }
        else { sampleChanges++; lines.push(`  CHANGE ${row.text}`); }
      }
      for (const [file, text] of faults.tree) {
        lines.push(`  FAULT ${file}: ${text}${faults.rev.get(file) === text ? ` (the same on ${rev}: a sample problem, not a change)` : ' (this checkout only)'}`);
      }
      for (const [file, text] of faults.rev) {
        if (faults.tree.has(file)) continue;
        if (flicker.has(stateOf(file))) { sampleUnstable++; lines.push(`  unstable ${file}: a fault in one render of ${rev} only: ${text}`); }
        else { sampleChanges++; lines.push(`  CHANGE ${file}: a fault on ${rev} only, so a check that this checkout's build passes fails there: ${text}`); }
      }
      pairs += result.pairs; changes += sampleChanges; unstable += sampleUnstable; treeFaults += faults.tree.size;
      say(`== ${nn}: ${result.pairs} pairs, ${sampleChanges} changes, ${sampleUnstable} unstable, ${faults.tree.size} faults`);
      for (const line of lines) say(line);
    }
    say(`render-compare: ${samples.length} samples, ${pairs} pairs, ${changes} stable changes, ${unstable} unstable, ${treeFaults} faults of this checkout's build; threshold ${opt.threshold}; renders in ${out}`);
    return changes || treeFaults ? 1 : 0;
  } finally {
    await cleanup();
  }
}
