#!/usr/bin/env python3
"""Build the wrap-up character catalog: new walks, black walks and all colour picks, as a superset of the pinned one.

Input:
- A pass list: [{"character", "facing", "frames"?, "stride"?, "replace"?, "leftOut"?}]. frames defaults to
  ~/kd-runs/wa1/frames/<character>-white-<facing>. stride sets the value by hand. replace allows a shipped facing.
  leftOut names why a walk stays out: the tool skips it, and each one lowers the 240 target by 2.
- --base-report extends a clean, already picked pin. Its report must match the pin and counts, with no gaps or faults.
- The picks in <r5>/<pick>/manifest-map.json and the in-between maps given with --overlay.

Output in --out: catalog/, runtime-selection.json, strides.json, records/, report.json, and with --runtime, runtime-png/.
Nothing in the base catalog or the worktree changes, unless --apply copies the results into the worktree.

Steps:
1. Copy the base catalog. Measure strides (wrap_up_strides.py).
2. White poses go to catalog scale. Black poses come from a colour map fitted on the standing pose in the same facing:
   white against the black frame, with its pick colours when the character has a pick (recolor.fit_spatial).
3. The pick pipeline runs on walks of ogre-black and king-stratus-white. White Ogre skin has the colour of its cloth, so
   the map cannot split them. Ogre black alone uses the old tone map, as the input of its pipeline.
4. Each ready idle, turn, attack and move bank of a pick takes its new frames by frame hash, so one source frame gives
   one output. The source bank of a move changes with it, because the move gates compare the two.
   The paladin-white walks stay as they are: the runtime does not play them.
5. Write the manifest, the selection and the records, then check everything.

Two shipped banks change without new art (shipped-walk check): maester SE keeps its first 4 poses, and queen black SE
comes from white SE by the colour map.

--final stops on any open item: the wrong number of move banks, a frame with no pick colour, or a failed walk.
"""
import argparse
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
import recolor  # noqa: E402
import wrap_up_picks  # noqa: E402
import wrap_up_strides  # noqa: E402

SPECS = 'docs/specs/character-animation-samples'
SELECTION_REL = f'{SPECS}/runtime-selection.json'
CATALOG_REL = f'{SPECS}/preview/consolidated-animations'
RUNTIME_REL = 'public/character-runtime/manifest.json'
SIBLINGS = ('alpha-recovery-review', 'army-effects-review', 'directional-attacks')
GAME_HEIGHT = {'pawn': 96, 'knight': 112, 'bishop': 114, 'rook': 132, 'queen': 120, 'archer': 120,
               'paladin': 124, 'maester': 112, 'ogre': 136, 'guard': 114}
ALL_PICKS = {'rook-black': ('rook', 'black'), 'paladin-white': ('paladin', 'white'), 'beast-black': ('beast', 'black'),
             'ogre-black': ('ogre', 'black'), 'king-frost-black': ('king-frost', 'black'),
             'king-mud-black': ('king-mud', 'black'), 'king-stratus-black': ('king-stratus', 'black'),
             'king-stratus-white': ('king-stratus', 'white')}
WALK_PICKS = {('ogre', 'black'): 'ogre-black', ('king-stratus', 'white'): 'king-stratus-white'}
RING = ('N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW')
SAFE_OVERLAP = 0.85
NO_WALK_BANKS = {'knight', 'paladin'}
NO_MOVE_PICK = {'paladin-white'}
WALK_TARGET = 240
TOP_RANGE_EXCEPTIONS = json.loads((HERE / 'move-range-exceptions.json').read_text())['topRangeAt160ByBank']
PICK_PYTHON = ('/private/tmp/claude-501/-Users-za-Documents-king-down-chess--new-/'
               '67f26e3d-8b43-4e8e-8d12-b2002f26e705/scratchpad/runs/movement-redraw/recolor-venv/bin/python')
STUDY = (Path.home() / 'Documents/king down chess (new)/anim-out/session-backup-2026-11-01/scratchpad/'
         'stride-study/final-strides.json')
HEX = re.compile(r'[0-9a-f]{64}')
# Frames 5 and 6 pop in size and foot height. Stride 0.667 keeps the speed: 1 x 640 / 960.
MAESTER_SE_POSES, MAESTER_SE_STRIDE = 4, 0.667
QUEEN_SE_STRIDE = 1.28


