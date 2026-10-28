"""Publish explicit visual-review decisions against immutable animation banks.

python3 -B tools/publish_animation_reviews.py --catalog preview/manifest.json --review review.json
The review has reviewer, reviewType='agent-visual', and entries with bankSha256,
status, observations and evidencePaths. Source pixels and metadata stay intact.
"""
import argparse
import copy
import json
import tempfile
from pathlib import Path

from consolidate_animation_banks import catalog_lock, digest, encoded, freeze


def publish(catalog_path, review_path):
    catalog_path, review_path = Path(catalog_path).resolve(), Path(review_path).resolve()
    with catalog_lock(catalog_path.parent):
        return _publish(catalog_path, review_path)


def _publish(catalog_path, review_path):
    root = catalog_path.parent
    before = catalog_path.read_bytes()
    catalog, report = json.loads(before), json.loads(review_path.read_bytes())
    if report.get('reviewType') != 'agent-visual' or not report.get('reviewer'):
        raise ValueError('An explicit agent visual reviewer is required; this is not owner approval')
    decisions = report.get('entries', [])
    if not decisions or len({r['bankSha256'] for r in decisions}) != len(decisions):
        raise ValueError('Review must contain distinct bank decisions')
    changed = 0
    for row in decisions:
        if row['status'] not in ('ready', 'needs-repair') or not row.get('observations') or not row.get('evidencePaths'):
            raise ValueError('Each decision requires a verdict, observations and visual evidence')
        selected = [e for e in catalog['entries'] if e['sha256'] == row['bankSha256'] or e.get('visualReview', {}).get('sourceBankSha256') == row['bankSha256']]
        if len(selected) != 1:
            raise ValueError(f"Reviewed bank no longer uniquely selected: {row['bankSha256']}")
        entry = selected[0]
        decision = {'reviewType': report['reviewType'], 'reviewer': report['reviewer'], 'sourceBankSha256': row['bankSha256'], 'status': row['status'], 'observations': row['observations'], 'evidence': []}
        for name in row['evidencePaths']:
            path = Path(name)
            if not path.is_absolute():
                path = review_path.parent / path
            url, sha = freeze(root, 'reviews/evidence', path.read_bytes(), path.suffix)
            decision['evidence'].append({'url': '../' + url, 'sha256': sha})
        review_url, review_sha = freeze(root, 'reviews', encoded(decision), '.json')
        bank_path = root / entry['manifest']
        raw = bank_path.read_bytes()
        if digest(raw) != entry['sha256']:
            raise ValueError('Selected bank hash differs')
        bank = json.loads(raw)
        # Verify the exact frozen runtime assets, including reverse and effect tracks.
        def verify(value):
            if isinstance(value, dict):
                if isinstance(value.get('url'), str) and value['url'].startswith('../assets/'):
                    frame = root / value['url'][3:]
                    sha = digest(frame.read_bytes())
                    if frame.stem != sha or value.get('sha256', sha) != sha:
                        raise ValueError('Frozen frame hash differs')
                for child in value.values():
                    verify(child)
            elif isinstance(value, list):
                for child in value:
                    verify(child)
            elif isinstance(value, str) and value.startswith('../assets/'):
                frame = root / value[3:]
                if digest(frame.read_bytes()) != frame.stem:
                    raise ValueError('Frozen frame hash differs')
        verify(bank)
        provenance = bank['_consolidation']
        for key, hash_key in [('sourceManifest', 'sourceManifestSha256'), ('auditReport', None)]:
            source = provenance[key]
            path = (bank_path.parent / source['url']).resolve()
            if path != (root / entry[key]).resolve() or digest(path.read_bytes()) != source['sha256']:
                raise ValueError('Frozen provenance hash or catalog reference differs')
            if hash_key and entry[hash_key] != source['sha256']:
                raise ValueError('Frozen provenance hash or catalog reference differs')
        # Replays must verify pixels and provenance too, not only the decision identifier.
        if entry.get('visualReview', {}).get('sha256') == review_sha:
            if entry['status'] != row['status'] or bank['status'] != row['status'] or bank.get('currentVisualReview', {}).get('sha256') != review_sha:
                raise ValueError('Published review and selected status differ')
            continue
        if entry['sha256'] != row['bankSha256'] or entry['status'] != 'awaiting-human-playback-review' or bank.get('status') != 'awaiting-human-playback-review':
            raise ValueError('Decision must target the selected pending bank, not a draft or a changed review')
        if row['status'] == 'ready' and (entry.get('defects') or provenance.get('alphaFailures')):
            raise ValueError('A known defect cannot pass through a pending-review decision')
        review = {'url': review_url, 'sha256': review_sha, 'sourceBankSha256': row['bankSha256'], 'reviewType': report['reviewType']}
        revised = copy.deepcopy(bank)
        revised['status'] = row['status']
        revised['currentVisualReview'] = {**review, 'url': '../' + review_url}
        url, sha = freeze(root, 'banks', encoded(revised), '.json')
        entry.update(manifest=url, sha256=sha, status=row['status'], visualReview=review,
                     statusReason='Agent visual review recorded against exact frozen frames; owner advance approval permits integration.')
        if row['status'] == 'needs-repair':
            entry['defects'] = row['observations'] if isinstance(row['observations'], list) else [row['observations']]
        changed += 1
    result = encoded(catalog)
    url, sha = freeze(root, 'catalogs', result, '.json')
    # Do not replace a catalog changed by another publisher while proof files were copied.
    if catalog_path.read_bytes() != before:
        raise ValueError('Catalog changed during review publication; retry against the current selection')
    with tempfile.NamedTemporaryFile(dir=root, prefix='.review-', delete=False) as handle:
        handle.write(result)
        temp = Path(handle.name)
    temp.replace(catalog_path)
    return {'changed': changed, 'catalog': url, 'sha256': sha}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--catalog', type=Path, required=True)
    parser.add_argument('--review', type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(publish(args.catalog, args.review)))
