#!/usr/bin/env python3
"""Own the run process group and its setup-to-finish time limit."""
import hashlib, json, os, platform, signal, subprocess, sys, tarfile, time, urllib.request
from pathlib import Path

MAX_DOWNLOAD = 150 * 1024 * 1024
MAX_LOG = 16 * 1024 * 1024

def download(url, target, deadline, limit=MAX_DOWNLOAD):
    with urllib.request.urlopen(url, timeout=min(30, max(1, deadline-time.monotonic()))) as src, target.open('xb') as dst:
        size = 0
        while True:
            if time.monotonic() >= deadline: raise TimeoutError('download time limit')
            block = src.read(1024*1024)
            if not block: break
            size += len(block)
            if size > limit: raise RuntimeError('download byte limit')
            dst.write(block)

def unpack(archive, target, links=False):
    with tarfile.open(archive) as tar:
        members=[];size=0
        for member in tar:
            members.append(member);size+=member.size
            if len(members)>20000 or size>512*1024*1024: raise RuntimeError('archive size limit')
            path = Path(member.name)
            if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir() or links and member.issym()):
                raise RuntimeError('unsafe archive member')
            if member.issym():
                (target/path.parent/member.linkname).resolve().relative_to(target.resolve())
        tar.extractall(target,members=members)

def ensure_runtime(root, version, deadline):
    import re
    root=Path(root).resolve();root.mkdir(parents=True,exist_ok=True)
    if not re.fullmatch(r'v?\d+\.\d+\.\d+', version): raise RuntimeError('invalid Node version')
    version = version.removeprefix('v')
    system = {'Darwin':'darwin','Linux':'linux'}[platform.system()]
    arch = {'arm64':'arm64','aarch64':'arm64','x86_64':'x64'}[platform.machine()]
    name = 'node-v'+version+'-'+system+'-'+arch
    archive = root/(name+'.tar.gz')
    checks = root/'SHASUMS256.txt'
    base = 'https://nodejs.org/dist/v'+version+'/'
    download(base+'SHASUMS256.txt', checks, deadline, 1024*1024)
    download(base+archive.name, archive, deadline)
    entries = dict(line.split()[::-1] for line in checks.read_text().splitlines() if len(line.split())==2)
    if hashlib.sha256(archive.read_bytes()).hexdigest() != entries.get(archive.name): raise RuntimeError('Node checksum differs')
    unpack(archive, root, links=True)
    return root/name/'bin'/'node'

def verify_dispatch(config, root):
    bundle_path=root/'bundle.json';archive=root/'source.tar.gz'
    if bundle_path.is_symlink() or archive.is_symlink() or bundle_path.stat().st_size>64*1024*1024 or archive.stat().st_size>64*1024*1024:raise RuntimeError('Invalid payload file')
    raw=bundle_path.read_bytes();bundle=json.loads(raw)
    if bundle['hash']!=config['bundleHash'] or bundle['id']!=config['runId'] or bundle['nodeVersion']!=config['nodeVersion']:raise RuntimeError('Dispatch bundle identity differs')
    parts=[p for p in bundle['parts'] if p['id']==config['partId']]
    if len(parts)!=1 or parts[0]['machine']!=config['machine'] or parts[0]['workers']!=config['workers']:raise RuntimeError('Dispatch part differs')
    if hashlib.sha256(raw).hexdigest()!=config['bundleBytesSha256']:raise RuntimeError('Dispatch bundle bytes differ')
    sha=hashlib.sha256()
    with archive.open('rb') as src:
        for block in iter(lambda:src.read(1024*1024),b''):sha.update(block)
    if sha.hexdigest()!=bundle['sourceArchiveSha256'] or sha.hexdigest()!=config['sourceArchiveSha256']:raise RuntimeError('Dispatch source archive differs')
    return bundle

def run(config):
    started = config.get('_startedMonotonic', time.monotonic())
    deadline = started + min(28800, config['limitSeconds'])
    root = Path(config['directory']).resolve()
    out = Path(config.get('outputDirectory', str(root/'out'))); out.mkdir(exist_ok=True)
    receipt = out/'supervisor.json'
    child = None
    def deadline_signal(*_): raise TimeoutError('run time limit')
    previous=signal.signal(signal.SIGALRM,deadline_signal)
    signal.setitimer(signal.ITIMER_REAL,max(.001,deadline-time.monotonic()))
    def unlock():
        if 'activeLock' in config:
            lock=Path(config['activeLock'])
            if (lock/'owner').read_text()==str(root):
                (lock/'owner').unlink();lock.rmdir()
    def save(state, **extra):
        value = dict(state=state, elapsedSeconds=time.monotonic()-started, **extra)
        temp = receipt.with_suffix('.tmp'); temp.write_text(json.dumps(value)); temp.replace(receipt)
    def stop():
        if child is not None:
            try: os.killpg(child.pid, signal.SIGTERM)
            except ProcessLookupError: return
            try: child.wait(timeout=3)
            except subprocess.TimeoutExpired: pass
            try: os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError: pass
            child.wait(timeout=3)
    def command(args, cwd, env):
        nonlocal child
        # Drain output continuously. Keep a bounded log; discard excess bytes.
        with (out/'supervisor.log').open('ab') as log:
            child = subprocess.Popen(args, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, start_new_session=True)
            import selectors
            selector = selectors.DefaultSelector(); selector.register(child.stdout, selectors.EVENT_READ)
            while selector.get_map():
                if time.monotonic() >= deadline: stop(); raise TimeoutError('run time limit')
                if sum(p.stat().st_size for p in out.iterdir() if p.is_file())>512*1024*1024: stop(); raise RuntimeError('output byte limit')
                for key, _ in selector.select(.2):
                    block = os.read(key.fd, 65536)
                    if not block: selector.unregister(key.fileobj); continue
                    left = MAX_LOG-log.tell()
                    if left > 0: log.write(block[:left]); log.flush()
            code = child.wait(timeout=max(.1, deadline-time.monotonic()))
            if code: raise RuntimeError('child exit '+str(code))
    try:
        save('running')
        verify_dispatch(config,root)
        node=ensure_runtime(root,config['nodeVersion'],deadline)
        env = dict(os.environ, PATH=str(node.parent)+os.pathsep+os.environ.get('PATH',''))
        source = root/'source'; source.mkdir()
        unpack(root/'source.tar.gz', source)
        command(['npm','ci','--no-audit','--no-fund','--loglevel=error'], source, env)
        command(['node','--import','tsx','src/sim/study-runner.ts','--bundle',str(root/'bundle.json'),'--part',config['partId'],'--out',str(out)], source, env)
        save('complete')
        unlock()
        signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,previous)
    except BaseException as error:
        signal.setitimer(signal.ITIMER_REAL,0);signal.signal(signal.SIGALRM,previous)
        stop()
        save('failed', timeout=isinstance(error, (TimeoutError, subprocess.TimeoutExpired)), message=type(error).__name__)
        try: unlock()
        except OSError: pass
        return 1
    return 0

if __name__ == '__main__':
    sys.exit(run(json.loads(Path(sys.argv[1]).read_text())))
