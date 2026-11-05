#!/usr/bin/env python3
"""Staging deploy of the current origin/staging/first-game head for the owner playtest (owner, 2026-10-25: standing yes
for staging deploys of merged playtest fixes). The gate is CI on the exact commit (tools/release/ci-wait.sh: every check
suite complete and green) in place of a local full-suite run, so a fix reaches staging in minutes. Then the release
worktree builds the staging site with its own packages, keeps every committed engine archive byte for byte, checks the
compiled tree (check:vercel), publishes through the guard tools/deploy-staging.mjs (staging project, preview target only),
points kingdown-staging.vercel.app at the deployment and compares the live bytes. Production is not touched.

Usage: python3 tools/release/staging.py [ref]       (default origin/staging/first-game; one terminal, detached)
  KINGDOWN_RELEASE_WORKTREE  the release worktree with its own node_modules (default <main checkout>/.claude/worktrees/release-staging)
  KINGDOWN_RELEASE_EVIDENCE  the evidence root (default <main checkout>/../evidence/staging-release); each run gets a folder
Prints the evidence folder and a last line with the result; the folder holds progress.json, the logs and done.json."""
from pathlib import Path
import datetime, hashlib, json, os, subprocess, sys, time
tools = Path(__file__).resolve().parents[1]                     # the tools/ of this checkout: ci-wait and the key lookup
main = Path(subprocess.check_output(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=tools, text=True).strip()).parent
root = Path(os.environ.get('KINGDOWN_RELEASE_WORKTREE') or main / '.claude/worktrees/release-staging')
here = Path(os.environ.get('KINGDOWN_RELEASE_EVIDENCE') or main.parent / 'evidence/staging-release')
ref = sys.argv[1] if len(sys.argv) > 1 else 'origin/staging/first-game'
origin = 'https://kingdown-staging.vercel.app'
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def git(*args): return subprocess.check_output(['git', *args], cwd=root, text=True).strip()
assert root.is_dir() and (root / '.git').exists(), f'{root} is not a worktree; make it with git worktree add --detach, then npm ci there'
subprocess.check_call(['git', 'fetch', '-q', 'origin'], cwd=root)
source = git('rev-parse', ref)
ev = here / f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{source[:8]}"; ev.mkdir(parents=True)
print(f'staging: {source} -> {ev}', flush=True)
out = root / 'kingdown-deploy/.vercel/output'
def save(name, value): (ev / name).write_text(json.dumps(value, indent=2) + '\n')
def run(args, name, env, cwd=root):
    with (ev / name).open('w') as log:
        p = subprocess.run(args, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT)
    if p.returncode: raise RuntimeError(f'{name} exited {p.returncode}')
