#!/usr/bin/env node
/**
 * Play a kings' powers tournament (`src/sim/tournament.ts`) as shards on Kaggle CPU notebooks.
 *
 *   node tools/kaggle-tournament.mjs push   --id kp2-r13 --shards 4 [--first 0] [--ref <commit>] [--user <name>] -- <tournament run flags>
 *   node tools/kaggle-tournament.mjs push   --id kp2-r13 --only 1,3      (push those shards again, as recorded)
 *   node tools/kaggle-tournament.mjs status --id kp2-r13
 *   node tools/kaggle-tournament.mjs pull   --id kp2-r13
 *
 * Each notebook fetches this public repository at one pushed commit (src/ and the package files),
 * installs Node 22 (official build, checksum checked) and the locked packages, and plays
 * `--shard i/n` with one worker per CPU. `pull` copies each shard's games and log into sim/out/,
 * where `tournament.ts report --id <id>` reads them with any shards played here: shards never
 * overlap, so `--first 2` pushes only shards 2.. and this machine can play 0 and 1 itself.
 * `push` writes sim/out/<id>.kaggle.json (commit, flags, notebooks) for `status`, `pull` and `--only`.
 *
 * Token: KAGGLE_API_TOKEN, else `.secrets/kaggle_api_token` in the main checkout (git-ignored;
 * never print or commit it), else the Kaggle client's own ~/.kaggle files.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const OUT = 'sim/out';
const REPO = 'https://github.com/SaarShai/king-down-chess.git';
const USAGE = 'usage: push|status|pull --id <tournament id> [--shards n] [--first i | --only i,j] [--ref commit] [--user name] [-- run flags]';
const fail = msg => { console.error(`kaggle-tournament: ${msg}`); process.exit(1); };

// This tool's own flags come before `--`, the tournament's run flags after it. Anything else before
// `--` is an error: a forgotten `--` would otherwise send every run flag to the wrong place.
const [cmd, ...rest] = process.argv.slice(2);
const dd = rest.indexOf('--');
const runArgs = dd < 0 ? [] : rest.slice(dd + 1);
const opts = {};
for (let i = 0, own = dd < 0 ? rest : rest.slice(0, dd); i < own.length; i++) {
  const m = /^--(id|shards|first|only|ref|user)(?:=(.*))?$/.exec(own[i]);
  if (!m) fail(`unknown argument "${own[i]}" (run flags go after --)\n${USAGE}`);
  const v = m[2] ?? own[++i];
  if (v === undefined || v.startsWith('--')) fail(`--${m[1]} needs a value`);
  opts[m[1]] = v;
}
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();

const id = opts.id;
// Lower-case letters, digits and dashes only, so every id has its own notebook names.
if (!['push', 'status', 'pull'].includes(cmd) || !id || !/^[a-z0-9][a-z0-9-]*$/.test(id)) fail(USAGE);
if (!existsSync('src/sim/tournament.ts')) fail('run from the repository root');

if (!process.env.KAGGLE_API_TOKEN) {
  const secret = join(resolve(git('rev-parse', '--git-common-dir'), '..'), '.secrets', 'kaggle_api_token');
  if (existsSync(secret)) process.env.KAGGLE_API_TOKEN = readFileSync(secret, 'utf8').trim();
}
const kaggle = (...a) => {
  const r = spawnSync('kaggle', a, { encoding: 'utf8' });
  if (r.error) fail(`cannot start the kaggle client (${r.error.message}); install it with: uv tool install kaggle`);
  // The client warns about newer versions on every call; that line is noise here.
  const out = `${r.stdout}${r.stderr}`.split('\n').filter(l => !/outdated `kaggle` version/.test(l)).join('\n').trim();
  return { ok: r.status === 0, out };
};

const manifestPath = join(OUT, `${id}.kaggle.json`);
const readManifest = () => JSON.parse(readFileSync(manifestPath, 'utf8'));

if (cmd === 'push') push();
else {
  if (!existsSync(manifestPath)) fail(`${manifestPath} not found: push first`);
  const m = readManifest();
  if (cmd === 'status') for (const k of m.kernels) console.log(`${k.ref}: ${kaggle('kernels', 'status', k.ref).out}`);
  else pull(m);
}

function push() {
  const old = existsSync(manifestPath) ? readManifest() : null;
  let sha, n, args, shards;
  if (opts.only !== undefined) {
    // Again, exactly as recorded: a shard whose push was refused, or whose notebook failed.
    if (!old) fail(`--only needs ${manifestPath}; push the tournament first`);
    if (opts.shards || opts.first || opts.ref || runArgs.length) fail('--only pushes as recorded: leave out --shards, --first, --ref and run flags');
    ({ sha, shards: n, args } = old);
    shards = opts.only.split(',').map(Number);
    if (shards.some(i => !Number.isInteger(i) || i < 0 || i >= n)) fail(`--only: shard numbers 0..${n - 1}`);
  } else {
    if (old) fail(`${manifestPath} exists: this tournament was pushed already (pull it, push --only the missing shards, or use a new id)`);
    n = Number(opts.shards ?? '1');
    const first = Number(opts.first ?? '0');
    if (!Number.isInteger(n) || n < 1 || !Number.isInteger(first) || first < 0 || first >= n) fail('--shards n (>= 1) and --first i (0 <= i < n)');
    for (const k of ['--id', '--shard', '--workers']) if (runArgs.some(a => a === k || a.startsWith(`${k}=`))) fail(`${k} is set by this tool; leave it out of the run flags`);
    sha = git('rev-parse', `${opts.ref ?? 'HEAD'}^{commit}`);
    args = runArgs;
    shards = Array.from({ length: n - first }, (_, k) => first + k);
  }
  const user = opts.user ?? process.env.KAGGLE_USERNAME
    ?? (existsSync(join(homedir(), '.kaggle', 'kaggle.json')) ? JSON.parse(readFileSync(join(homedir(), '.kaggle', 'kaggle.json'), 'utf8')).username : undefined);
  if (!user) fail('--user <kaggle user name> (or KAGGLE_USERNAME)');
  // The notebook fetches the commit from GitHub, so it must be on a pushed branch.
  if (!git('branch', '-r', '--contains', sha)) fail(`commit ${sha.slice(0, 9)} is not on any pushed branch; push it first`);
  if (git('status', '--porcelain', '--', 'src', 'package.json', 'package-lock.json')) console.warn('warning: src/ or the package files have uncommitted changes; the notebooks run the commit, not them');
  console.log(`${id}: commit ${sha.slice(0, 9)}, shards ${shards.join(', ')} of ${n}, run flags: ${args.length ? args.join(' ') : '(none: the defaults)'}`);
  const kernels = old?.kernels.filter(k => !shards.includes(k.shard)) ?? [];
  const save = () => { mkdirSync(OUT, { recursive: true }); writeFileSync(manifestPath, JSON.stringify({ id, sha, shards: n, args, kernels }, null, 2) + '\n'); };
  const refused = [];
  for (const i of shards) {
    const dir = mkdtempSync(join(tmpdir(), 'kd-kaggle-'));
    const name = `kd-${id}-s${i}of${n}`;
    writeFileSync(join(dir, 'run.py'), notebook({ repo: REPO, sha, id, shard: `${i}/${n}`, args }));
    writeFileSync(join(dir, 'kernel-metadata.json'), JSON.stringify({
      id: `${user}/${name}`, title: name, code_file: 'run.py', language: 'python', kernel_type: 'script',
      is_private: true, enable_gpu: false, enable_tpu: false, enable_internet: true,
      dataset_sources: [], kernel_sources: [], competition_sources: [], model_sources: [],
    }, null, 2));
    const r = kaggle('kernels', 'push', '-p', dir);
    console.log(`shard ${i}/${n}: ${r.out}`);
    // The client exits 0 on a refused push (session limit, bad name) and says so only in its text.
    const url = /successfully pushed/i.test(r.out) && /kaggle\.com\/code\/([^/\s]+\/[^/\s]+)/.exec(r.out);
    if (!r.ok || !url) { refused.push(i); continue; }
    kernels.push({ shard: i, ref: url[1] });
    kernels.sort((a, b) => a.shard - b.shard);
    save();
  }
  if (!kernels.length && !old) fail('no notebook was pushed');
  console.log(`${shards.length - refused.length} notebook(s) pushed at ${sha.slice(0, 9)}. Then: node tools/kaggle-tournament.mjs status --id ${id}`);
  if (refused.length) fail(`refused: shard(s) ${refused.join(', ')}. Push them again later with --only ${refused.join(',')}, or play them here with tournament.ts run ... --shard i/${n}`);
}

function pull(m) {
  let missing = 0;
  for (const k of m.kernels) {
    const tag = `${id}.shard${k.shard}of${m.shards}`;
    const dir = mkdtempSync(join(tmpdir(), 'kd-kaggle-out-'));
    const r = kaggle('kernels', 'output', k.ref, '-p', dir);
    const status = existsSync(join(dir, 'status.json')) ? JSON.parse(readFileSync(join(dir, 'status.json'), 'utf8')) : null;
    if (!r.ok || !status) { console.log(`${k.ref}: no finished output yet (${kaggle('kernels', 'status', k.ref).out})`); missing++; continue; }
    // The notebook's output must be this tournament's shard at this commit (a notebook name can be reused).
    if (status.id !== id || status.sha !== m.sha || status.shard !== `${k.shard}/${m.shards}`) {
      console.log(`${k.ref}: output of another run (${status.id ?? '?'} shard ${status.shard} at ${String(status.sha).slice(0, 9)}); nothing copied`);
      missing++;
      continue;
    }
    // Every shard must have played the tournament this machine knows by that id.
    const spec = join(dir, `${id}.tournament.json`), local = join(OUT, `${id}.tournament.json`);
    if (existsSync(spec)) {
      if (!existsSync(local)) copyFileSync(spec, local);
      else if (readFileSync(spec, 'utf8') !== readFileSync(local, 'utf8')) fail(`${k.ref} played a different ${id}.tournament.json than ${local}`);
    }
    for (const f of [`${tag}.jsonl`, `${tag}.log`]) {
      const src = join(dir, f), dst = join(OUT, f);
      if (!existsSync(src)) continue;
      // Keep a longer copy that is already here (a shard re-run locally, or an earlier pull).
      if (existsSync(dst) && statSync(dst).size > statSync(src).size) { console.log(`${dst}: kept the longer local copy`); continue; }
      copyFileSync(src, dst);
    }
    const games = existsSync(join(OUT, `${tag}.jsonl`)) ? readFileSync(join(OUT, `${tag}.jsonl`), 'utf8').split('\n').filter(Boolean).length : 0;
    console.log(`${k.ref}: exit ${status.exit}, ${games} games, ${Math.round(status.seconds / 60)} min on ${status.cpus} CPUs${status.error ? ` (${status.error})` : ''}`);
    if (status.exit !== 0 || !games) missing++;
  }
  const absent = Array.from({ length: m.shards }, (_, i) => i).filter(i => !m.kernels.some(k => k.shard === i));
  if (absent.length) console.log(`Not on Kaggle: shard(s) ${absent.join(', ')} (play them here: tournament.ts run ... --shard i/${m.shards}, or push --only).`);
  console.log(missing ? `${missing} shard(s) not finished or failed (push --only to rerun).` : `All Kaggle shards pulled. Report: npx tsx src/sim/tournament.ts report --id ${id}`);
}

/** The notebook: a Python script, since Kaggle runs scripts in its Python image. */
function notebook(cfg) {
  return `# King Down Chess: one shard of a kings' powers tournament.
# Generated by tools/kaggle-tournament.mjs; edit that file, not this one.
import hashlib, json, os, subprocess, sys, time, urllib.request

CFG = json.loads(${JSON.stringify(JSON.stringify(cfg))})
OUT = '/kaggle/working'
R = '/tmp/repo'
t0 = time.time()

def sh(cmd, cwd=None):
    print('+', cmd, flush=True)
    subprocess.run(cmd, shell=True, check=True, cwd=cwd)

def cpus():
    try:
        quota, period = open('/sys/fs/cgroup/cpu.max').read().split()
        if quota != 'max':
            return max(1, int(quota) // int(period))
    except (OSError, ValueError):
        pass
    return len(os.sched_getaffinity(0))

status = {'exit': None, 'cpus': cpus(), 'id': CFG['id'], 'sha': CFG['sha'], 'shard': CFG['shard']}
try:
    sh('nproc; grep -m1 "model name" /proc/cpuinfo; cat /sys/fs/cgroup/cpu.max || true; free -g | head -2; git --version')
    # Node 22, the official build, checked against the published checksum.
    base = 'https://nodejs.org/dist/latest-v22.x/'
    sums = urllib.request.urlopen(base + 'SHASUMS256.txt').read().decode()
    digest, name = next(l.split() for l in sums.splitlines() if l.endswith('-linux-x64.tar.xz'))
    data = urllib.request.urlopen(base + name).read()
    if hashlib.sha256(data).hexdigest() != digest:
        raise RuntimeError('Node download does not match its checksum')
    open('/tmp/node.tar.xz', 'wb').write(data)
    sh('mkdir -p /tmp/node && tar -xJf /tmp/node.tar.xz -C /tmp/node --strip-components=1')
    os.environ['PATH'] = '/tmp/node/bin:' + os.environ['PATH']
    # The pinned commit: the package files and src/ only (the repository holds 370 MB of art).
    sh(f"git init -q {R} && git -C {R} remote add origin {CFG['repo']} && git -C {R} config core.sparseCheckout true")
    open(f'{R}/.git/info/sparse-checkout', 'w').write('/package.json\\n/package-lock.json\\n/tsconfig.json\\n/src/\\n')
    sh(f"git -C {R} fetch -q --depth 1 --filter=blob:none origin {CFG['sha']} && git -C {R} checkout -q FETCH_HEAD")
    sh('node --version && npm ci --no-audit --no-fund --loglevel=error', cwd=R)
    # Games, spec and log go straight into the notebook's output.
    os.makedirs(f'{R}/sim', exist_ok=True)
    os.symlink(OUT, f'{R}/sim/out')
    i, n = CFG['shard'].split('/')
    log = open(f"{OUT}/{CFG['id']}.shard{i}of{n}.log", 'w')
    cmd = ['npx', 'tsx', 'src/sim/tournament.ts', 'run', '--id', CFG['id'], *CFG['args'], '--shard', CFG['shard'], '--workers', str(status['cpus'])]
    print('+', ' '.join(cmd), flush=True)
    p = subprocess.Popen(cmd, cwd=R, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in p.stdout:
        print(line, end='', flush=True)
        log.write(line)
        log.flush()
    status['exit'] = p.wait()
except Exception as e:
    print('failed:', e, flush=True)
    status['exit'] = -1
    status['error'] = str(e)
status['seconds'] = round(time.time() - t0)
json.dump(status, open(f'{OUT}/status.json', 'w'))
print('status', json.dumps(status), flush=True)
`;
}
