"""Inventory movement studies. Usage: python3 tools/animation-coverage.py CATALOG RUNTIME

Catalog statuses and package membership are evidence, not visual or game acceptance.
"""
import collections
import hashlib
import itertools
import json
import sys
from pathlib import Path

CHARACTERS = ('pawn', 'knight', 'bishop', 'rook', 'queen', 'archer', 'paladin',
              'maester', 'beast', 'ogre', 'guard', 'king-frost', 'king-flame',
              'king-shadow', 'king-mud', 'king-spirit', 'king-stratus')
ARMIES = ('white', 'black')
DIRECTIONS = ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def inventory(catalog_path, runtime_path):
    catalog_path, runtime_path = Path(catalog_path), Path(runtime_path)
    catalog_raw, runtime_raw = catalog_path.read_bytes(), runtime_path.read_bytes()
    catalog, runtime = json.loads(catalog_raw), json.loads(runtime_raw)
    expected = set(itertools.product(CHARACTERS, ARMIES, DIRECTIONS))
    cases = collections.defaultdict(list)
    sheets = set()
    with_sheets = 0
    records = collections.Counter()
    for entry in catalog['entries']:
        if entry['kind'] != 'movement-study':
            continue
        key = (entry['character'], entry['army'], entry['direction'])
        if key not in expected:
            raise ValueError(f'unexpected movement case: {key}')
        status = entry['status']
        if status not in ('ready', 'awaiting-human-playback-review', 'draft', 'needs-repair', 'missing'):
            raise ValueError(f'unexpected movement status: {status}')
        raw = (catalog_path.parent / entry['manifest']).read_bytes()
        if digest(raw) != entry['sha256']:
            raise ValueError(f"bank hash mismatch: {entry['manifest']}")
        bank = json.loads(raw)
        if bank.get('status') != status:
            raise ValueError(f"bank status mismatch: {entry['manifest']}")
        cases[key].append(status)
        records[status] += 1
        hashes = {f['sourceSheetSha256'] for f in bank.get('frames', [])
                  if isinstance(f, dict) and f.get('sourceSheetSha256')}
        sheets.update(hashes)
        with_sheets += bool(hashes)
    packaged = [bank for bank in runtime['banks'] if bank['kind'] in ('movement', 'movement-study')]
    # Mismatched inputs do not prove coverage or reuse; neither input does so alone.
    no_ready_or_packaged = not records['ready'] and not packaged
    coverage = 0 if no_ready_or_packaged else None
    duplicate_cases = {':'.join(k): v for k, v in sorted(cases.items()) if len(v) > 1}
    absent = [':'.join(k) for k in sorted(expected - cases.keys())]
    return {
        'catalogSha256': digest(catalog_raw), 'runtimeSha256': digest(runtime_raw),
        'requiredCases': len(expected), 'recordsByStatus': dict(sorted(records.items())),
        'casesByStatus': {status: sum(status in statuses for statuses in cases.values())
                          for status in sorted(records)},
        'duplicateCases': duplicate_cases, 'absentCases': absent,
        'authoredPoseSets': None,
        'selectedFrameSourceSheetHashes': len(sheets), 'recordsWithSelectedFrameSourceSheetHash': with_sheets,
        'poseSetNote': 'Distinct source-sheet hashes are documented provenance, not a complete authored-pose-set count.',
        'readyMovementRecords': records['ready'], 'packagedMovementRecords': len(packaged),
        'provenReusableMovementClips': 0 if no_ready_or_packaged else None,
        'coveredGameCases': coverage,
        'coverageNote': 'Only selected movement banks are counted. Null means game coverage needs independent game and motion evidence; package membership alone does not prove it.',
    }


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    try:
        print(json.dumps(inventory(*sys.argv[1:]), indent=2))
    except (OSError, KeyError, ValueError, TypeError) as error:
        sys.exit(str(error))
