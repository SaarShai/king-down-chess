#!/usr/bin/env python3
"""Build and publish a staging deployment for a fixed commit.

Usage: staging.py [--dry-run] [ref]
       staging.py --preview [--dry-run] <ref>
The release driver uses --ci-passed after its CI stage.
KINGDOWN_RELEASE_WORKTREE sets the build worktree.
KINGDOWN_RELEASE_EVIDENCE sets the parent folder for the evidence.
"""
import argparse
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile
import time
from urllib.parse import urlsplit

TOOLS = Path(__file__).resolve().parents[1]
STAGING = 'https://kingdown-staging.vercel.app'
PREVIEW = json.loads((TOOLS / 'release/preview-host.json').read_text())
STAGING_SUPABASE_URL = 'https://puhspsyjyzaghmgtkzqd.supabase.co'
GUARD = ['node', 'tools/deploy-staging.mjs']
SITE_CHECK = ['npm', 'run', 'check:browser', 'release-site']


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def get(url):
    result = subprocess.check_output(['curl', '--silent', '--show-error', '--max-time', '15',
                                     '--write-out', '\n%{http_code}\n%{redirect_url}', url])
    body, status, redirect = result.rsplit(b'\n', 2)
    return int(status), body, redirect.decode()


def verify_alias(out, origin, attempts=12):
    static = out / 'static'
    home = 'next.html' if (static / 'solo-launch.json').is_file() else 'index.html'
    live = {}
    for path, file in [('/', home), ('/play/', 'index.html'), ('/sw.js', 'sw.js')]:
        expected = (static / file).read_bytes()
        for attempt in range(attempts):
            status, data, redirect = get(origin + path)
            host = urlsplit(redirect).hostname or ''
            if 300 <= status < 400 and (host == 'vercel.com' or host.endswith('.vercel.com')):
                raise RuntimeError(f'{origin} redirects to Vercel sign-in. The alias must open signed out.')
            matches = status == 200 and data == expected
            if matches or attempt == attempts - 1:
                break
            time.sleep(5)
        if not matches:
            raise RuntimeError(f'Alias propagation incomplete at {path} (HTTP {status}). Keep the deployment and verify again without publishing.')
        live[path] = {'file': file, 'sha256': hashlib.sha256(data).hexdigest(), 'matches_build': True}
    if origin == STAGING:
        status, data, _ = get(origin + '/api/status')
        assert status == 200, f'Staging account status answers HTTP {status}'
        live['status'] = json.loads(data)
        assert live['status']['account_access'] == 'open', 'Staging account status is not open'
    return live


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--ci-passed', action='store_true')
    parser.add_argument('ref', nargs='?')
    args = parser.parse_args()
    if args.preview and (not args.ref or args.ci_passed):
        parser.error('--preview needs a ref and has no CI stage')
    ref = args.ref or 'origin/staging/first-game'
    origin = PREVIEW if args.preview else STAGING
    host = urlsplit(origin).hostname
    profile = TOOLS / 'release/profile.sh'
    build = ['bash', '-c', '. "$1"; exec npm run build:vercel', 'staging-build', str(profile)]
    key_command = ['node', str(TOOLS / 'release/publishable-key.mjs'), STAGING]
    publish = [*GUARD, '--publish']

    def alias(deployment):
        return ['npx', '--yes', 'vercel@62.2.0', 'alias', 'set', deployment, host, '--scope', 'saars-projects-2c777ec5']

    def stub(command):
        print('dry-run:', shlex.join(command), flush=True)

    if args.dry_run:
        stub(['git', 'fetch', '-q', 'origin'])
        stub(['git', 'checkout', '--detach', ref])
        if not args.preview and not args.ci_passed:
            stub(['bash', str(TOOLS / 'release/ci-wait.sh'), ref])
        stub(key_command)
        if args.preview:
            stub(['npm', 'run', 'typecheck'])
        stub(['KINGDOWN_STAGE=staging', 'VITE_KINGDOWN_STAGE=staging', 'VITE_SUPABASE_URL=' + STAGING_SUPABASE_URL, *build])
        stub(['KINGDOWN_RELEASE_SITE_ROOT=<build worktree>', *SITE_CHECK] if args.preview else ['npm', 'run', 'check:vercel'])
        stub(GUARD)
        stub(publish)
        stub(alias('<deployment>'))
        stub(['curl', origin + '/'])
        if args.preview:
            stub(['PLAYABLE_URL=' + origin, *SITE_CHECK])
            print(origin)
        return

    common = subprocess.check_output(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=TOOLS, text=True)
    checkout = Path(common.strip()).parent
    root = Path(os.environ.get('KINGDOWN_RELEASE_WORKTREE') or checkout / '.claude/worktrees/release-staging').resolve()
    here = Path(os.environ.get('KINGDOWN_RELEASE_EVIDENCE') or checkout.parent / 'evidence/staging-release')
    assert root not in (checkout.resolve(), TOOLS.parent), 'Use a dedicated staging or preview worktree'
    assert (root / '.git').exists(), f'{root} is not a worktree. Set KINGDOWN_RELEASE_WORKTREE or use tools/wt.sh add release-staging.'

    def git(*git_args):
        return subprocess.check_output(['git', *git_args], cwd=root, text=True).strip()

    lock = (Path(git('rev-parse', '--absolute-git-dir')) / 'kingdown-staging.lock').open('a')
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        parser.exit(1, f'staging: another build holds {root}\n')
    git('fetch', '-q', 'origin')
    source = git('rev-parse', '--verify', '--end-of-options', ref + '^{commit}')
    here.mkdir(parents=True, exist_ok=True)
    evidence = Path(tempfile.mkdtemp(prefix=f'{source[:8]}-', dir=here))
    print(f'staging: {source} -> {evidence}', flush=True)
    out = root / 'kingdown-deploy/.vercel/output'
    record = {'started_at': now(), 'source': source, 'origin': origin}

    def save(name, value):
        (evidence / name).write_text(json.dumps(value, indent=2) + '\n')

    def phase(name):
        record['phase'] = name
        save('progress.json', record)

    def run(command, name, env=None, cwd=root):
        with (evidence / (name + '.log')).open('w') as log:
            subprocess.run(command, cwd=cwd, env=env, stdout=log, stderr=subprocess.STDOUT, check=True)

    try:
        phase('preflight')
        assert not git('status', '--porcelain'), 'The release worktree has changes'
        git('checkout', '-q', '--detach', source)
        if not args.preview and not args.ci_passed:
            phase('ci')
            run(['bash', str(TOOLS / 'release/ci-wait.sh'), source], 'ci', cwd=TOOLS)
        if (root / 'node_modules').is_symlink():
            (root / 'node_modules').unlink()
        if subprocess.run(['npm', 'ls', '--depth=0'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
            phase('npm-ci')
            run(['npm', 'ci'], 'npm-ci')

        key = subprocess.check_output(key_command, text=True).strip()
        env = dict(os.environ, KINGDOWN_STAGE='staging', VITE_KINGDOWN_STAGE='staging',
                   VITE_SUPABASE_URL=STAGING_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY=key)
        if args.preview:
            phase('typecheck')
            run(['npm', 'run', 'typecheck'], 'typecheck', env)
        phase('build')
        run(build, 'build', env)
        engine_dir = out / 'functions/mcp.func/runtime/engines'
        built = sorted(p.name for p in engine_dir.glob('*.mjs'))
        committed = sorted(p.name for p in (root / 'engines').glob('*.mjs'))
        assert built == committed, f'The build holds engine archives {built}. The commit holds {committed}.'
        archives = {name: sha(engine_dir / name) for name in built}
        assert all(value == sha(root / 'engines' / name) for name, value in archives.items()), 'A built engine archive changed'
        assert git('rev-parse', 'HEAD') == source and not git('status', '--porcelain')

        files = ['static/index.html', 'static/next.html', 'static/sw.js', 'functions/mcp.func/board.html',
                 'functions/mcp.func/server.mjs', 'config.json', 'staging.json']
        record.update(preserved_engine_archives=archives, sha256={p: sha(out / p) for p in files if (out / p).is_file()})
        phase('artifact-check')
        if args.preview:
            # The browser check serves this build, with no database or account session.
            run(SITE_CHECK, 'local-site', dict(env, PLAYABLE_URL='', KINGDOWN_RELEASE_SITE_ROOT=str(root)), cwd=TOOLS.parent)
        else:
            checkenv = env.copy()
            checkenv.setdefault('PLUGIN_TEST_DATABASE_URL', 'postgresql://kingdown_test@127.0.0.1:55432/kingdown_release_test')
            run(['bash', 'tools/test-lock.sh', 'npm', 'run', 'check:vercel', '--', str(out)], 'artifact-check', checkenv)
        run(GUARD, 'guard', env)
        phase('publish-preview-target')
        with (evidence / 'deploy.log').open('w') as log:
            proc = subprocess.run(publish, cwd=root, env=env, stdout=subprocess.PIPE, stderr=log, text=True, check=True)
        deployment = json.loads(proc.stdout)
        assert deployment['target'] == 'preview' and deployment['readyState'] == 'READY'
        deployment.update(source=source, published_at=now())
        save('deployment.json', deployment)
        print(f"staging: deployment {deployment['id']}", flush=True)
        phase('assign-alias')
        run(alias(deployment['url']), 'alias', env)
        phase('verify-alias')
        live = verify_alias(out, origin)
        save('live-alias.json', dict(live, verified_at=now()))
        if args.preview:
            phase('remote-site')
            run(SITE_CHECK, 'remote-site', dict(env, PLAYABLE_URL=origin), cwd=TOOLS.parent)
        record.update(deployment=deployment['id'], finished_at=now())
        phase('pass')
        save('done.json', {'exit_code': 0, 'source': source, 'finished_at': now()})
        print(f'staging: pass. {host} serves {source}', flush=True)
        if args.preview:
            print(origin)
    except Exception as error:
        record.update(error=str(error), failed_at=now())
        save('progress.json', record)
        save('done.json', {'exit_code': 1, 'source': source, 'error': str(error), 'finished_at': now()})
        parser.exit(1, f"staging: {record['phase']} failed. {error}\n")


if __name__ == '__main__':
    main()
