#!/usr/bin/env python3
"""Copy the painted walk catalog and prove that it rebuilds the shipped package."""
import argparse
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BASE = '6279af2ef76ba46d75ba10ad5ddc822c67c5d5d78897457a1d13cc6893aed241'
SELECTION = ROOT / 'docs/specs/character-animation-samples/runtime-selection.json'
PACKAGE = ROOT / 'public/character-runtime'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def atomic(path, data):
    tmp = path.with_name(path.name + '.painted-next')
    tmp.write_bytes(data)
    os.replace(tmp, path)


def files(path):
    return {p.relative_to(path): digest(p.read_bytes()) for p in path.rglob('*') if p.is_file()}


def promote(candidate, target):
    candidate = candidate.resolve()
    target = target.resolve()
    if candidate == target:
        raise ValueError('Candidate and target must differ')
    if shutil.disk_usage('/').free < 31 * 1024**3:
        raise ValueError('Need 31 GiB free for the rebuild and the 30 GiB floor')
    selection = json.loads(SELECTION.read_bytes())
    proposed = (candidate / 'manifest.json').read_bytes()
    proposed_sha = digest(proposed)
    if proposed_sha != selection['catalogSha256']:
        raise ValueError('Candidate catalog does not match the selection')
    catalog = json.loads(proposed)
    moves = [e for e in catalog['entries'] if e['kind'] == 'move']
    if len(moves) != 196:
        raise ValueError('Expected 196 source move banks')
    with (target / '.catalog.lock').open('a+b') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        previous = (target / 'manifest.json').read_bytes()
        previous_sha = digest(previous)
        if previous_sha not in (BASE, proposed_sha):
            raise ValueError('Target catalog changed; rebuild the candidate against it')
        if previous_sha == BASE:
            base = json.loads(previous)
            if [e for e in catalog['entries'] if e['kind'] != 'move'] != base['entries']:
                raise ValueError('Candidate changes the base catalog')
        for entry in moves:
            bank_hash = entry['sha256']
            if not re.fullmatch(r'[0-9a-f]{64}', bank_hash) or entry['manifest'] != f'banks/{bank_hash}.json':
                raise ValueError('Invalid bank path')
            data = (candidate / entry['manifest']).read_bytes()
            if digest(data) != bank_hash:
                raise ValueError('Candidate bank hash mismatch')
            bank = json.loads(data)
            for frame in bank['frames']:
                frame_hash = frame['sha256']
                if not re.fullmatch(r'[0-9a-f]{64}', frame_hash) or digest((target / 'assets' / f'{frame_hash}.png').read_bytes()) != frame_hash:
                    raise ValueError('Target frame missing or changed')
            destination = target / entry['manifest']
            if destination.exists():
                if digest(destination.read_bytes()) != bank_hash:
                    raise ValueError('Target bank hash mismatch')
            else:
                destination.write_bytes(data)
        (target / 'catalogs').mkdir(exist_ok=True)
        snapshot = target / 'catalogs' / f'{proposed_sha}.json'
        if snapshot.exists() and snapshot.read_bytes() != proposed:
            raise ValueError('Target catalog snapshot changed')
        atomic(snapshot, proposed)
        try:
            atomic(target / 'manifest.json', proposed)
            with tempfile.TemporaryDirectory(prefix='kingdown-walk-promotion-') as tmp:
                png, webp = Path(tmp) / 'png', Path(tmp) / 'webp'
                subprocess.run(['node', str(ROOT / 'tools/build-character-runtime.mjs'), '--source', str(target), '--output', str(png)], cwd=ROOT, check=True)
                subprocess.run(['node', str(ROOT / 'tools/convert-character-runtime-webp.mjs'), str(png), str(webp)], cwd=ROOT, check=True)
                if files(webp) != files(PACKAGE):
                    raise ValueError('Rebuilt package differs from the shipped package')
        except BaseException:
            if previous_sha != proposed_sha:
                atomic(target / 'manifest.json', previous)
            raise
    print(f'Promoted {len(moves)} move banks; the rebuilt package matches byte for byte.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--target', type=Path, required=True)
    args = parser.parse_args()
    promote(args.candidate, args.target)