def sha_file(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def dump(path, value):
    data = (json.dumps(value, indent=2) + '\n').encode()
    Path(path).write_bytes(data)
    return hashlib.sha256(data).hexdigest()


def git_show(ref, rel):
    return subprocess.check_output(['git', 'show', f'{ref}:{rel}'], cwd=ROOT)


def base_ref():
    return subprocess.check_output(['git', 'merge-base', 'HEAD', 'origin/staging/first-game'], cwd=ROOT, text=True).strip()


def read_rgba(path):
    with Image.open(path) as image:
        return np.array(image.convert('RGBA'))


def remap(value, table):
    if isinstance(value, str):
        return HEX.sub(lambda m: table.get(m.group(0), m.group(0)), value)
    if isinstance(value, list):
        return [remap(item, table) for item in value]
    if isinstance(value, dict):
        return {key: remap(item, table) for key, item in value.items()}
    return value


def write_bank(catalog, data):
    digest = dump(catalog / 'banks/pending.json', data)
    (catalog / 'banks/pending.json').replace(catalog / 'banks' / f'{digest}.json')
    return digest


def geometry_for(walk, meta, runtime):
    size = meta['canvas']
    with Image.open(Path(walk['frames']) / '001.png') as image:
        if list(image.size) != size:
            raise ValueError('meta canvas differs from the frames')
    found = [b for b in runtime['banks']
             if b['character'] == walk['character'] and b['army'] == 'white' and b['kind'] != 'move'
             and b.get('canvasSize') == size and b.get('pivot') == meta['pivot']
             and walk['facing'] in (b.get('facing'), b.get('from'), b.get('to'))]
    if not found:
        raise ValueError('no shipped standing bank has this facing, canvas and pivot')
    heights = {b['registrationHeightPx'] for b in found}
    if len(heights) != 1:
        raise ValueError('shipped standing banks have different registration heights')
    return {'canvasSize': [n * 2 for n in size], 'pivot': [n * 2 for n in found[0]['pivot']],
            'registrationHeightPx': found[0]['registrationHeightPx'] * 2}


def prepare_walk(job):
    """One process per walk: catalog-scale white poses, then tone-mapped black poses. Files only."""
    walk, geometry, work, white_master, black_master, standing = job
    name = f"{walk['character']}-{walk['facing']}"
    white_dir, black_dir = Path(work) / 'white' / name, Path(work) / 'black' / name
    white_dir.mkdir(parents=True, exist_ok=True)
    black_dir.mkdir(parents=True, exist_ok=True)
    poses = []
    for pose in range(1, 5):
        with Image.open(Path(walk['frames']) / f'{pose:03}.png') as source:
            if source.mode != 'RGBA':
                raise ValueError(f'{name} pose {pose}: expected RGBA')
            image = source.resize(tuple(geometry['canvasSize']), Image.Resampling.LANCZOS)
        image.save(white_dir / f'{pose:03}.png')
        poses.append(read_rgba(white_dir / f'{pose:03}.png'))
    if walk['character'] == 'ogre':
        mapping = recolor.fit(read_rgba(white_master), read_rgba(black_master))
        blacks = [recolor.apply(white, mapping) for white in poses]
    else:
        blacks = recolor.apply_spatial(poses, recolor.fit_spatial(*fit_pair(standing)))
        if walk['character'] == 'king-stratus':
            blacks = [wrap_up_picks.stratus_cape_rim(black) for black in blacks]
    for pose, (white, black) in enumerate(zip(poses, blacks), 1):
        recolor.gate(white, black)
        Image.fromarray(black).save(black_dir / f'{pose:03}.png')
    return name


def fit_pair(standing):
    """The first facing in the list whose two standing poses overlap well. Else the best one."""
    pairs = [(read_rgba(white), read_rgba(black)) for white, black in standing]
    scores = [recolor.overlap(*pair) for pair in pairs]
    best = next((i for i, score in enumerate(scores) if score >= SAFE_OVERLAP), int(np.argmax(scores)))
    return pairs[best]


def standing_pairs(catalog, selection, character, facing, table):
    """(white frame, black frame) of the standing pose in this facing, then in the two facings beside it.
    The black frame takes its pick colours from the table."""
    index = RING.index(facing)
    pairs = []
    for wanted in (facing, RING[(index + 1) % 8], RING[index - 1]):
        for entry in selection['entries']:
            ends = entry['id'].split('-')[-2:]
            if (entry['character'], entry['army'], entry['kind']) != (character, 'black', 'turn') or wanted not in ends:
                continue
            position = 0 if ends[0] == wanted else -1
            other = next(e for e in selection['entries'] if e['character'] == character and e['army'] == 'white'
                         and e['id'] == entry['id'].replace('black-', 'white-', 1))
            old = json.loads((catalog / entry['manifest']).read_text())['frames'][position]['sha256']
            light = json.loads((catalog / other['manifest']).read_text())['frames'][position]['sha256']
            pairs.append((str(catalog / 'assets' / f'{light}.png'), str(table.get(old, catalog / 'assets' / f'{old}.png'))))
            break
    if not pairs:
        raise ValueError(f'{character} {facing}: no standing pose')
    return pairs


def run_pick(job):
    pick, facing, source, white, target, r5 = job
    python = os.environ.get('KINGDOWN_PICK_PYTHON') or (PICK_PYTHON if Path(PICK_PYTHON).exists() else '/usr/bin/python3')
    result = subprocess.run([python, str(HERE / 'wrap_up_picks.py'), '--pick', pick, '--facing', facing,
                             '--input', str(source), '--white', str(white), '--output', str(target), '--r5', str(r5)],
                            capture_output=True, text=True,
                            env={**os.environ, 'OMP_NUM_THREADS': '1', 'OPENBLAS_NUM_THREADS': '1', 'PYTHONDONTWRITEBYTECODE': '1'})
    if result.returncode:
        raise ValueError(f'{pick} {facing}: {result.stderr.strip().splitlines()[-1] if result.stderr.strip() else "failed"}')
    return pick, facing


def bounds(image):
    alpha = image[..., 3]
    if alpha[0].max() or alpha[-1].max() or alpha[:, 0].max() or alpha[:, -1].max():
        raise ValueError('visible pixels touch the canvas edge')
    ys = np.nonzero((alpha > 8).any(axis=1))[0]
    if not len(ys):
        raise ValueError('empty frame')
    return int(ys[0]), int(ys[-1]) + 1


def walk_banks(catalog, walk, army, paths, geometry, stride):
    """Copy the frames in. Write the source bank and the move bank. The fields follow the shipped painted walks."""
    character, facing = walk['character'], walk['facing']
    ident = f'{army}-walk-{facing}'
    hashes = [sha_file(path) for path in paths]
    if len(set(hashes)) != 4:
        raise ValueError(f'{character} {ident}: four poses need four different frames')
    for path, digest in zip(paths, hashes):
        shutil.copyfile(path, catalog / 'assets' / f'{digest}.png')
    frames = [{'url': f'../assets/{digest}.png', 'imagePath': f'../assets/{digest}.png', 'sha256': digest,
               'timeMs': i * 160, 'durationMs': 160, 'pivot': geometry['pivot'], 'walkSourceScale': 1,
               'walkSourceTranslation': [0, 0], 'method': 'authored'} for i, digest in enumerate(hashes)]
    source = {'character': character, 'army': army, 'direction': facing, 'status': 'draft', 'durationMs': 640,
              'canvasSize': geometry['canvasSize'],
              'frames': [{'sha256': digest, 'timeMs': i * 160, 'durationMs': 160, 'pivot': geometry['pivot'],
                          'uniformScale': 1, 'translation': [0, 0]} for i, digest in enumerate(hashes)]}
    source_sha = write_bank(catalog, source)
    ranges = motion_ranges(paths)
    limit = TOP_RANGE_EXCEPTIONS.get(f'{character}/{army}/{ident}', 9.9)
    if ranges['topRangeAt160'] > limit or ranges['groundRangeAt160'] > 20.6:
        raise ValueError(f'{character} {ident}: motion range {ranges} is over the move gate')
    scale = GAME_HEIGHT.get(character, 130) / geometry['registrationHeightPx']
    transform = {'character': character, 'army': army, 'canonicalPivot': geometry['pivot'],
                 'scaleGamePxPerSourcePx': scale, 'offsetGamePx': [-value * scale for value in geometry['pivot']]}
    move = {'character': character, 'army': army, 'kind': 'move', 'id': ident, 'direction': facing, 'facing': facing,
            'status': 'ready', 'durationMs': 640, 'cycleMs': 640, 'canvasSize': geometry['canvasSize'],
            'pivot': geometry['pivot'], 'bodyHeightPx': geometry['registrationHeightPx'], 'strideSquares': stride,
            'sampling': 'nearest', 'frames': frames, 'walkSourceBankSha256': source_sha, 'walkRestTransform': transform,
            'walkRanges': ranges}
    move_sha = write_bank(catalog, move)
    source_entry = {'character': character, 'army': army, 'kind': 'movement-study', 'id': f'{army}-walk-source-{facing}',
                    'direction': facing, 'status': 'draft', 'manifest': f'banks/{source_sha}.json', 'sha256': source_sha}
    move_entry = {'character': character, 'army': army, 'kind': 'move', 'id': ident, 'direction': facing,
                  'status': 'ready', 'manifest': f'banks/{move_sha}.json', 'sha256': move_sha}
    return source_entry, move_entry


def add_source_and_move(catalog, character, army, facing, source, move):
    """Write one source bank and its move bank. Return their two manifest entries."""
    source_sha = write_bank(catalog, source)
    move_sha = write_bank(catalog, {**move, 'walkSourceBankSha256': source_sha})
    common = {'character': character, 'army': army, 'direction': facing}
    return [{**common, 'kind': 'movement-study', 'id': f'{army}-walk-source-{facing}', 'status': 'draft',
             'manifest': f'banks/{source_sha}.json', 'sha256': source_sha},
            {**common, 'kind': 'move', 'id': f'{army}-walk-{facing}', 'status': 'ready',
             'manifest': f'banks/{move_sha}.json', 'sha256': move_sha}]


def banks_of(catalog, selection, character, army, facing):
    """The shipped move bank and its source bank."""
    entry = next(e for e in selection['entries'] if (e['character'], e['army'], e['id']) == (character, army, f'{army}-walk-{facing}'))
    move = json.loads((catalog / entry['manifest']).read_text())
    return move, json.loads((catalog / 'banks' / f"{move['walkSourceBankSha256']}.json").read_text())


def motion_ranges(paths):
    edges = [bounds(read_rgba(path)) for path in paths]
    median = sorted(bottom - top for top, bottom in edges)[len(edges) // 2]
    return {name: round((max(e[axis] for e in edges) - min(e[axis] for e in edges)) * 160 / median * 100) / 100
            for axis, name in enumerate(('topRangeAt160', 'groundRangeAt160'))}


def trim_maester_se(catalog, selection):
    entries = []
    for army in ('white', 'black'):
        move, source = banks_of(catalog, selection, 'maester', army, 'SE')
        trim = {'durationMs': 160 * MAESTER_SE_POSES, 'cycleMs': 160 * MAESTER_SE_POSES}
        kept = move['frames'][:MAESTER_SE_POSES]
        ranges = motion_ranges([catalog / 'assets' / f"{f['sha256']}.png" for f in kept])
        entries += add_source_and_move(catalog, 'maester', army, 'SE', {**source, **trim, 'frames': source['frames'][:MAESTER_SE_POSES]},
                                       {**move, **trim, 'frames': kept, 'strideSquares': MAESTER_SE_STRIDE, 'walkRanges': ranges})
    return entries


def queen_black_se(catalog, selection):
    """Black SE takes white's drawings and white's placement, which belongs to them. Rest fields stay black."""
    white_move, white_source = banks_of(catalog, selection, 'queen', 'white', 'SE')
    black_move, _old = banks_of(catalog, selection, 'queen', 'black', 'SE')
    poses = [read_rgba(catalog / 'assets' / f"{f['sha256']}.png") for f in white_move['frames']]
    blacks = recolor.apply_spatial(poses, recolor.fit_spatial(*fit_pair(standing_pairs(catalog, selection, 'queen', 'SE', {}))))
    table = {}
    for frame, white, black in zip(white_move['frames'], poses, blacks):
        recolor.gate(white, black)
        pending = catalog / 'assets/pending.png'
        Image.fromarray(black).save(pending)
        digest = sha_file(pending)
        pending.replace(catalog / 'assets' / f'{digest}.png')
        table[frame['sha256']] = digest
    source = {**remap(white_source, table), 'army': 'black'}
    transform = {**white_move['walkRestTransform'], **{k: v for k, v in black_move['walkRestTransform'].items() if k in ('army', 'standSha256', 'idleSha256', 'idleBank')}}
    move = {**remap(white_move, table), 'army': 'black', 'id': 'black-walk-SE', 'strideSquares': QUEEN_SE_STRIDE,
            'walkRestTransform': transform}
    return add_source_and_move(catalog, 'queen', 'black', 'SE', source, move)


def load_overlay(path, table):
    """An r6 or r7 map: {byOldSha256: {old: [path, ...]}}. A later map replaces an earlier one, frame by frame."""
    path = Path(path)
    data = json.loads(path.read_text())
    pairs = [(old, path.parent / paths[0]) for old, paths in data['byOldSha256'].items()]
    for old, file in pairs:
        table[old] = file
    return len(pairs)


def pick_tables(r5, overlays):
    table = {}
    for pick in ALL_PICKS:
        by_old = json.loads((r5 / pick / 'manifest-map.json').read_text())['byOldSha256']
        for old, paths in by_old.items():
            table[old] = r5 / pick / paths[0]
    counts = {str(path): load_overlay(Path(path), table) for path in overlays}
    return table, counts


def new_frame(catalog, old, path, offset):
    """Copy one output in. Alpha and canvas must match the old frame. A pilot output on the bank canvas is cropped back."""
    before = read_rgba(catalog / 'assets' / f'{old}.png')
    after = read_rgba(path)
    if after.shape != before.shape:
        x, y = offset or (0, 0)
        after = after[y:y + before.shape[0], x:x + before.shape[1]]
        if after.shape != before.shape:
            raise ValueError(f'{old[:12]}: output canvas differs')
        scratch = catalog / 'assets/pending.png'
        Image.fromarray(after, 'RGBA').save(scratch)
    else:
        scratch = None
    if not np.array_equal(before[..., 3], after[..., 3]):
        raise ValueError(f'{old[:12]}: output alpha differs')
    digest = sha_file(scratch or path)
    target = catalog / 'assets' / f'{digest}.png'
    if scratch:
        scratch.replace(target)
    elif not target.exists():
        shutil.copyfile(path, target)
    return digest


def apply_picks(catalog, entries, table, new_keys):
    """Return new entries, the frame map, the bank map and the frames with no colour."""
    frames_map, banks_map, gaps = {}, {}, []
    by_sha = {e['sha256']: e for e in entries}
    for pick, (character, army) in ALL_PICKS.items():
        for entry in entries:
            if (entry['character'], entry['army']) != (character, army) or entry['status'] != 'ready':
                continue
            if entry['kind'] not in ('idle', 'turn', 'attack', 'move'):
                continue
            if entry['kind'] == 'move' and (pick in NO_MOVE_PICK or (character, army, entry['id']) in new_keys):
                continue
            bank = json.loads((catalog / entry['manifest']).read_text())
            # A move bank plays only its frames. Its settle frames are old records, so they are not a gap.
            played = set(id(f) for f in bank['frames'])
            for frame in bank['frames'] + bank.get('entryFrames', []) + bank.get('settleFrames', []):
                old = frame['sha256']
                if old in frames_map:
                    continue
                if old in table:
                    frames_map[old] = new_frame(catalog, old, table[old], frame.get('offset'))
                elif id(frame) in played:
                    gaps.append({'pick': pick, 'kind': entry['kind'], 'bank': entry['id'], 'sha256': old,
                                 'inbetween': bool(frame.get('sources'))})
            changed = remap(bank, {**frames_map})
            if entry['kind'] == 'move':
                source = by_sha[bank['walkSourceBankSha256']]
                data = json.loads((catalog / source['manifest']).read_text())
                digest = write_bank(catalog, remap(data, frames_map))
                banks_map[source['sha256']] = digest
                changed['walkSourceBankSha256'] = digest
            digest = write_bank(catalog, changed)
            banks_map[entry['sha256']] = digest
    # A bank hash names its content, so every entry with that hash moves together.
    updated = [{**e, 'manifest': f"banks/{banks_map[e['sha256']]}.json", 'sha256': banks_map[e['sha256']]}
               if e['sha256'] in banks_map else e for e in entries]
    return updated, frames_map, banks_map, gaps


def write_records(out, ref, frames_map, banks_map):
    """Hash-bearing files in git: rewrite them as text, so the format stays. Report any other file that names an old hash."""
    table = {**frames_map, **banks_map}
    table = {old: new for old, new in table.items() if old != new}
    records = [f'{SPECS}/painted-attack-keys.json', f'{SPECS}/smooth-attack-frames.json']
    records += sorted({f'tools/anim/sources/{character}.json' for character, _army in ALL_PICKS.values()})
    written = {}
    for rel in records:
        text = git_show(ref, rel).decode()
        changed = HEX.sub(lambda m: table.get(m.group(0), m.group(0)), text)
        target = out / 'records' / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(changed)
        written[rel] = changed != text
    patterns = out / 'records/old-hashes.txt'
    patterns.write_text('\n'.join(table) + '\n')
    found = subprocess.run(['git', 'grep', '-l', '-F', '-f', str(patterns), ref, '--', '.', ':!public', f':!{SELECTION_REL}'],
                           cwd=ROOT, capture_output=True, text=True).stdout.split()
    others = sorted(name.split(':', 1)[1] for name in found if name.split(':', 1)[1] not in records)
    return written, others


def check(catalog, base_catalog, base_manifest, manifest, selection, new_keys, frames_map, report, final, left_out):
    faults = []
    base_files = {p.relative_to(base_catalog) for p in base_catalog.rglob('*') if p.is_file()} - {Path('manifest.json')}
    missing = [str(p) for p in base_files if not (catalog / p).is_file()]
    if missing:
        faults.append(f'{len(missing)} base files are missing, as {missing[:3]}')
    new_entry_keys = {(e['character'], e['army'], e['id']) for e in manifest['entries']}
    lost = [e['id'] for e in base_manifest['entries'] if (e['character'], e['army'], e['id']) not in new_entry_keys]
    if lost:
        faults.append(f'base entries are lost: {lost[:5]}')
    for entry in selection['entries'] + manifest['entries']:
        path = catalog / entry['manifest']
        if not path.is_file() or sha_file(path) != entry['sha256']:
            faults.append(f"bad bank {entry['character']} {entry['id']}")
    paladin = [(e['id'], e['sha256']) for e in manifest['entries']
               if e['character'] == 'paladin' and e['army'] == 'white' and e['kind'] == 'move']
    base_paladin = [(e['id'], e['sha256']) for e in base_manifest['entries']
                    if e['character'] == 'paladin' and e['army'] == 'white' and e['kind'] == 'move']
    if sorted(paladin) != sorted(base_paladin):
        faults.append('paladin-white walks changed')
    if any(e['character'] in NO_WALK_BANKS and e['kind'] == 'move' for e in selection['entries']):
        faults.append('the selection has a knight or paladin move bank')
    outputs = list(frames_map.values())
    if len(set(outputs)) != len(outputs):
        faults.append(f'{len(outputs) - len(set(outputs))} pick outputs share a hash')
    kinds = {}
    for entry in selection['entries']:
        kinds[entry['kind']] = kinds.get(entry['kind'], 0) + 1
    report['selectionKinds'] = kinds
    report['catalogMoveEntries'] = sum(e['kind'] == 'move' for e in manifest['entries'])
    if kinds.get('idle') != 46 or kinds.get('turn') != 272 or kinds.get('attack') != 256:
        faults.append(f'idle, turn or attack count changed: {kinds}')
    target = WALK_TARGET - 2 * len(left_out)
    if final and kinds.get('move') != target:
        faults.append(f"move banks: {kinds.get('move')}, not {target}")
    return faults


def picked_base_report(path, selection):
    if not path:
        return None
    base_report = json.loads(path.read_text())
    kinds = {kind: sum(e['kind'] == kind for e in selection['entries']) for kind in ('idle', 'turn', 'attack', 'move')}
    if (base_report.get('catalogSha256') != selection['catalogSha256'] or base_report.get('faults') != []
            or base_report.get('failed') != {} or base_report.get('runtimePng') != 'pass'
            or base_report.get('framesWithNoPickColour', {}).get('total') != 0
            or base_report.get('selectionKinds') != kinds):
        raise ValueError('the base report does not prove a clean build of this pin')
    return base_report


def build(args):
    out = args.out.resolve()
    work = out / 'work'
    base = args.base_catalog.resolve()
    ref = base_ref()
    selection = json.loads(git_show(ref, SELECTION_REL))
    runtime = json.loads(git_show(ref, RUNTIME_REL))
    if sha_file(base / 'manifest.json') != selection['catalogSha256']:
        raise ValueError('the base catalog does not match the pin at the merge base')
    base_report = picked_base_report(args.base_report, selection)
    size = sum(p.stat().st_size for p in base.rglob('*') if p.is_file())
    if shutil.disk_usage(Path.home()).free - size < 30 * 1024**3:
        raise ValueError('the catalog copy would take free disk below 30 GiB')
    walks = json.loads(args.pass_list.read_text())
    left_out = {f"{w['character']}-{w['facing']}": w['leftOut'] for w in walks if w.get('leftOut')}
    walks = [w for w in walks if not w.get('leftOut')]
    selected = {(e['character'], e['army'], e['id']) for e in selection['entries']}
    seen = set()
    for walk in walks:
        walk.setdefault('frames', str(Path.home() / f"kd-runs/wa1/frames/{walk['character']}-white-{walk['facing']}"))
        key = (walk['character'], walk['facing'])
        if key in seen or walk['character'] in NO_WALK_BANKS:
            raise ValueError(f'bad pass list item: {key}')
        seen.add(key)
        if (walk['character'], 'white', f"white-walk-{walk['facing']}") in selected and not walk.get('replace'):
            raise ValueError(f'{key} is shipped: set "replace" to change it')
    out.mkdir(parents=True, exist_ok=True)
    catalog = out / 'catalog'
    subprocess.run(['rsync', '-a', '--delete', f'{base}/', f'{catalog}/'], check=True)
    for name in SIBLINGS:
        link = out / name
        if not link.is_symlink():
            link.symlink_to(base.parent / name, target_is_directory=True)
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()

    strides = wrap_up_strides.measure(walks, args.study, work / 'stride')
    if base_report:
        previous = json.loads(git_show(ref, f'{SPECS}/wrap-up-strides.json'))
        strides = {**previous, 'walks': {**previous['walks'], **strides['walks']},
                   'shippedBacktest': {**previous['shippedBacktest'], **strides['shippedBacktest']}}
    dump(out / 'strides.json', strides)
    report = {'base': {'commit': ref, 'catalogSha256': selection['catalogSha256']}, 'walks': {}, 'failed': {}, 'leftOut': left_out}

    table, overlay_counts = pick_tables(args.r5, args.overlay)
    jobs = []
    for walk in walks:
        name = f"{walk['character']}-{walk['facing']}"
        try:
            meta = json.loads((Path(walk['frames']) / 'meta.json').read_text())
            geometry = geometry_for(walk, meta, runtime)
            source = json.loads(git_show(ref, f"tools/anim/sources/{walk['character']}.json"))['masters']
            standing = standing_pairs(base, selection, walk['character'], walk['facing'], table)
            jobs.append((walk, geometry, str(work), str(base / source['white']['path']), str(base / source['black']['path']), standing))
        except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
            report['failed'][name] = str(error)
    with ProcessPoolExecutor(args.jobs) as pool:
        futures = {job[0]['character'] + '-' + job[0]['facing']: pool.submit(prepare_walk, job) for job in jobs}
    ready = []
    for job in jobs:
        name = f"{job[0]['character']}-{job[0]['facing']}"
        try:
            futures[name].result()
            ready.append((job[0], job[1]))
        except (ValueError, OSError) as error:
            report['failed'][name] = str(error)

    pick_jobs = {}
    for walk, _geometry in ready:
        name = f"{walk['character']}-{walk['facing']}"
        for army in ('white', 'black'):
            pick = WALK_PICKS.get((walk['character'], army))
            if pick:
                pick_jobs[(name, army)] = (pick, walk['facing'], work / army / name, work / 'white' / name,
                                           work / 'pick' / army / name, args.r5)
    pick_results = {}
    with ThreadPoolExecutor(args.jobs) as pool:
        futures = {key: pool.submit(run_pick, job) for key, job in pick_jobs.items()}
    for key, future in futures.items():
        try:
            future.result()
            pick_results[key] = work / 'pick' / key[1] / key[0]
        except (ValueError, OSError) as error:
            report['failed'][key[0]] = str(error)

    base_manifest = json.loads((base / 'manifest.json').read_bytes())
    new_entries, new_keys = [], set()
    for walk, geometry in ready:
        name = f"{walk['character']}-{walk['facing']}"
        if name in report['failed']:
            continue
        record = strides['walks'][f"{walk['character']}/white/{walk['facing']}"]
        try:
            built = []
            for army in ('white', 'black'):
                folder = pick_results.get((name, army), work / army / name)
                paths = [folder / f'{pose:03}.png' for pose in range(1, 5)]
                built.append((army, paths, walk_banks(catalog, walk, army, paths, geometry, record['strideSquaresPerCycle'])))
            for light, dark in zip(built[0][1], built[1][1]):
                if not np.array_equal(read_rgba(light)[..., 3], read_rgba(dark)[..., 3]):
                    raise ValueError('black alpha differs from white')
        except (ValueError, OSError) as error:
            report['failed'][name] = str(error)
            continue
        for army, _paths, entries in built:
            new_entries += entries
            new_keys.add((walk['character'], army, f"{army}-walk-{walk['facing']}"))
        report['walks'][name] = {'stride': record['strideSquaresPerCycle'], 'rule': record['rule'],
                                 'needsLook': record['needsLook'], 'picks': [p[1] for p in pick_results if p[0] == name],
                                 'moveBanks': {army: entries[1]['sha256'] for army, _paths, entries in built}}

    shipped_fixes = [] if base_report else trim_maester_se(catalog, selection) + queen_black_se(catalog, selection)
    new_entries += shipped_fixes
    new_keys |= {(e['character'], e['army'], e['id']) for e in shipped_fixes if e['kind'] == 'move'}
    report['shippedFixes'] = {f"{e['character']}/{e['id']}": e['sha256'] for e in shipped_fixes if e['kind'] == 'move'}
    new_ids = {(e['character'], e['army'], e['id']) for e in new_entries}
    entries = [e for e in base_manifest['entries'] if (e['character'], e['army'], e['id']) not in new_ids]
    if base_report:
        # The base pin and its clean report cover these unchanged banks; new walks take their picks above.
        frames_map, banks_map, gaps = {}, {}, []
        report['basePickReportSha256'] = sha_file(args.base_report)
    else:
        entries, frames_map, banks_map, gaps = apply_picks(catalog, entries, table, new_keys)
    manifest = {**base_manifest, 'entries': entries + new_entries}
    catalog_sha = dump(catalog / 'manifest.json', manifest)
    shutil.copyfile(catalog / 'manifest.json', catalog / 'catalogs' / f'{catalog_sha}.json')

    current = {e['sha256']: e for e in entries}
    chosen = []
    for entry in selection['entries']:
        if (entry['character'], entry['army'], entry['id']) in new_ids:
            continue
        digest = banks_map.get(entry['sha256'], entry['sha256'])
        if digest not in current:
            raise ValueError(f"selected bank is lost: {entry['character']} {entry['id']}")
        chosen.append({**entry, 'manifest': f'banks/{digest}.json', 'sha256': digest})
    chosen += [{key: e[key] for key in ('character', 'army', 'kind', 'direction', 'id', 'manifest', 'sha256')}
               for e in new_entries if e['kind'] == 'move']
    strides_sha = sha_file(out / 'strides.json')
    new_selection = {**selection, 'catalogSha256': catalog_sha, 'entries': chosen,
                     'strideSource': {**selection['strideSource'], 'addedFile': 'wrap-up-strides.json', 'addedSha256': strides_sha,
                                      'addedRule': 'Study method; each value from a fallback rule needs a look at game size.'}}
    dump(out / 'runtime-selection.json', new_selection)
    written, others = write_records(out, ref, frames_map, banks_map)

    summary = {}
    for gap in gaps:
        cell = summary.setdefault(gap['pick'], {})
        cell[gap['kind']] = cell.get(gap['kind'], 0) + 1
    report.update({'catalogSha256': catalog_sha, 'overlays': overlay_counts, 'pickFramesApplied': len(frames_map),
                   'pickBanksChanged': len(banks_map), 'framesWithNoPickColour': {'total': len(gaps), 'uniqueFrames': len({g['sha256'] for g in gaps}), 'byPick': summary},
                   'records': written, 'otherFilesWithOldHashes': others})
    faults = check(catalog, base, base_manifest, manifest, new_selection, new_keys, frames_map, report, args.final, left_out)
    if args.final and gaps:
        faults.append(f'{len(gaps)} bank frames have no pick colour')
    if args.final and report['failed']:
        faults.append(f"failed walks: {sorted(report['failed'])}")
    report['faults'] = faults
    (out / 'gaps.json').write_text(json.dumps(gaps, indent=1) + '\n')
    dump(out / 'report.json', report)

    if not faults and args.runtime:
        png = out / 'runtime-png'
        if png.exists():
            shutil.rmtree(png)
        run = ['node', str(ROOT / 'tools/build-character-runtime.mjs'), '--source', str(catalog), '--output', str(png),
               '--selection', str(out / 'runtime-selection.json')]
        if args.characters:
            run += ['--characters', args.characters]
        subprocess.run(run, cwd=ROOT, check=True)
        report['runtimePng'] = 'pass'
        dump(out / 'report.json', report)
    if faults:
        raise ValueError('; '.join(faults))
    if args.apply:
        apply_to_worktree(out, new_selection)
    print(json.dumps({k: v for k, v in report.items() if k != 'walks'}, indent=1))


def apply_to_worktree(out, selection):
    """Final step, after a clean --final run: selection, records and WebP package go into the worktree."""
    webp = out / 'runtime-webp'
    if webp.exists():
        shutil.rmtree(webp)
    subprocess.run(['node', str(ROOT / 'tools/convert-character-runtime-webp.mjs'), str(out / 'runtime-png'), str(webp),
                    '--cache', str(ROOT / 'public/character-runtime')], cwd=ROOT, check=True)
    subprocess.run(['rsync', '-a', '--delete', f'{webp}/', f"{ROOT / 'public/character-runtime'}/"], check=True)
    shutil.copyfile(out / 'runtime-selection.json', ROOT / SELECTION_REL)
    shutil.copyfile(out / 'strides.json', ROOT / SPECS / 'wrap-up-strides.json')
    for path in (out / 'records').rglob('*.json'):
        shutil.copyfile(path, ROOT / path.relative_to(out / 'records'))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--pass-list', required=True, type=Path)
    parser.add_argument('--out', type=Path, default=Path.home() / 'kd-runs/wrap-up')
    parser.add_argument('--base-catalog', type=Path, default=ROOT.parents[2] / CATALOG_REL)
    parser.add_argument('--base-report', type=Path, help='clean build report for an already picked base pin; keep its banks unchanged')
    parser.add_argument('--r5', type=Path, default=Path.home() / 'kd-runs/army-r5')
    parser.add_argument('--overlay', type=Path, action='append', default=[], help='a map in r6 form; repeat in order: later maps replace earlier ones')
    parser.add_argument('--study', type=Path, default=STUDY)
    parser.add_argument('--jobs', type=int, default=6)
    parser.add_argument('--final', action='store_true', help='stop on any open item')
    parser.add_argument('--runtime', action='store_true', help='also run the runtime PNG build and its gates')
    parser.add_argument('--characters', help='limit the runtime build, as pawn,guard')
    parser.add_argument('--apply', action='store_true', help='with --final and --runtime: write results into this worktree')
    args = parser.parse_args()
    if args.apply and not (args.final and args.runtime) or args.apply and args.characters:
        raise ValueError('--apply needs --final and --runtime, and the whole package: no --characters')
    build(args)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, AssertionError, OSError, subprocess.CalledProcessError) as error:
        print(f'wrap_up_build: {error}', file=sys.stderr)
        sys.exit(1)