record = {'started_at': now(), 'phase': 'preflight', 'source': source}
try:
    assert not git('status', '--porcelain'), 'The release worktree has changes'
    subprocess.check_call(['git', 'checkout', '-q', '--detach', source], cwd=root)
    assert git('rev-parse', 'HEAD') == source
    record['phase'] = 'ci'; save('progress.json', record)
    run(['bash', str(tools / 'release/ci-wait.sh'), source], 'ci.log', os.environ.copy(), cwd=tools)
    env = os.environ.copy()
    if (root / 'node_modules').is_symlink(): (root / 'node_modules').unlink()  # a tools/wt.sh link to the main checkout's packages; npm ci through it would empty them
    if not (root / 'node_modules').exists(): record['phase'] = 'npm-ci'; save('progress.json', record); run(['npm', 'ci'], 'npm-ci.log', env)
    if subprocess.run(['npm', 'ls', '--depth=0'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        record['phase'] = 'npm-ci'; save('progress.json', record); run(['npm', 'ci'], 'npm-ci.log', env)
    key = subprocess.check_output(['node', str(tools / 'release/publishable-key.mjs'), origin], text=True).strip()
    env.update(KINGDOWN_STAGE='staging', VITE_KINGDOWN_STAGE='staging', VITE_SUPABASE_URL='https://puhspsyjyzaghmgtkzqd.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY=key)
    record['phase'] = 'build'; save('progress.json', record); run(['npm', 'run', 'build:vercel'], 'build.log', env)
    # The same rule as the production artifact step of tools/deploy.sh: the built archives are the committed ones, unchanged.
    built = sorted(p.name for p in (out / 'functions/mcp.func/runtime/engines').glob('*.mjs')); committed = sorted(p.name for p in (root / 'engines').glob('*.mjs'))
    assert built == committed, f'the build holds engine archives {built}; engines/ holds {committed}'
    archives = {n: sha(out / 'functions/mcp.func/runtime/engines' / n) for n in built}
    assert all(v == sha(root / 'engines' / n) for n, v in archives.items()), 'A published engine archive changed'
    assert git('rev-parse', 'HEAD') == source and not git('status', '--porcelain')
    record.update(preserved_engine_archives=archives, sha256={p: sha(out / p) for p in ['static/index.html', 'static/sw.js', 'functions/mcp.func/board.html', 'functions/mcp.func/server.mjs', 'config.json', 'staging.json'] if (out / p).exists()}, phase='artifact-check'); save('progress.json', record)
    checkenv = env.copy(); checkenv.setdefault('PLUGIN_TEST_DATABASE_URL', 'postgresql://kingdown_test@127.0.0.1:55432/kingdown_release_test')
    run(['bash', 'tools/test-lock.sh', 'npm', 'run', 'check:vercel', '--', str(out)], 'artifact-check.log', checkenv)
    run(['node', 'tools/deploy-staging.mjs'], 'guard.log', env)
    record['phase'] = 'staging-preview-publish'; save('progress.json', record)
    with (ev / 'deploy.log').open('w') as log:
        proc = subprocess.run(['node', 'tools/deploy-staging.mjs', '--publish'], cwd=root, env=env, stdout=subprocess.PIPE, stderr=log, text=True)
    assert proc.returncode == 0, 'Guarded staging publish failed'
    deployment = json.loads(proc.stdout); assert deployment['target'] == 'preview' and deployment['readyState'] == 'READY'
    deployment.update(source=source, published_at=now()); save('deployment.json', deployment)
    record['phase'] = 'assign-staging-alias'; save('progress.json', record)
    run(['npx', '--yes', 'vercel@62.2.0', 'alias', 'set', deployment['url'], 'kingdown-staging.vercel.app', '--scope', 'saars-projects-2c777ec5'], 'alias.log', env)
    live = {}
    for path, file in [('/', 'static/index.html'), ('/play/', 'static/index.html'), ('/sw.js', 'static/sw.js')]:
        for attempt in range(12):
            data = subprocess.check_output(['curl', '--fail', '--silent', '--show-error', origin + path])
            if data == (out / file).read_bytes(): break
            time.sleep(5)
        live[path] = {'sha256': hashlib.sha256(data).hexdigest(), 'matches_build': data == (out / file).read_bytes()}
        assert live[path]['matches_build'], 'Alias propagation incomplete; keep the deployment and verify again without publishing'
    status = json.loads(subprocess.check_output(['curl', '--fail', '--silent', '--show-error', origin + '/api/status'])); assert status['account_access'] == 'open'
    live.update(status=status, verified_at=now()); save('live-alias.json', live)
    record.update(phase='live-alias-verified', finished_at=now(), deployment=deployment['id']); save('progress.json', record); save('done.json', {'exit_code': 0, 'source': source, 'finished_at': now()})
    print(f'staging: pass; kingdown-staging.vercel.app serves {source}', flush=True)
except Exception as error:
    record.update(error=str(error), failed_at=now()); save('progress.json', record); save('done.json', {'exit_code': 1, 'source': source, 'error': str(error), 'finished_at': now()})
    print(f'staging: FAIL: {error}', flush=True); raise
