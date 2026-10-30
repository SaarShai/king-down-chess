"""Publish one accepted candidate bank into the frozen catalog, under the shared catalog lock."""
import argparse
import fcntl
import hashlib
import json
from pathlib import Path


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def encoded(value) -> bytes:
    return (json.dumps(value, indent=2) + '\n').encode()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--bank', type=Path, required=True)
    parser.add_argument('--frames', type=Path, required=True)
    parser.add_argument('--entry', type=Path, required=True)
    args = parser.parse_args()
    catalog_dir = args.catalog.resolve()
    (catalog_dir / 'assets').mkdir(parents=True, exist_ok=True)
    (catalog_dir / 'banks').mkdir(parents=True, exist_ok=True)
    bank = json.loads(args.bank.read_text())
    entry = json.loads(args.entry.read_text())
    if bank.get('status') != 'candidate':
        raise ValueError(f"Candidate bank status is {bank.get('status')}")
    if bank.get('id') != entry['id']:
        raise ValueError('Bank and entry ids differ')
    with (catalog_dir / '.catalog.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        for frame in bank['frames']:
            source = args.frames / frame['url']
            raw = source.read_bytes()
            if digest(raw) != frame['sha256']:
                raise ValueError(f"Frame hash mismatch before publish: {source.name}")
            target = catalog_dir / 'assets' / f"{frame['sha256']}.png"
            if target.exists() and digest(target.read_bytes()) != frame['sha256']:
                raise ValueError(f"Frozen asset hash differs: {target.name}")
            target.write_bytes(raw)
        published = {**bank, 'status': 'ready'}
        for frame in published['frames']:
            frame['url'] = f"../assets/{frame['sha256']}.png"
        raw = encoded(published)
        bank_sha = digest(raw)
        (catalog_dir / 'banks' / f'{bank_sha}.json').write_bytes(raw)
        manifest_path = catalog_dir / 'manifest.json'
        manifest = json.loads(manifest_path.read_bytes()) if manifest_path.exists() else {
            'schemaVersion': 1, 'purpose': 'Frozen animation review; statuses are retained or demoted, never promoted.', 'reports': [], 'entries': []}
        record = {
            'character': entry['character'], 'army': entry['army'], 'kind': entry['kind'],
            'action': entry.get('action'), 'direction': entry.get('direction'),
            'from': entry.get('from'), 'to': entry.get('to'), 'id': entry['id'],
            'status': 'ready', 'inputStatus': 'ready', 'defects': [], 'statusReason': None,
            'manifest': f'banks/{bank_sha}.json', 'sha256': bank_sha,
            'sourceManifest': None, 'sourceManifestSha256': None,
            'auditReport': None, 'auditPointer': None,
            'promotedBy': 'tools/anim/promote.mjs',
        }
        entries = manifest.setdefault('entries', [])
        index = next((position for position, row in enumerate(entries)
                      if (row.get('character'), row.get('army'), row.get('id')) == (entry['character'], entry['army'], entry['id'])), None)
        if index is None:
            entries.append(record)
        else:
            entries[index] = {**entries[index], **record}
        raw = encoded(manifest)
        temporary = catalog_dir / 'manifest.json.tmp'
        temporary.write_bytes(raw)
        temporary.replace(manifest_path)
        print(json.dumps({'catalog': str(catalog_dir), 'catalogSha256': digest(raw), 'entry': record,
                          'entryIndex': index if index is not None else len(entries) - 1,
                          'banks': len(entries), 'bankSha256': bank_sha}))


if __name__ == '__main__':
    main()
