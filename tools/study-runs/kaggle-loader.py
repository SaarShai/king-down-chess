"""Load an exact private dataset before importing any executable payload."""
import hashlib, json, pathlib, sys, time

# RUN_BINDING

def stage(bound, input_root, work):
    root = pathlib.Path(input_root).resolve()
    names = {'source.bin':'source.tar.gz', 'bundle.bin':'bundle.json', 'supervisor.bin':'supervisor.py', 'config.bin':'config.json'}
    if set(bound['files']) != set(names): raise RuntimeError('Unexpected payload manifest')
    candidates = [p.parent for p in root.rglob('source.bin') if bound['dataset'] in p.relative_to(root).parts]
    if len(candidates) != 1: raise RuntimeError('Dataset mount is missing or ambiguous')
    data = {}
    for name in names:
        path = candidates[0] / name
        path.resolve().relative_to(root)
        expected = bound['files'][name]
        if not path.is_file() or path.stat().st_size != expected['bytes']: raise RuntimeError('Dataset payload size differs')
        raw = path.read_bytes()
        if hashlib.sha256(raw).hexdigest() != expected['sha256']: raise RuntimeError('Dataset payload hash differs')
        data[name] = raw
    work = pathlib.Path(work)
    work.mkdir(exist_ok=False)
    for name, target in names.items(): (work/target).write_bytes(data[name])
    return json.loads(data['config.bin'])

if __name__ == '__main__':
    started = time.monotonic()
    work = pathlib.Path('/tmp/king-down-study')
    config = stage(BOUND, '/kaggle/input', work)
    config['_startedMonotonic'] = started
    sys.path.insert(0, str(work))
    from supervisor import run
    raise SystemExit(run(config))
