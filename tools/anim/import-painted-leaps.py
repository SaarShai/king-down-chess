#!/usr/bin/env python3
"""Add painted leaps to a scratch copy of the pinned catalog; never write the base."""
import argparse
import hashlib
import json
import io
from pathlib import Path
import shutil
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SELECTION = ROOT / 'docs/specs/character-animation-samples/runtime-selection.json'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def dump(path, value):
    data = (json.dumps(value, indent=2) + '\n').encode()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return digest(data)


def build(args):
    base, out = args.base.resolve(), args.out.resolve()
    catalog = out / 'catalog'
    if base == catalog or base in out.parents or out in base.parents:
        raise ValueError('Output must be outside the base catalog')
    selected = json.loads(SELECTION.read_text())
    base_bytes = (base / 'manifest.json').read_bytes()
    if digest(base_bytes) != selected['catalogSha256']:
        raise ValueError('Base catalog does not match the selection pin')
    if shutil.disk_usage(out.parent).free < 30 * 1024**3:
        raise ValueError('Less than 30 GiB free')
    # The new manifest is a separate file. Every base file stays byte-identical.
    shutil.copytree(base, catalog)
    manifest = json.loads(base_bytes)
    dump(catalog / 'catalogs' / f'{digest(base_bytes)}.json', json.loads(base_bytes))
    counts, skipped = {}, []
    for character, source in [('knight', args.knight), ('paladin', args.paladin)]:
        count = 0
        for army in ['white', 'black']:
            for facing in ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']:
                folder = source / army / facing
                meta_bytes = (folder / 'meta.json').read_bytes()
                meta = json.loads(meta_bytes)
                if meta['verdict'] == 'rejected':
                    skipped.append(f'{character}/{army}/{facing}')
                    continue
                if (meta['character'], meta['army'], meta['facing']) != (character, army, facing):
                    raise ValueError('Wrong bank identity')
                if meta['verdict'] != 'candidate' or len(meta['frames']) != 8:
                    raise ValueError('Unexpected production bank')
                # A transparent margin keeps faint source edge pixels inside the export.
                margin = 4
                frames = []
                for frame in meta['frames']:
                    data = (folder / frame['file']).read_bytes()
                    sha = digest(data)
                    if sha != frame['sha256']:
                        raise ValueError(f'Changed source frame: {folder / frame["file"]}')
                    original = sha
                    with Image.open(io.BytesIO(data)) as image:
                        if image.mode != 'RGBA' or list(image.size) != meta['canvasSize']:
                            raise ValueError('Wrong source canvas or alpha')
                        padded = Image.new('RGBA', (image.width + margin * 2, image.height + margin * 2))
                        padded.paste(image, (margin, margin))
                        buffer = io.BytesIO()
                        padded.save(buffer, format='PNG')
                        data = buffer.getvalue()
                    sha = digest(data)
                    target = catalog / 'assets' / f'{sha}.png'
                    if target.exists():
                        if target.read_bytes() != data:
                            raise ValueError('Changed catalog asset')
                    else:
                        target.write_bytes(data)
                    frames.append({'url': f'../assets/{sha}.png', 'sha256': sha,
                                   'productionSha256': original, 'timeMs': frame.get('timeMs', frame.get('startMs'))})
                if frames[0]['sha256'] != frames[-1]['sha256']:
                    raise ValueError('Standing endpoints differ')
                ident = f'{army}-{"leap" if character == "knight" else "charge"}-{facing}'
                meta_sha = digest(meta_bytes)
                (catalog / 'sources/manifests' / f'{meta_sha}.json').write_bytes(meta_bytes)
                bank = {'id': ident, 'character': character, 'army': army, 'kind': 'movement-study',
                        'status': 'ready', 'direction': facing, 'facing': facing,
                        'canvasSize': [n + margin * 2 for n in meta['canvasSize']], 'footPivot': [n + margin for n in meta['pivot']],
                        'bodyHeightPx': meta['registrationHeightPx'], 'durationMs': meta['durationMs'],
                        'sampling': 'floor', 'beatTimes': {'contact': meta.get('landingMs', meta.get('contactMs'))},
                        'frames': frames}
                correction = meta.get('numericPath', {}).get('contactCorrection')
                if correction:
                    bank['contactCorrection'] = [*correction['intervalMs'], correction['offsetGamePx']]
                data = (json.dumps(bank, indent=2) + '\n').encode()
                sha = digest(data)
                (catalog / 'banks' / f'{sha}.json').write_bytes(data)
                entry = {'character': character, 'army': army, 'kind': 'movement-study', 'id': ident,
                         'direction': facing, 'status': 'ready', 'inputStatus': meta['verdict'],
                         'manifest': f'banks/{sha}.json', 'sha256': sha,
                         'sourceManifest': f'sources/manifests/{meta_sha}.json', 'sourceManifestSha256': meta_sha}
                previous = next((e for e in manifest['entries'] if (e['character'], e['army'], e['id']) == (character, army, ident)), None)
                if previous and previous != entry:
                    raise ValueError('Existing leap bank changed; use a new id')
                if not previous:
                    manifest['entries'].append(entry)
                    selected['entries'].append({k: entry[k] for k in ['character', 'army', 'kind', 'id', 'direction', 'manifest', 'sha256']})
                count += 1
        counts[character] = count
    pin = dump(catalog / 'manifest.json', manifest)
    shutil.copy2(catalog / 'manifest.json', catalog / 'catalogs' / f'{pin}.json')
    selected['catalogSha256'] = pin
    dump(out / 'runtime-selection.json', selected)
    # Check the superset before the selection can enter Git.
    for path in base.rglob('*'):
        if path.is_file() and path.relative_to(base) != Path('manifest.json'):
            if digest(path.read_bytes()) != digest((catalog / path.relative_to(base)).read_bytes()):
                raise ValueError(f'Base file changed: {path.relative_to(base)}')
    report = {'baseSha256': digest(base_bytes), 'catalogSha256': pin, 'banks': counts,
              'skipped': skipped, 'selectedBanks': len(selected['entries']), 'baseFilesUnchanged': True}
    dump(out / 'import-report.json', report)
    if args.runtime:
        for name in ['alpha-recovery-review', 'army-effects-review', 'directional-attacks']:
            if not (out / name).exists():
                (out / name).symlink_to(base.parent / name, target_is_directory=True)
        png, webp = out / 'runtime-png', out / 'runtime-webp'
        if args.png_cache:
            shutil.copytree(args.png_cache, png)
        subprocess.run(['node', 'tools/build-character-runtime.mjs', '--source', str(catalog), '--output', str(png),
                        '--selection', str(out / 'runtime-selection.json')], cwd=ROOT, check=True)
        subprocess.run(['node', 'tools/convert-character-runtime-webp.mjs', str(png), str(webp),
                        '--cache', str(ROOT / 'public/character-runtime')], cwd=ROOT, check=True)
        if args.apply:
            shutil.copytree(webp, ROOT / 'public/character-runtime', dirs_exist_ok=True)
    if args.apply:
        shutil.copy2(out / 'runtime-selection.json', SELECTION)
    print(json.dumps(report))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--knight', type=Path, default=Path.home() / 'kd-runs/leap-knight-prod')
    parser.add_argument('--paladin', type=Path, default=Path.home() / 'kd-runs/leap-paladin-prod')
    parser.add_argument('--png-cache', type=Path)
    parser.add_argument('--runtime', action='store_true')
    parser.add_argument('--apply', action='store_true')
    build(parser.parse_args())
