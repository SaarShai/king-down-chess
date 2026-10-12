"""One approved two-hour M1 rules test. No resume or automatic retry."""
import datetime
import hashlib
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time


def save(path, value):
    Path(path).write_text(json.dumps(value, indent=2) + '\n')


def kill_group(child):
    try:
        os.killpg(child.pid, signal.SIGKILL)
    except ProcessLookupError:
        pass
    child.wait()


if '--self-check' in sys.argv:
    with tempfile.TemporaryDirectory() as folder:
        marker = str(Path(folder) / 'escaped')
        grandchild = 'import time,pathlib;time.sleep(.4);pathlib.Path(' + repr(marker) + ').touch()'
        parent = 'import subprocess,sys,time;subprocess.Popen([sys.executable,"-c",' + repr(grandchild) + ']);print("ready",flush=True);time.sleep(30)'
        child = subprocess.Popen([sys.executable, '-c', parent], stdout=subprocess.PIPE, start_new_session=True)
        assert child.stdout.readline() == b'ready\n'
        kill_group(child)
        time.sleep(.5)
        assert not Path(marker).exists(), 'Grandchild escaped the process-group deadline'
    print('Process-group deadline control passes')
    sys.exit(0)

name, config_path = sys.argv[1:]
cfg = json.loads(Path(config_path).read_text())
assert name == cfg['id'] == 'fairy-rules-stress-recheck-20261012'
assert cfg['hardSeconds'] == 7200 and cfg['workerSeconds'] == 7120
assert len(cfg['seeds']) == len(set(cfg['seeds'])) == 4
assert cfg['approval']['quote'] == "go ahead with the fresh two-hour M1 run using the repaired checker. keep Kaggle going, only check at expected completion times, and don't merge yet."
for path, expected in cfg['files'].items():
    assert hashlib.sha256(Path(path).read_bytes()).hexdigest() == expected, 'Input differs: ' + path
out = Path('out')
out.mkdir()  # Exclusive: preserve an earlier attempt.
save(out / 'campaign.json', cfg)
start = time.monotonic()
state = dict(id=name, approval=cfg['approval'], sourceCommit=cfg['sourceCommit'], startedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), hardSeconds=7200, exit=None)
save(out / 'status.json', state)
children, logs = [], []
caffeinate = subprocess.Popen(['/usr/bin/caffeinate', '-i', '-w', str(os.getpid())])
try:
    for i, seed in enumerate(cfg['seeds']):
        log = (out / ('worker-' + str(i) + '.log')).open('xb'); logs.append(log)
        children.append(subprocess.Popen(['node', '--import', 'tsx', 'tools/fairy-stockfish-stress.ts', 'native/stockfish', str(out / ('worker-' + str(i))), str(seed), str(cfg['workerSeconds'])], stdin=subprocess.DEVNULL, stdout=log, stderr=subprocess.STDOUT, start_new_session=True))
    while any(child.poll() is None for child in children):
        if any(child.poll() not in (None, 0) for child in children):
            raise RuntimeError('A worker fails; preserve all streams')
        if time.monotonic() - start >= cfg['hardSeconds']:
            raise TimeoutError('Hard two-hour process-group deadline')
        time.sleep(1)
    assert all(child.returncode == 0 for child in children)
    rows = [json.loads((out / ('worker-' + str(i)) / 'complete.json').read_text()) for i in range(4)]
    for i, row in enumerate(rows):
        assert row['pass'] and row['seed'] == cfg['seeds'][i] and row['seconds'] == cfg['workerSeconds']
        assert row['elapsedSeconds'] >= cfg['workerSeconds'] and not row['stopped']
        assert row['sourceId'] == cfg['sourceId'] and row['binarySha256'] == cfg['files']['native/stockfish']
    save(out / 'complete.json', {'pass': True, 'workers': rows, 'counts': {key: sum(row[key] for row in rows) for key in ['positions', 'effects', 'turns', 'traces', 'undos']}})
    state['exit'] = 0
except BaseException as error:
    state.update(exit=1, error=type(error).__name__ + ': ' + str(error))
    raise
finally:
    for child in children:
        kill_group(child)
    caffeinate.terminate(); caffeinate.wait()
    for log in logs:
        log.close()
    state.update(seconds=time.monotonic() - start, finishedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
    save(out / 'status.json', state)
    save(out / 'output-hashes.json', {str(path.relative_to(out)): hashlib.sha256(path.read_bytes()).hexdigest() for path in sorted(out.rglob('*')) if path.is_file() and path.name != 'output-hashes.json'})
