"""Copy the frozen movement keys and verified runtime into a private dataset archive."""
import hashlib
import json
import shutil
import sys
import tarfile
from pathlib import Path

catalog, runtime, out = map(Path, sys.argv[1:4])
out.mkdir(parents=True, exist_ok=True)
stage = out / 'payload'
stage.mkdir(exist_ok=True)
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
manifest = json.loads((runtime / 'manifest.json').read_text())
for item in manifest['files']:
    if sha(runtime / item['file']) != item['sha256']:
        raise ValueError('runtime hash mismatch: ' + item['file'])
shutil.copytree(runtime, stage / 'rife', dirs_exist_ok=True, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
entries = []
for entry in json.loads((catalog / 'manifest.json').read_text())['entries']:
    if entry.get('kind') != 'movement-study' or entry.get('status') == 'missing':
        continue
    bank_file = catalog / entry['manifest']
    if sha(bank_file) != entry['sha256']:
        raise ValueError('bank hash mismatch: ' + str(bank_file))
    bank = json.loads(bank_file.read_text())
    frames = []
    for frame in bank['frames']:
        source = (bank_file.parent / frame['imagePath']).resolve()
        digest = sha(source)
        if digest != frame['sha256']:
            raise ValueError('frame hash mismatch: ' + str(source))
        dest = stage / 'keys' / (digest + '.png')
        dest.parent.mkdir(exist_ok=True)
        if not dest.exists():
            shutil.copyfile(source, dest)
        frames.append({'file': 'keys/' + dest.name, 'durationMs': frame['durationMs'], 'pivot': frame['pivot'], 'sha256': digest})
    if len(frames) < 2:
        raise ValueError('movement bank has fewer than two keys: ' + entry['id'])
    entries.append({**{k: entry.get(k) for k in ('character', 'army', 'direction', 'id', 'status')}, 'cycleMs': bank['cycleMs'], 'frames': frames})
(stage / 'entries.json').write_text(json.dumps(entries, indent=2) + '\n')
with tarfile.open(out / 'movement.tar', 'w') as tar:
    tar.add(stage, arcname='movement')
(out / 'dataset-metadata.json').write_text(json.dumps({'title': 'kd-anim-movement-keys-20261030', 'id': 'saarshai/kd-anim-movement-keys-20261030', 'description': 'Private project artwork and runtime; rights remain with their owners.', 'licenses': [{'name': 'other'}], 'is_private': True}, indent=2) + '\n')
print(f"{len(entries)} entries, {sum(len(e['frames']) for e in entries)} keys, {len(list((stage / 'keys').glob('*.png')))} unique files")
