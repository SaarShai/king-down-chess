#!/usr/bin/env python3
"""Measure walk strides with the method of the stride study (final-strides.json, issue 36).

Method A (stride/ground_flow.py) and method B (stride/stride_b.py, stride/finalize_b.py) run on the runtime-scale
poses. The rules come from the study:
1. Both methods medium or high and within 15%: the mean.
2. Not N or S, method A medium or high: method A.
3. N or S: the side-view median of the character.
4. Method A low and within 30% of the character median: method A.
5. Else the character median: E and W values of the study and of rules 1 and 2. With none, all facings. King Stratus
   floats, so contacts do not apply: it takes the median of the other kings.
   Ogre has its own fallback: shipped N for straight facings and shipped SE for diagonals. Shipped NE is 1.76, and its
   pose time is about 2 x SE, so it must not set the other walks.
A walk from rule 3, 4 or 5 needs a look at game size. Shipped banks of the same characters also run. Their results go
in the output beside the study value, so a reader can see how far the method moves from the checked values.

Usage: wrap_up_strides.py --walks <walks.json> --study <final-strides.json> --work <dir> --out <strides.json>
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import statistics
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PYTHON = '/usr/bin/python3'
GOOD = ('medium', 'high')
SIDE = ('E', 'W')
OGRE_FALLBACK = {'straight': 1.0, 'diagonal': 0.76}


def walk_id(character, facing):
    return f'{character}/white/{facing}'


def kings_median(study):
    return statistics.median(v['stride'] for k, v in study.items() if k.startswith('king-'))


def prepare(walks, work):
    """Write a runtime-shaped folder that holds the new poses and the shipped banks of the same characters."""
    runtime = work / 'public/character-runtime'
    if work.exists():
        shutil.rmtree(work)
    (runtime / 'assets').mkdir(parents=True)
    shipped = json.loads((ROOT / 'public/character-runtime/manifest.json').read_text())
    characters = {walk['character'] for walk in walks}
    banks = []
    for bank in shipped['banks']:
        if bank['kind'] == 'move' and bank['character'] in characters and bank['army'] == 'white':
            for frame in bank['frames']:
                link = runtime / frame['url']
                if not link.is_symlink():
                    link.symlink_to(ROOT / 'public/character-runtime' / frame['url'])
            banks.append(bank)
    taken = {(b['character'], b['facing']) for b in banks}
    for walk in walks:
        key = (walk['character'], walk['facing'])
        if key in taken:
            banks = [b for b in banks if (b['character'], b['facing']) != key]
        meta = json.loads((Path(walk['frames']) / 'meta.json').read_text())
        frames = []
        for pose in range(1, 5):
            name = f"{walk['character']}-{walk['facing']}-{pose}.png"
            (runtime / 'assets' / name).symlink_to(Path(walk['frames']).resolve() / f'{pose:03}.png')
            frames.append({'url': f'assets/{name}', 'sourceSha256': name, 'timeMs': (pose - 1) * 160})
        banks.append({'character': walk['character'], 'army': 'white', 'id': f"white-walk-{walk['facing']}", 'kind': 'move',
                      'facing': walk['facing'], 'durationMs': 640, 'pivot': meta['pivot'], 'strideSquares': 1,
                      'bodyHeightPx': meta['standing']['height'], 'registrationHeightPx': meta['standing']['height'],
                      'canvasSize': meta['canvas'], 'frames': frames,
                      'sourceSha256': f"{walk['character']}-{walk['facing']}"})
    (runtime / 'manifest.json').write_text(json.dumps({'schemaVersion': 1, 'banks': banks}))
    # Method B checks each bank against its catalog bank. Only the frame order matters to it.
    (work / 'cat/banks').mkdir(parents=True)
    for bank in banks:
        stub = {'frames': [{'sha256': frame['sourceSha256']} for frame in bank['frames']]}
        (work / 'cat/banks' / f"{bank['sourceSha256']}.json").write_text(json.dumps(stub))
    return runtime, banks


def run(args, log):
    with log.open('a') as out:
        subprocess.run([PYTHON, *map(str, args)], check=True, stdout=out, stderr=subprocess.STDOUT,
                       env={**os.environ, 'OMP_NUM_THREADS': '2'})


def method_a(work):
    run([HERE / 'stride/ground_flow.py', work, work / 'a'], work / 'a.log')
    rows = json.loads((work / 'a/results.json').read_text())
    return {walk_id(r['character'], r['facing']): r for r in rows}


def method_b(work, runtime):
    out = work / 'b'
    run([HERE / 'stride/stride_b.py', work / 'cat', runtime, out / 'first'], work / 'b.log')
    first = out / 'first/proto.json'
    run([HERE / 'stride/stride_b.py', work / 'cat', runtime, out / 'second', f'--seed={first}'], work / 'b.log')
    run([HERE / 'stride/finalize_b.py', out / 'second'], work / 'b.log')
    rows = json.loads((out / 'second/results.json').read_text())
    return {walk_id(r['character'], r['facing']): r for r in rows}


def decide(walk, a, b, medians):
    facing = walk['facing']
    if walk.get('stride') is not None:
        return float(walk['stride']), 'set in the pass list', False
    if walk['character'] == 'king-stratus':
        return medians['kings'], 'Stratus floats: median of the other kings', True
    a_value, a_conf = a.get('stride'), a.get('confidence', 'none')
    b_value, b_conf = b.get('stride'), b.get('confidence', 'none')
    if a_value and b_value and a_conf in GOOD and b_conf in GOOD and abs(a_value - b_value) / ((a_value + b_value) / 2) <= 0.15:
        return (a_value + b_value) / 2, 'both methods agree', False
    if facing not in ('N', 'S') and a_value and a_conf in GOOD:
        return a_value, f'method A {a_conf}', False
    median = medians.get(walk['character'])
    fallback = median or medians['kings']
    if walk['character'] == 'ogre':
        fallback = OGRE_FALLBACK['straight' if len(facing) == 1 else 'diagonal']
    if facing in ('N', 'S'):
        return fallback, 'N/S: ogre fallback' if walk['character'] == 'ogre' else 'N/S: character side-view median', True
    if a_value and abs(a_value - fallback) / fallback <= 0.3:
        return a_value, 'method A low, within 30% of the character median', True
    return fallback, 'character median: no usable measure', True


def measure(walks, study_path, work):
    study = json.loads(Path(study_path).read_text())
    runtime, _banks = prepare(walks, work)
    a_rows, b_rows = method_a(work), method_b(work, runtime)
    medians = {'kings': kings_median(study)}
    # The study's character median is a side-view median when side views exist. New E and W walks from rules 1 and 2
    # join it, so one low study value does not set N and S for the whole character.
    for character in {walk['character'] for walk in walks}:
        side = [v['stride'] for k, v in study.items() if k.split('/')[0] == character and k.split('/')[2] in SIDE]
        own_side, own_all = [], []
        for walk in walks:
            if walk['character'] != character:
                continue
            key = walk_id(character, walk['facing'])
            value, rule, look = decide(walk, a_rows.get(key, {}), b_rows.get(key, {}), {**medians, character: medians['kings']})
            if not look:
                own_all.append(value)
                if walk['facing'] in SIDE:
                    own_side.append(value)
        every = [v['stride'] for k, v in study.items() if k.split('/')[0] == character]
        pool = side + own_side or every + own_all
        medians[character] = statistics.median(pool) if pool else None
    records = {}
    for walk in walks:
        key = walk_id(walk['character'], walk['facing'])
        a, b = a_rows.get(key, {}), b_rows.get(key, {})
        stride, rule, look = decide(walk, a, b, medians)
        records[key] = {'strideSquaresPerCycle': round(stride, 3), 'rule': rule, 'needsLook': look,
                        'methodA': {'stride': a.get('stride'), 'confidence': a.get('confidence')},
                        'methodB': {'stride': b.get('stride'), 'confidence': b.get('confidence')}}
    backtest = {}
    new_keys = set(records)
    for key, row in a_rows.items():
        if key not in new_keys and key in study:
            backtest[key] = {'study': study[key]['stride'], 'methodA': row.get('stride'), 'confidenceA': row.get('confidence'),
                             'methodB': b_rows.get(key, {}).get('stride'), 'confidenceB': b_rows.get(key, {}).get('confidence')}
    return {'method': 'final-strides.json study: methods A and B, rules in tools/anim/wrap_up_strides.py', 'medians': medians,
            'walks': records, 'shippedBacktest': backtest}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--walks', required=True, type=Path)
    parser.add_argument('--study', required=True, type=Path)
    parser.add_argument('--work', required=True, type=Path)
    parser.add_argument('--out', required=True, type=Path)
    args = parser.parse_args()
    result = measure(json.loads(args.walks.read_text()), args.study, args.work)
    args.out.write_text(json.dumps(result, indent=1) + '\n')
    print(json.dumps(result['walks'], indent=1))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f'wrap_up_strides: {error}', file=sys.stderr)
        sys.exit(1)
