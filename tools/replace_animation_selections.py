"""Adopt verified replacement banks without reimporting the animation catalog.

python3 -B tools/replace_animation_selections.py --catalog preview/manifest.json --inputs verified.json ...
Each ready audit entry adds expectedOldId, expectedOldBankSha256 and nonempty
evidence records with path and sha256. Relative evidence paths use the report folder.
"""
import argparse
import copy
import json
import re
import tempfile
from pathlib import Path

from consolidate_animation_banks import catalog_lock, consolidate, digest, encoded, freeze


IDENTITY_FIELDS = ('character', 'army', 'kind', 'action', 'direction', 'from', 'to')


def prepare(inputs, staging):
    consolidate(inputs, staging)
    staged = json.loads((staging / 'manifest.json').read_bytes())
    replacements = []
    for report in staged['reports']:
        audit = json.loads((staging / report['url']).read_bytes())
        for row in audit['entries']:
            candidate = staged['entries'][len(replacements)]
            source = json.loads((staging / candidate['sourceManifest']).read_bytes())
            for key in IDENTITY_FIELDS:
                if source.get(key) is None or source[key] == candidate.get(key):
                    continue
                # Guard turn banks use the verified edge label as their legacy action.
                if key == 'action' and candidate.get('kind') == 'turn' and source[key] == f"{candidate.get('from')}-{candidate.get('to')}":
                    continue
                raise ValueError(f'Source identity differs from audited selection: {key}')
            if row.get('status') != 'ready' or source.get('status') != 'ready' or candidate['status'] != 'ready':
                raise ValueError('Replacement requires ready source and audit status; no status promotion')
            if any(record.get(key) for record in (row, source, candidate) for key in ('defects', 'knownDefects')):
                raise ValueError('Replacement candidate has known defects')
            old_id, old_sha = row.get('expectedOldId'), row.get('expectedOldBankSha256')
            if not isinstance(old_id, str) or not old_id.strip() or not isinstance(old_sha, str) or not re.fullmatch('[a-f0-9]{64}', old_sha):
                raise ValueError('Replacement requires expectedOldId and exact expectedOldBankSha256')
            evidence = row.get('evidence')
            if not isinstance(evidence, list) or not evidence:
                raise ValueError('Replacement requires hashed verification evidence')
            frozen = []
            for item in evidence:
                if not isinstance(item, dict) or not isinstance(item.get('path'), str) or not item['path'] or not isinstance(item.get('sha256'), str):
                    raise ValueError('Evidence requires a local path and sha256')
                path = Path(item['path'])
                if not path.is_absolute():
                    path = Path(report['sourcePath']).parent / path
                raw = path.read_bytes()
                if digest(raw) != item['sha256']:
                    raise ValueError(f'{path}: verification evidence hash differs')
                url, sha = freeze(staging, 'sources/evidence', raw, path.suffix)
                frozen.append({'url': url, 'sha256': sha})
            candidate['replacement'] = {'expectedOldId': old_id, 'expectedOldBankSha256': old_sha,
                                        'candidateId': candidate['id'], 'evidence': frozen}
            candidate['id'] = old_id
            replacements.append(candidate)
    if not replacements or len({(e['id'], e['replacement']['expectedOldBankSha256']) for e in replacements}) != len(replacements):
        raise ValueError('Replacement report must contain distinct old targets')
    return staged['reports'], replacements


def selected_files(staging, entry):
    paths = {entry[key] for key in ('manifest', 'sourceManifest', 'auditReport')}
    paths.update(item['url'] for item in entry['replacement']['evidence'])

    def assets(value):
        if isinstance(value, dict):
            for child in value.values():
                assets(child)
        elif isinstance(value, list):
            for child in value:
                assets(child)
        elif isinstance(value, str) and value.startswith('../assets/'):
            paths.add(value[3:])

    assets(json.loads((staging / entry['manifest']).read_bytes()))
    return paths


def replace(catalog_path, inputs):
    catalog_path = Path(catalog_path).resolve()
    root = catalog_path.parent
    with tempfile.TemporaryDirectory(prefix='kingdown-replacements-') as name:
        staging = Path(name)
        reports, replacements = prepare(inputs, staging)
        with catalog_lock(root):
            before = catalog_path.read_bytes()
            catalog = json.loads(before)
            updates = []
            for candidate in replacements:
                expected = candidate['replacement']['expectedOldBankSha256']
                selected = [(index, entry) for index, entry in enumerate(catalog['entries'])
                            if entry.get('id') == candidate['id'] and (entry['sha256'] == expected
                            or entry.get('replacement', {}).get('expectedOldBankSha256') == expected)]
                if len(selected) != 1:
                    raise ValueError(f"Expected old bank hash is stale or target is not uniquely selected: {candidate['id']}")
                index, current = selected[0]
                if any(old_index == index for old_index, _, _ in updates):
                    raise ValueError('Replacement report must contain distinct old targets')
                if any(current.get(key) != candidate.get(key) for key in IDENTITY_FIELDS):
                    raise ValueError(f"Replacement identity differs from old target: {candidate['id']}")
                replay = current == candidate
                if not replay and current['sha256'] != expected:
                    raise ValueError(f"Expected old bank hash is stale: {candidate['id']}")
                if digest((root / current['manifest']).read_bytes()) != current['sha256']:
                    raise ValueError(f"Selected bank hash differs: {candidate['id']}")
                updates.append((index, candidate, replay))

            # Check replays before copying anything, including missing provenance or PNGs.
            for _, candidate, replay in updates:
                if replay:
                    for relative in selected_files(staging, candidate):
                        path = root / relative
                        if not path.is_file() or path.read_bytes() != (staging / relative).read_bytes():
                            raise ValueError(f'{path}: selected replacement bytes differ or are missing')
            changed = sum(not replay for _, _, replay in updates)
            if not changed:
                return {'changed': 0, 'entries': len(catalog['entries']),
                        'catalog': f'catalogs/{digest(before)}.json', 'sha256': digest(before)}

            for index, candidate, replay in updates:
                if not replay:
                    for relative in sorted(selected_files(staging, candidate)):
                        path = Path(relative)
                        url, _ = freeze(root, str(path.parent), (staging / relative).read_bytes(), path.suffix)
                        if url != relative:
                            raise ValueError('Staged file is not content addressed')
                    catalog['entries'][index] = copy.deepcopy(candidate)
            for report in reports:
                if report not in catalog.setdefault('reports', []):
                    catalog['reports'].append(report)
            freeze(root, 'catalogs', before, '.json')
            result = encoded(catalog)
            url, sha = freeze(root, 'catalogs', result, '.json')
            if catalog_path.read_bytes() != before:
                raise ValueError('Catalog changed during replacement; retry against the current selection')
            temp = None
            try:
                with tempfile.NamedTemporaryFile(dir=root, prefix='.replacement-', delete=False) as handle:
                    handle.write(result)
                    temp = Path(handle.name)
                temp.replace(catalog_path)
            finally:
                if temp and temp.exists():
                    temp.unlink()
            return {'changed': changed, 'entries': len(catalog['entries']), 'catalog': url, 'sha256': sha}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--inputs', nargs='+', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(replace(args.catalog, args.inputs)))
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
