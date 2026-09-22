"""Run a bounded, auditable M1 execution check after model inference is unloaded."""
import datetime
import fcntl
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import time

workspace = Path('/Users/new/projects/king-down-supervised-20260921')
control = Path(str(workspace) + '-control')
output = control / 'worker-validation-20260922'
output.mkdir(exist_ok=False)
lock = open(control / 'runner.lock', 'a')
fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
assert json.loads((control / 'runner-state.json').read_text())['state'] == 'agent_exited'
env = {**os.environ, 'PATH': '/usr/local/bin:/usr/bin:/bin'}
checks = []
def execute(name, command, timeout=90):
    started = time.monotonic()
    with (output / (name + '.log')).open('w') as log:
        p = subprocess.Popen(command, cwd=workspace, env=env, stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
        try:
            code = p.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            os.killpg(p.pid, signal.SIGTERM)
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(p.pid, signal.SIGKILL)
                p.wait()
            code = 'timeout'
    check = {'name': name, 'command': command, 'returnCode': code, 'seconds': round(time.monotonic() - started, 3), 'pid': p.pid, 'log': name + '.log'}
    checks.append(check)
    (output / 'commands.json').write_text(json.dumps(checks, indent=2) + '\n')
    print(json.dumps(check), flush=True)
    if code != 0:
        raise SystemExit('Stopped on failed check; logs and any records preserved.')
assert not subprocess.run(['git', 'diff', '--name-only', 'HEAD', '--', 'src'], cwd=workspace, capture_output=True, text=True, check=True).stdout.strip()
ps = subprocess.run(['/Applications/Ollama.app/Contents/Resources/ollama', 'ps'], capture_output=True, text=True, check=True).stdout
(output / 'ollama-before.txt').write_text(ps)
assert len(ps.strip().splitlines()) <= 1, 'Run with all inference unloaded; do not stop unrelated models.'
resolved = subprocess.run(['./node_modules/.bin/tsx', '-e', "import { DEFAULT_RULES } from './src/rules/rules'; console.log(JSON.stringify(DEFAULT_RULES))"], cwd=workspace, env=env, capture_output=True, text=True, check=True)
rules = json.loads(resolved.stdout)
spec = {'id': 'placeholder', 'games': 8, 'backRanks': ['RNBQKBNR', 'KQRBNMAG', 'KSRBNMAG', 'AAGGKMMS'], 'ai': {'depth': 1}, 'rules': rules, 'seed': 722091, 'pairs': True, 'openingRandomPlies': 4, 'maxPlies': 40, 'adjudicate': False}
files = []
execute('typescript', ['./node_modules/.bin/tsc', '--noEmit'])
execute('targeted-tests', ['./node_modules/.bin/vitest', 'run', 'src/sim/identity.test.ts', 'src/sim/replay.test.ts', 'src/sim/sim.test.ts'])
for label, workers in [('a', 1), ('b', 1), ('c', 2)]:
    spec = {**spec, 'id': f'm1-worker-validation-20260922-{label}'}
    specfile = output / (label + '.spec.json')
    specfile.write_text(json.dumps(spec, indent=2) + '\n')
    recordfile = workspace / 'sim/out' / (spec['id'] + '.jsonl')
    assert not recordfile.exists(), 'Never silently append or rerun an existing validation ID.'
    execute('run-' + label, ['./node_modules/.bin/tsx', 'src/sim/run.ts', '--spec', str(specfile), '--workers', str(workers)])
    files.append(str(recordfile))
execute('audit', ['./node_modules/.bin/tsx', str(control / 'audit-worker-validation.ts'), *files, str(output / 'audit.json')])
manifest = {}
for file in files:
    p = Path(file)
    manifest[str(p)] = {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
    (output / p.name).write_bytes(p.read_bytes())
(output / 'manifest.json').write_text(json.dumps({'completed': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'recordFiles': manifest, 'purpose': '24 short execution-validation records; not rule-study games'}, indent=2) + '\n')
print('VALIDATED', flush=True)
