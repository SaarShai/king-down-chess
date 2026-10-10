// Compares the renders of two capture runs (capture.mjs) pixel by pixel, for a proof of no visible change
// (after-redesign spec, §4.4).
//
//   node docs/specs/web-ux/render-compare.mjs <folder A> <folder B> [threshold]
//   node docs/specs/web-ux/render-compare.mjs --against <revision> [--samples 00,W1,…] [--out <folder>] [--threshold <n>]
//
// The two-folder form pairs each PNG under A with the PNG of the same relative path under B (one sample
// folder, or a parent with one folder for each sample) and counts the pixels whose red, green or blue value
// differs by more than the threshold (default 16 of 255). It prints each pair with such pixels and a summary,
// and exits 1 when a pair differs or a PNG has no partner, 2 on a usage fault or a folder that does not exist.
//
// The --against form is the render part of the §4.4 proof for this checkout against a revision (for example
// main); the build compare (the chunk list, the precache list, the CSS) stays a separate step. It builds the
// revision in a scratch worktree outside the checkout, and this checkout's working tree into the out folder
// (`dist-tree`, so this checkout's dist/ and a check run that serves it stay as they are), serves both builds,
// and renders each sample three times, one after the other: the revision, this checkout, the revision again.
// Every pass uses this checkout's capture.mjs and sample tables. For each sample it prints:
//   - the stable changes: a render that differs between the revision and this checkout in a state that is the
//     same in every render of each build. A candidate change gets one more render of each build first, so a
//     state that flips between two looks at random is caught more often; it is not caught every time, so a
//     CHANGE in a state that the after-redesign tickets name as unstable deserves one more run of its sample;
//   - the unstable renders: a difference in a state that is not the same in two renders of one build, or
//     whose render checks differ between them; such a difference proves nothing;
//   - each fault of this checkout's build (a render check that fails). The same fault on the revision marks a
//     sample problem, not a change; a fault on the revision only is a change too, because a check result differs.
// A sample whose capture does not finish (no report.json: a crash, the time limit of 15 minutes) is NOT
// COMPARED and fails the run. It exits 1 on a stable change, a fault of this checkout's build or a sample not
// compared, else 0; 2 on a usage fault. The renders stay in the out folder (default: a new folder under
// <system temp folder>/kingdown-render-compare): one subfolder for each render pass and each sample, the two
// build logs and compare.log, a copy of this output. A folder from an earlier run is removed before its
// capture, so no stale render counts. The run takes about a quarter of an hour for all samples: start it
// detached, with its output outside the checkout, and read compare.log when it ends. A stop (SIGINT, SIGTERM,
// SIGHUP) kills the running capture and removes the scratch worktree.
//
// Two renders of one build are not the same pixel for pixel: a phone render (device scale 2) carries a dither
// pattern of about 140,000 pixels that differ by 1, and a state with motion (a haste chain, a replay) can
// catch another frame. The threshold removes the dither. For the motion states, render the same build twice
// (A against A2): a pair that differs there is unstable, and its A against B result proves nothing.
import sharp from 'sharp';
import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync, writeSync } from 'node:fs';
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
  if (!Number.isFinite(opt.threshold) || opt.threshold < 0) { console.error('render-compare: the threshold is a number of 0 or more'); return 2; }
  if (opt.samples && !opt.samples.length) { console.error('render-compare: --samples names no sample'); return 2; }
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
  if (opt.out && isInside(checkout, opt.out)) { console.error(`render-compare: the out folder ${opt.out} is inside the checkout; renders stay out of Git`); return 2; }
  let out = opt.out;
  if (out) mkdirSync(out, { recursive: true });
  else { mkdirSync(join(tmpdir(), 'kingdown-render-compare'), { recursive: true }); out = mkdtempSync(join(tmpdir(), 'kingdown-render-compare', `${sha.slice(0, 7)}-`)); }
  const logFile = join(out, 'compare.log');
  writeFileSync(logFile, '');
  const say = line => { console.log(line); appendFileSync(logFile, `${line}\n`); };

  // The scratch worktree of the revision, and a clean stop on every exit: vite's own signal listener may
  // call process.exit(), so the synchronous part of the cleanup runs on 'exit'.
  const parent = mkdtempSync(join(tmpdir(), 'kingdown-render-base-'));
  const base = join(parent, 'w');
  const servers = [];
  let child = null; // the running capture, if any
  let stopping = false;
  process.on('exit', () => {
    if (child) child.kill('SIGKILL');
    spawnSync('git', ['-C', checkout, 'worktree', 'remove', '--force', base]);
    rmSync(parent, { recursive: true, force: true });
  });
  for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) {
    process.on(signal, () => { if (stopping) return; stopping = true; say(`render-compare: ${signal}: stopping`); process.exit(code); });
  }
  try {
    git('worktree', 'add', '-q', '--detach', base, sha);
    symlinkSync(join(checkout, 'node_modules'), join(base, 'node_modules'));
    say(`render-compare: ${rev} (${sha.slice(0, 7)}) against this checkout (${head.slice(0, 7)}${dirty ? ', with uncommitted changes' : ''}); ${samples.length} samples; renders and compare.log in ${out}`);
    if (git('diff', '--name-only', sha, 'HEAD', '--', 'package-lock.json')) say('render-compare: package-lock.json differs between the two revisions; both builds use this checkout\'s packages');
    // Build both: the revision in its scratch worktree, this checkout into the out folder.
    const vite = join(checkout, 'node_modules/vite/bin/vite.js');
    const treeDist = join(out, 'dist-tree');
    const build = (label, root, outDir) => {
      const run = spawnSync(process.execPath, [vite, 'build', ...(outDir ? ['--outDir', outDir, '--emptyOutDir'] : [])], { cwd: root, encoding: 'utf8' });
      writeFileSync(join(out, `build-${label}.log`), `${run.error ? `${run.error.message}\n` : ''}${run.stdout ?? ''}${run.stderr ?? ''}`);
      if (run.status !== 0) say(`render-compare: the build of ${label === 'rev' ? rev : 'this checkout'} failed (exit ${run.status}); see ${join(out, `build-${label}.log`)}`);
      return run.status === 0;
    };
    if (!build('rev', base, null) || !build('tree', checkout, treeDist)) return 1;
    const { preview } = await import('vite');
    const serve = async (root, outDir) => {
      const server = await preview({ root, logLevel: 'silent', ...(outDir ? { build: { outDir } } : {}), preview: { host: '127.0.0.1', port: 0, strictPort: true, open: false } });
      servers.push(server);
      return server.resolvedUrls.local[0];
    };
    const urls = { rev: await serve(base, null), tree: await serve(checkout, treeDist) };
    const buildOf = pass => (pass.startsWith('rev') ? 'rev' : 'tree');
    const capture = fileURLToPath(new URL('./capture.mjs', import.meta.url));
    const LIMIT = 15 * 60_000;
    /** One capture of a sample against a build, in a fresh folder, with its log beside it; gives the exit code. */
    const render = (nn, url, dir) => new Promise(done => {
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      const log = openSync(`${dir}.log`, 'w');
      let ended = false;
      const end = code => { if (ended) return; ended = true; clearTimeout(timer); child = null; closeSync(log); done(code); };
      child = spawn(process.execPath, [capture, url, dir], { env: { ...process.env, SAMPLE: nn }, stdio: ['ignore', log, log] });
      const timer = setTimeout(() => { writeSync(log, `capture: no end after ${LIMIT / 60_000} minutes; stopped\n`); child?.kill('SIGKILL'); }, LIMIT);
      child.on('error', e => { writeSync(log, `capture: cannot start: ${e.message}\n`); end(1); });
      child.on('exit', code => end(code ?? 1));
    });
    /** The faults of a capture, by render file; `capture` stands for a pass with no report. The texts hold no path, so passes compare. */
    const faultsOf = (dir, code) => {
      const file = join(dir, 'report.json');
      if (!existsSync(file)) return new Map([['capture', `exit ${code}, no report.json`]]);
      const report = JSON.parse(readFileSync(file, 'utf8'));
      const faults = new Map(report.renders.filter(r => r.faults.length).map(r => [relative(dir, r.file), r.faults.join('; ')]));
      if (code !== 0 && !faults.size) faults.set('capture', `exit ${code} with a report of no faults`);
      return faults;
    };
    /** The states in which two passes of one build are not the same: a pixel difference, a missing render or another fault. */
    const unsteady = async (x, y, faults) => {
      const states = new Set((await compare(x, y, opt.threshold)).rows.map(row => stateOf(row.name)));
      for (const file of new Set([...faults[0].keys(), ...faults[1].keys()])) if (faults[0].get(file) !== faults[1].get(file)) states.add(stateOf(file));
      return states;
    };

    let pairs = 0, changes = 0, unstable = 0, treeFaults = 0, notCompared = 0;
    for (const nn of samples) {
      const dirs = {}, codes = {}, faults = {};
      const pass = async name => {
        dirs[name] = join(out, name, nn);
        codes[name] = await render(nn, urls[buildOf(name)], dirs[name]);
        faults[name] = faultsOf(dirs[name], codes[name]);
        return !faults[name].has('capture');
      };
      let complete = true;
      for (const name of ['rev', 'tree', 'rev2']) complete = (await pass(name)) && complete;
      const incomplete = () => Object.keys(faults).filter(name => faults[name].has('capture'));
      if (!complete) {
        notCompared++;
        say(`== ${nn}: NOT COMPARED: the ${incomplete().join(', ')} capture did not finish (${incomplete().map(name => `${faults[name].get('capture')}; see ${dirs[name]}.log`).join('; ')})`);
        continue;
      }
      const flicker = await unsteady(dirs.rev, dirs.rev2, [faults.rev, faults.rev2]);
      const result = await compare(dirs.rev, dirs.tree, opt.threshold);
      // A candidate change gets one more render of each build; it stays a change only when each build is the same in that state.
      let confirmed = '';
      if (result.rows.some(row => !flicker.has(stateOf(row.name)))) {
        const both = (await pass('rev3')) && (await pass('tree2'));
        if (both) {
          for (const state of await unsteady(dirs.rev, dirs.rev3, [faults.rev, faults.rev3])) flicker.add(state);
          for (const state of await unsteady(dirs.tree, dirs.tree2, [faults.tree, faults.tree2])) flicker.add(state);
          confirmed = ' (confirmed by a second render of each build)';
        } else confirmed = ` (not confirmed: the ${incomplete().join(', ')} capture did not finish)`;
      }
      const lines = [];
      let sampleChanges = 0, sampleUnstable = 0;
      for (const row of result.rows) {
        if (flicker.has(stateOf(row.name))) { sampleUnstable++; lines.push(`  unstable ${row.name}: the state is not the same in two renders of one build`); }
        else { sampleChanges++; lines.push(`  CHANGE ${row.text}${confirmed}`); }
      }
      for (const [file, text] of faults.tree) {
        const where = file === 'capture' ? `; see ${dirs.tree}.log` : '';
        lines.push(`  FAULT ${file}: ${text}${faults.rev.get(file) === text ? ` (the same on ${rev}: a sample problem, not a change)` : ' (this checkout only)'}${where}`);
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
    say(`render-compare: ${samples.length} samples, ${pairs} pairs, ${changes} stable changes, ${unstable} unstable, ${treeFaults} faults of this checkout's build, ${notCompared} not compared; threshold ${opt.threshold}; renders and compare.log in ${out}`);
    return changes || treeFaults || notCompared ? 1 : 0;
  } finally {
    for (const server of servers) await server.close().catch(() => {});
  }
}
