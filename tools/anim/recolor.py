#!/usr/bin/env python3
"""Adapt a frozen frame bank with a rest-master color correspondence."""
import argparse
import copy
import hashlib
import json
import subprocess
from pathlib import Path
import sys
import tempfile
import warnings

import numpy as np
from PIL import Image
from scipy.cluster.vq import kmeans2
from scipy.ndimage import distance_transform_edt, gaussian_filter
from scipy.spatial import cKDTree
from skimage.color import lab2rgb, rgb2lab

ROOT = Path(__file__).resolve().parents[2]
CATALOG_PATH = Path('docs/specs/character-animation-samples/preview/consolidated-animations')


def default_catalog():
    local = ROOT / CATALOG_PATH
    if (local / 'catalogs').is_dir():
        return local
    common = subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=ROOT, capture_output=True, text=True, check=True)
    return Path(common.stdout.strip()).parent / CATALOG_PATH


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read_rgba(path):
    with Image.open(path) as image:
        if image.mode != 'RGBA':
            raise ValueError(f'{path}: expected RGBA PNG')
        return np.array(image)


def fit(source, target, mode='tone'):
    if mode not in ('tone', 'groups'):
        raise ValueError('unknown mapping mode')
    if source.shape != target.shape:
        raise ValueError('rest masters have different canvas sizes')
    x, y = (rgb2lab(image[:, :, :3] / 255.0) for image in (source, target))
    mask = (source[:, :, 3] >= 230) & (target[:, :, 3] >= 230)
    xs, ys = x[mask], y[mask]
    if len(xs) < 256:
        raise ValueError('rest masters have too little opaque overlap')
    rng = np.random.default_rng(18)
    indices = rng.choice(len(xs), min(30000, len(xs)), replace=False)
    xs, ys = xs[indices], ys[indices]
    centers, labels = kmeans2(xs, 16, minit='++', seed=18, iter=30)
    targets = np.array([np.median(ys[labels == i], axis=0) if np.any(labels == i) else centers[i] for i in range(16)])
    if mode == 'groups':
        offsets = np.array([np.median(ys[labels == i] - xs[labels == i], axis=0)
                            if np.any(labels == i) else np.zeros(3) for i in range(16)])
        return {'mode': mode, 'centers': centers.tolist(), 'offsets': offsets.tolist()}
    # Match broad luminance distribution; retain local texture in apply().
    q = np.linspace(0, 100, 101)
    return {'centers': centers.tolist(), 'targets': targets.tolist(),
            'sourceL': np.percentile(xs[:, 0], q).tolist(), 'targetL': np.percentile(ys[:, 0], q).tolist()}


def edge_reference(alpha):
    opaque = alpha >= 128
    if not np.any(opaque):
        raise ValueError('frame has no opaque pixels')
    distance, indices = distance_transform_edt(~opaque, return_indices=True)
    return (alpha > 0) & (alpha < 32) & (distance <= 2), indices


def apply_parts(frame, mapping, pivot):
    alpha = frame[:, :, 3]
    visible = alpha >= 128
    if not np.any(visible):
        raise ValueError('frame has no opaque pixels')
    ys, _ = np.nonzero(visible)
    height = ys.max() - ys.min() + 1
    y, x = np.indices(alpha.shape)
    x = (x - pivot[0]) / height
    y = (y - pivot[1]) / height
    lab = rgb2lab(frame[:, :, :3] / 255.0)
    result = frame.copy()
    used = np.zeros(alpha.shape, dtype=bool)
    for part in mapping['parts']:
        center = np.asarray(part['source'], dtype=float)
        tolerance = np.asarray(part['tolerance'], dtype=float)
        target = np.asarray(part['target'], dtype=float)
        zone = part['zone']
        mask = ((np.abs(lab - center) <= tolerance).all(axis=2) & visible &
                (x >= zone[0]) & (y >= zone[1]) & (x <= zone[2]) & (y <= zone[3]))
        # Earlier parts take priority when their colour ranges overlap.
        mask &= ~used
        used |= mask
        weight = np.minimum(distance_transform_edt(mask) / 2, 1)
        mapped = lab + weight[:, :, None] * (target - center)
        mapped[:, :, 0] = np.clip(mapped[:, :, 0], 0, 100)
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore', message='Conversion from CIE-LAB')
            rgb = np.rint(np.clip(lab2rgb(mapped), 0, 1) * 255).astype(np.uint8)
        result[mask, :3] = rgb[mask]
    return result


