"""Freeze selected animation reports into a local, review-only PNG bank viewer.

Usage: python3 -B tools/consolidate_animation_banks.py --inputs audit.json ... --output preview/consolidated-animations
Source manifests and reports are retained verbatim. Only runtime frame URLs change.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path
from urllib.parse import unquote, urlsplit

from validate_animation_alpha import AlphaError, validate_frame


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def encoded(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + '\n').encode()


def freeze(output, folder, raw, suffix):
    sha = digest(raw)
    relative = f'{folder}/{sha}{suffix}'
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if target.read_bytes() != raw:
            raise ValueError(f'{target}: frozen bytes differ from filename hash')
    else:
        # Exclusive creation also protects two imports that select the same bytes.
        try:
            with target.open('xb') as handle:
                handle.write(raw)
        except FileExistsError:
            if target.read_bytes() != raw:
                raise ValueError(f'{target}: frozen bytes differ from filename hash')
    return relative, sha


def source_root(entry, report, manifest):
    if report.get('main'):
        return Path(report['main'])
    for root in (entry.get('sourceWorktree'), str(manifest)):
        if root and '/.claude/worktrees/' in root:
            return Path(root.split('/.claude/worktrees/', 1)[0])
    return manifest.parent


def frame_path(frame, entry, report, manifest):
    value = next((frame.get(key) for key in ('imagePath', 'imageUrl', 'url', 'path') if frame.get(key)), None)
    if not isinstance(value, str):
        raise ValueError(f'{manifest}: frame has no image path')
    parts = urlsplit(value)
    if parts.scheme or parts.netloc:
        raise ValueError(f'{manifest}: frame must be a local PNG: {value}')
    value = unquote(parts.path)
    if value.startswith(('/docs/', '/.claude/')):
        candidates = [source_root(entry, report, manifest) / value.lstrip('/')]
    elif Path(value).is_absolute():
        candidates = [Path(value)]
    else:
        roots = [entry.get('assetRoot'), entry.get('previewRoot'), manifest.parent]
        candidates = [Path(root) / value for root in roots if root]
    for path in candidates:
        if path.is_file():
            return path
    raise ValueError(f'{manifest}: selected PNG is missing: {value}')


def consolidate(inputs, output):
    output = Path(output)
    entries, checked = [], {}
    reports = []
    for report_path in inputs:
        report_path = Path(report_path).resolve()
        report_raw = report_path.read_bytes()
        report = json.loads(report_raw)
        rows = report['entries']
        report_url, report_sha = freeze(output, 'sources/reports', report_raw, '.json')
        reports.append({'url': report_url, 'sha256': report_sha, 'sourcePath': str(report_path)})
        for index, entry in enumerate(rows):
            manifest = Path(entry['manifestPath'])
            if not manifest.is_absolute():
                manifest = report_path.parent / manifest
            raw = manifest.read_bytes()
            source_sha = digest(raw)
            if source_sha != entry['manifestSha256']:
                raise ValueError(f'{manifest}: manifest hash differs from audit selection')
            original_url, _ = freeze(output, 'sources/manifests', raw, '.json')
            bank = copy.deepcopy(json.loads(raw))
            if not bank.get('frames') and entry['status'] != 'missing':
                raise ValueError(f'{manifest}: selected bank has no frames')
            status = entry['status']
            defects = list(entry.get('defects', bank.get('defects', bank.get('knownDefects', []))) or [])
            source_status = bank.get('status')
            ranks = {'ready': 0, 'awaiting-human-playback-review': 1, 'draft': 2, 'missing': 3, 'needs-repair': 4}
            # These are the published-ready names in the existing core banks.
            ranks.update(dict.fromkeys(('accepted-transparent-recovery', 'accepted-transparent-counterpart', 'ready-transparent-black-revision'), 0))
            if source_status and source_status != status:
                if source_status not in ranks or status not in ranks:
                    raise ValueError(f'{manifest}: conflicting unrecognized review statuses')
                if ranks[source_status] > ranks[status]:
                    status = source_status
            failures = []
            selected_hashes = {}
            for group in ('frames', 'reverseFrames', 'entryFrames', 'settleFrames', 'effects'):
                records = bank.get(group, [])
                for frame in records if isinstance(records, list) else []:
                    if isinstance(frame, dict):
                        selected_hashes.update((frame[key], frame.get('sha256')) for key in ('imagePath', 'imageUrl', 'url', 'path') if frame.get(key))

            def capture(records, role):
                # Some banks use an effects object for cue descriptions, without effect images.
                if not isinstance(records, list):
                    return
                for frame_index, frame in enumerate(records):
                    reference = isinstance(frame, str)
                    if reference:
                        frame = {'url': frame, 'sha256': selected_hashes.get(frame)}
                    path = frame_path(frame, entry, report, manifest)
                    if path.suffix.lower() != '.png':
                        raise ValueError(f'{path}: runtime frames must be PNG')
                    png = path.read_bytes()
                    sha = digest(png)
                    if sha != frame.get('sha256'):
                        raise ValueError(f'{path}: frame hash differs from selected bytes')
                    size = bank.get('canvasSize')
                    key = (sha, role, tuple(size) if size else None)
                    if key not in checked:
                        try:
                            checked[key] = validate_frame(path, role=role, canvas_size=size, expected_sha256=sha)
                        except AlphaError as error:
                            checked[key] = str(error).replace(str(path), sha + '.png')
                    if isinstance(checked[key], str) and checked[key] not in failures:
                        failures.append(checked[key])
                    asset, _ = freeze(output, 'assets', png, '.png')
                    url = '../' + asset
                    if reference:
                        records[frame_index] = url
                        continue
                    for field in ('imagePath', 'imageUrl', 'url', 'path'):
                        if field in frame:
                            frame[field] = url
                    frame['url'] = url

            for group in ('frames', 'reverseFrames', 'entryFrames', 'settleFrames'):
                capture(bank.get(group, []), 'character')
            capture(bank.get('effects', []), 'effect')
            for track in bank.get('tracks', []):
                capture(track.get('frames', []), 'character')
                capture(track.get('effects', []), 'effect')
            if failures:
                status = 'needs-repair'
                defects.extend('Alpha check: ' + reason for reason in failures)
            bank['status'] = status
            bank['_consolidation'] = {
                'inputStatus': entry['status'], 'sourceManifestStatus': json.loads(raw).get('status'),
                'sourceManifest': {'url': '../' + original_url, 'sha256': source_sha, 'sourcePath': str(manifest)},
                'auditReport': {'url': '../' + report_url, 'sha256': report_sha, 'pointer': f'/entries/{index}'},
                'alphaFailures': failures,
            }
            bank_url, bank_sha = freeze(output, 'banks', encoded(bank), '.json')
            identity = {key: entry.get(key, bank.get(key)) for key in ('character', 'army', 'kind', 'action', 'direction', 'from', 'to')}
            entries.append({**identity, 'id': bank.get('id', entry.get('id', manifest.stem)),
                            'status': status, 'inputStatus': entry['status'], 'defects': defects,
                            'statusReason': entry.get('statusReason'), 'manifest': bank_url, 'sha256': bank_sha,
                            'sourceManifest': original_url, 'sourceManifestSha256': source_sha,
                            'auditReport': report_url, 'auditPointer': f'/entries/{index}'})
    catalog = {'schemaVersion': 1, 'purpose': 'Frozen animation review; statuses are retained or demoted, never promoted.',
               'reports': reports, 'entries': entries}
    catalog_raw = encoded(catalog)
    catalog_url, _ = freeze(output, 'catalogs', catalog_raw, '.json')
    output.mkdir(parents=True, exist_ok=True)
    (output / 'manifest.json.tmp').write_bytes(catalog_raw)
    (output / 'manifest.json.tmp').replace(output / 'manifest.json')
    counts = {status: sum(row['status'] == status for row in entries) for status in sorted({row['status'] for row in entries})}
    return {'catalog': catalog_url, 'entries': len(entries), 'statuses': counts, 'checkedImages': len(checked)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inputs', nargs='+', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(consolidate(args.inputs, args.output)))
    except (ValueError, OSError, KeyError, TypeError) as error:
        parser.exit(1, f'{error}\n')


if __name__ == '__main__':
    main()