def apply(frame, mapping, pivot=None):
    if mapping.get('mode') == 'parts':
        if pivot is None:
            raise ValueError('part mapping needs a frame pivot')
        return apply_parts(frame, mapping, pivot)
    lab = rgb2lab(frame[:, :, :3] / 255.0)
    flat = lab.reshape(-1, 3)
    centers = np.array(mapping['centers'])
    if mapping.get('mode') == 'groups':
        alpha = frame[:, :, 3] / 255.0
        smooth = gaussian_filter(lab[:, :, 0] * alpha, 2) / np.maximum(gaussian_filter(alpha, 2), 1e-8)
        reference = lab.copy()
        reference[:, :, 0] = smooth
        distance, labels = cKDTree(centers).query(reference.reshape(-1, 3), k=min(4, len(centers)), workers=1)
        weights = np.exp(-(distance ** 2 - distance[:, :1] ** 2) / (2 * 8 ** 2))
        weights /= weights.sum(axis=1, keepdims=True)
        delta = (np.array(mapping['offsets'])[labels] * weights[:, :, None]).sum(axis=1)
        mapped = reference + delta.reshape(lab.shape)
        mapped[:, :, 0] += lab[:, :, 0] - smooth
        mapped[:, :, 0] = np.clip(mapped[:, :, 0], 0, 100)
    else:
        targets = np.array(mapping['targets'])
        labels = cKDTree(centers).query(flat, workers=1)[1]
        ab = (flat[:, 1:] + targets[labels, 1:] - centers[labels, 1:]).reshape(*lab.shape[:2], 2)
        # A monotonic global tone curve preserves target contrast. Add source fine detail.
        weight = frame[:, :, 3] / 255.0
        smooth = gaussian_filter(lab[:, :, 0] * weight, 2) / np.maximum(gaussian_filter(weight, 2), 1e-8)
        luminance = np.interp(smooth, mapping['sourceL'], mapping['targetL']) + (lab[:, :, 0] - smooth)
        mapped = np.dstack((np.clip(luminance, 0, 100), ab))
    with warnings.catch_warnings():
        warnings.filterwarnings('ignore', message='Conversion from CIE-LAB')
        rgb = np.rint(np.clip(lab2rgb(mapped), 0, 1) * 255).astype(np.uint8)
    edge, idx = edge_reference(frame[:, :, 3])
    rgb[edge] = rgb[idx[0][edge], idx[1][edge]]
    rgb[frame[:, :, 3] == 0] = 0
    return np.dstack((rgb, frame[:, :, 3]))


def gate(source, result, parts=False):
    if source.shape != result.shape or not np.array_equal(source[:, :, 3], result[:, :, 3]):
        raise ValueError('alpha differs from source')
    alpha = result[:, :, 3]
    if np.max(np.concatenate((alpha[0], alpha[-1], alpha[:, 0], alpha[:, -1]))) > 1:
        raise ValueError('visible alpha reaches exterior')
    if np.count_nonzero(alpha >= 16) < 16:
        raise ValueError('empty character')
    edge, idx = edge_reference(alpha)
    if parts:
        if not np.array_equal(result[:, :, :3][edge], source[:, :, :3][edge]):
            raise ValueError('unlabelled low-alpha edge changed')
        return
    if not np.array_equal(result[:, :, :3][edge], result[:, :, :3][idx[0][edge], idx[1][edge]]):
        raise ValueError('low-alpha edge differs from nearby interior: possible new halo')


def checked(path, expected):
    if digest(path) != expected:
        raise ValueError(f'{path}: hash mismatch')
    return path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--character', required=True)
    parser.add_argument('--from', dest='source_army', required=True, choices=['white', 'black'])
    parser.add_argument('--to', required=True, choices=['white', 'black'])
    parser.add_argument('--bank', required=True)
    parser.add_argument('--out', required=True, type=Path)
    parser.add_argument('--catalog-root', type=Path)
    parser.add_argument('--mode', choices=['tone', 'groups', 'parts'], default='tone')
    parser.add_argument('--target-master', type=Path)
    parser.add_argument('--part-spec', type=Path)
    parser.add_argument('--pivot', nargs=2, type=float, metavar=('X', 'Y'))
    args = parser.parse_args()
    if args.source_army == args.to and not args.target_master and args.mode != 'parts':
        raise ValueError('armies must differ')
    if not args.character.replace('-', '').isalnum() or '/' in args.character:
        raise ValueError('invalid character')
    catalog_root = (args.catalog_root or default_catalog()).resolve()
    selection = json.loads((ROOT / 'docs/specs/character-animation-samples/runtime-selection.json').read_text())
    record = json.loads((ROOT / 'tools/anim/sources' / (args.character + '.json')).read_text())
    catalog_path = checked(catalog_root / 'catalogs' / (selection['catalogSha256'] + '.json'), selection['catalogSha256'])
    catalog = json.loads(catalog_path.read_text())
    for army, master in record['masters'].items():
        selected = [e for e in selection['entries'] if e['character'] == args.character and e['army'] == army and e['id'] == master['id']]
        approved = [e for e in catalog['entries'] if e['character'] == args.character and e['army'] == army and e['id'] == master['id'] and e['status'] == 'ready']
        if len(selected) != 1 or len(approved) != 1 or any(e['sha256'] != master['bankSha256'] or e['manifest'] != master['bank'] for e in selected + approved):
            raise ValueError('rest master bank is not selected and ready')
        bank_path = checked(catalog_root / master['bank'], master['bankSha256'])
        rest = json.loads(bank_path.read_text())['frames'][0]
        if rest['sha256'] != master['sha256'] or (bank_path.parent / rest['url']).resolve() != (catalog_root / master['path']).resolve():
            raise ValueError('rest master record differs from bank')
        checked(catalog_root / master['path'], master['sha256'])
    candidate = Path(args.bank)
    if candidate.is_dir():
        candidate = candidate / 'manifest.json'
    if not candidate.is_file():
        matches = [e for e in selection['entries'] if e['character'] == args.character and e['army'] == args.source_army and e['id'] == args.bank]
        if len(matches) != 1:
            raise ValueError('bank path or selected bank id not found')
        candidate = checked(catalog_root / matches[0]['manifest'], matches[0]['sha256'])
    candidate = candidate.resolve()
    bank = json.loads(candidate.read_text())
    if bank.get('army', args.source_army) != args.source_army or not bank.get('frames'):
        raise ValueError('bank army differs or it has no frames')
    if bank.get('character', args.character) != args.character:
        raise ValueError('bank character differs')
    if bank.get('effects') or bank.get('tracks'):
        raise ValueError('embedded effects or tracks require a separate adaptation')
    if not isinstance(bank.get('durationMs'), (float, int)) or bank['durationMs'] <= 0:
        raise ValueError('bank has no positive duration')
    if any('timeMs' not in f for f in bank['frames']):
        raise ValueError('every frame must have a timeMs')
    if args.out.exists():
        raise ValueError('output already exists; select a new directory')
    if args.mode == 'parts':
        if not args.part_spec or args.target_master:
            raise ValueError('parts mode needs a part spec and no target master')
        mapping = json.loads(args.part_spec.read_text())
        if mapping.get('mode') != 'parts' or mapping.get('sourceSha256') != record['masters'][args.source_army]['sha256']:
            raise ValueError('part spec does not match the source master')
        pivot = args.pivot or bank.get('footPivot') or bank.get('pivot')
        if not pivot and bank.get('sources'):
            pivot = bank['sources'][0].get('registration', {}).get('destinationPivot')
        if not pivot:
            raise ValueError('bank has no recorded pivot')
    else:
        if args.part_spec or args.pivot:
            raise ValueError('part spec and pivot require parts mode')
        target = args.target_master or catalog_root / record['masters'][args.to]['path']
        mapping = fit(read_rgba(catalog_root / record['masters'][args.source_army]['path']), read_rgba(target), args.mode)
        pivot = None
    mapping_bytes = (json.dumps(mapping, sort_keys=True, separators=(',', ':')) + '\n').encode()
    mapping_hash = hashlib.sha256(mapping_bytes).hexdigest()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='.recolor-', dir=args.out.parent) as temporary:
        work = Path(temporary)
        (work / 'mapping.json').write_bytes(mapping_bytes)
        keep = ('kind', 'action', 'from', 'to', 'label', 'durationMs', 'canvasSize', 'footPivot', 'targetPoint', 'metadata', 'sampling', 'times', 'previewCycle', 'schedule', 'selectedSchedule', 'approvedPlayerSchedule', 'beatTimes')
        result_bank = {key: copy.deepcopy(bank[key]) for key in keep if key in bank}
        result_bank['runtimeFormat'] = 'RGBA PNG framebank'
        result_bank['character'] = args.character
        result_bank['sourceBankSha256'] = digest(candidate)
        result_bank['army'] = args.to
        result_bank['id'] = bank.get('id', 'bank').replace(args.source_army + '-', args.to + '-', 1)
        result_bank['status'] = 'needs-review'
        result_bank['frames'] = []
        for i, frame in enumerate(bank['frames']):
            path = checked((candidate.parent / frame['url']).resolve(), frame['sha256'])
            source = read_rgba(path)
            result = apply(source, mapping, pivot)
            gate(source, result, parts=args.mode == 'parts')
            name = f'frame-{i:04d}.png'
            Image.fromarray(result).save(work / name)
            decoded = read_rgba(work / name)
            gate(source, decoded, parts=args.mode == 'parts')
            new_frame = {'url': name, 'imagePath': name, 'timeMs': frame['timeMs'], 'sha256': digest(work / name), 'provenance': {'method': 'recolor', 'sourceSha256': frame['sha256'], 'mappingSha256': mapping_hash}}
            if 'visibleIntervalMs' in frame:
                new_frame['visibleIntervalMs'] = frame['visibleIntervalMs']
            result_bank['frames'].append(new_frame)
        if bank.get('reverseFrames'):
            by_hash = {old['sha256']: new for old, new in zip(bank['frames'], result_bank['frames'])}
            by_url = {old['url']: new for old, new in zip(bank['frames'], result_bank['frames'])}
            reverse = []
            for frame in bank['reverseFrames']:
                if isinstance(frame, str):
                    reverse.append(by_url[frame]['url'])
                else:
                    new_frame = copy.deepcopy(by_hash[frame['sha256']])
                    for key in ('timeMs', 'visibleIntervalMs'):
                        if key in frame:
                            new_frame[key] = frame[key]
                    reverse.append(new_frame)
            result_bank['reverseFrames'] = reverse
        (work / 'manifest.json').write_text(json.dumps(result_bank, indent=2) + '\n')
        work.rename(args.out)
        print(f"{len(result_bank['frames'])} frames written to {args.out}; mapping {mapping_hash}; visual review required")


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, KeyError, json.JSONDecodeError) as error:
        print(f'recolor: {error}', file=sys.stderr)
        sys.exit(1)
