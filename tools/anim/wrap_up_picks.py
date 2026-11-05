#!/usr/bin/env python3
"""Apply one colour pick pipeline to the four poses of one walk.

The pipelines live in <r5>/<pick>/work. They were written for catalog frames. This file calls their own
segment and recolour code on new poses, with the loop p1-p2-p3-p4-p1 as the only frame neighbours.
No pipeline file changes. Each pick runs in its own process, because the pipelines share module names.

Usage: wrap_up_picks.py --pick king-mud-black --facing E --input <dir> --white <dir> --output <dir> [--r5 <dir>]
<dir> holds 001.png to 004.png at catalog scale. Input for a black pick is the tone-mapped frame.
Input for king-stratus-white is the white frame. --white holds the white poses. Alpha never changes.

King Mud needs the white poses. The tone map turns all its cream to the blue-grey of the black cape, but the black
master keeps the ivory bone, and the mud masks find bone by colour. So the masks come from the white pose. The crown,
claws and named parts take the white colours, and the named parts then take the dark map of the pick.
"""
import argparse
from pathlib import Path
import sys
import warnings

import numpy as np
from PIL import Image

warnings.filterwarnings('ignore')
BACK = {'N', 'NE', 'NW'}
PICKS = ('ogre-black', 'king-mud-black', 'king-stratus-black', 'king-stratus-white')


def loop_pairs(count):
    return [tuple(sorted((i, (i + 1) % count))) for i in range(count)]


def mud(frames, facing, whites):
    import seg4
    import final as F
    from scipy.sparse import coo_matrix
    from scipy.sparse.csgraph import connected_components
    count = len(frames)
    srcs = dict(enumerate(whites))
    raw = {}
    for i, src in srcs.items():
        g = seg4.segment(src, face=facing not in BACK)
        raw[i] = dict(label=g['label'].astype(np.int64), crown=g['crown'], claw=g['claw'], other=g['other'])
    F.neighbours = lambda: {i: {(i - 1) % count, (i + 1) % count} for i in srcs}
    heads = F.head_filter(raw, srcs)
    labels, forced = {}, {}
    for i in srcs:
        label = raw[i]['label'].copy()
        label[(label == 1) & ~heads[i]] = 0
        label[heads[i]] = 1
        labels[i] = label
        forced[i] = raw[i]['crown'] | raw[i]['claw']
    # The vote of lock.py in the way-1 pilot, with no approved key. Pixels that hold still share a label.
    height, width = frames[0].shape[:2]
    total = height * width
    rows, cols = [], []
    for a, b in loop_pairs(count):
        still = np.nonzero(F.stable_mask(srcs[a], srcs[b]).ravel())[0]
        rows.append(a * total + still)
        cols.append(b * total + still)
    rows, cols = np.concatenate(rows), np.concatenate(cols)
    voted_all = np.concatenate([labels[i].ravel() for i in srcs])
    tracked_all = np.zeros(total * count, bool)
    if len(rows):
        nodes, inverse = np.unique(np.concatenate([rows, cols]), return_inverse=True)
        r, c = inverse[:len(rows)], inverse[len(rows):]
        graph = coo_matrix((np.ones(len(r), np.int8), (r, c)), shape=(len(nodes),) * 2)
        groups, group = connected_components(graph, directed=False)
        flat = voted_all[nodes]
        hold = np.concatenate([forced[i].ravel() for i in srcs])[nodes]
        major = np.bincount(group * 4 + flat, minlength=groups * 4).reshape(groups, 4).argmax(1)
        major[np.bincount(group, weights=hold, minlength=groups) > 0] = 0
        voted_all[nodes] = major[group]
        tracked_all[nodes] = True
    results = []
    for i, src in srcs.items():
        voted = voted_all[i * total:(i + 1) * total].reshape(height, width)
        tracked = tracked_all[i * total:(i + 1) * total].reshape(height, width)
        final = F.coherent(labels[i].astype(np.uint8), voted.astype(np.uint8), tracked, src).astype(np.int64)
        final[forced[i]] = 0
        base = frames[i].copy()
        ivory = (final > 0) | forced[i]
        base[ivory, :3] = src[ivory, :3]
        results.append(F.recolour(base, final))
    return results


def ogre_cloth(white):
    """The r5 cloth test looks for the blue cloth of the old black art. A white pose has cream cloth, as near to the skin
    as its folds are, so a tone map cannot show it. Line art closes the cloth. On the master this gives IoU 0.875 with
    the r5 mask. Keep the light areas that sit at the hips and stop above the feet."""
    from scipy import ndimage as ndi
    from skimage.color import rgb2lab
    lightness = rgb2lab(white[..., :3] / 255.0)[..., 0]
    visible = white[..., 3] >= 128
    rows = np.nonzero(visible.any(1))[0]
    top, height = rows[0], rows[-1] - rows[0]
    labels, _count = ndi.label(ndi.binary_erosion(visible & (lightness >= 48), iterations=1))
    cloth = np.zeros(visible.shape, bool)
    for index, box in enumerate(ndi.find_objects(labels), 1):
        piece = labels[box] == index
        area = int(piece.sum())
        ys = np.nonzero(piece)[0] + box[0].start
        if 400 <= area < 25000 and 0.5 <= (ys.mean() - top) / height <= 0.78 and (ys.max() - top) / height <= 0.86:
            cloth[box] |= piece
    cloth = ndi.binary_dilation(cloth, iterations=2) & visible
    if cloth.sum() < 5000:
        raise ValueError(f'ogre cloth not found: {int(cloth.sum())} pixels')
    hull = ndi.binary_closing(cloth, iterations=3) & visible
    return cloth, hull & ~cloth


def ogre(frames, facing, whites):
    from skimage.color import rgb2lab
    import ogre as O
    import ogre4 as G
    import run4 as R
    tusks = []
    for rgba in frames:
        lab = rgb2lab(rgba[:, :, :3] / 255.0)
        visible = rgba[:, :, 3] >= 128
        _top, _height, scale = G.head_geometry(visible)
        tusks.append(O.tusk_mask(lab, visible, scale))
    tusks, _log = O.fill_tusks(frames, tusks, loop=True)
    previous, results = None, []
    for rgba, tusk, white in zip(frames, tusks, whites):
        weights = G.parts(rgba, tusk)
        lab = rgb2lab(rgba[:, :, :3] / 255.0)
        visible = rgba[:, :, 3] >= 128
        cloth, folds = ogre_cloth(white)
        weights['cloth'] = np.where(cloth, 1.0, 0.0)
        weights['body'] = np.where(cloth, 0.0, weights['body'])
        weights['interior'] = folds
        if previous:
            R.carry(weights, previous[0], lab, previous[1], visible, previous[2])
        keep = weights['eye'] | weights['tusk'] | weights['red']
        results.append(G.render(rgba, lab, weights['body'], weights['cloth'], keep, rgba[:, :, 3] >= 9, weights['interior']))
        previous = (weights, lab, visible)
    return results


def stratus_black(frames, facing, whites):
    import lib as L
    import seg4 as S
    classes, labs = [], []
    for image in frames:
        cls, lab = S.segment(image, None)
        cls = S.clean(cls, lab)
        classes.append(S.split_torso(cls, lab, image[..., 3] >= 128, None).astype(np.int8))
        labs.append(L.lab(image).astype(np.float32))
    # The rounds of temporal.py, with the loop as the only edges.
    still = {}
    for a, b in loop_pairs(len(frames)):
        alpha_a, alpha_b = frames[a][..., 3], frames[b][..., 3]
        still[(a, b)] = ((alpha_a >= 128) & (alpha_b >= 128) & (alpha_a == alpha_b)
                         & (np.sqrt(((labs[a] - labs[b]) ** 2).sum(-1)) < 3.0))
    for _ in range(8):
        changed, updated = 0, []
        for i, own in enumerate(classes):
            votes = np.zeros((6,) + own.shape, np.int16)
            for k in range(-1, 5):
                votes[k + 1] += own == k
            any_still = np.zeros(own.shape, bool)
            for other in ((i - 1) % len(frames), (i + 1) % len(frames)):
                mask = still[tuple(sorted((i, other)))]
                any_still |= mask
                for k in range(-1, 5):
                    votes[k + 1] += mask & (classes[other] == k)
            best = votes.argmax(0) - 1
            own_votes = np.take_along_axis(votes, (own.astype(np.int64) + 1)[None], 0)[0]
            take = any_still & (votes.max(0) > own_votes) & (own >= 0) & (best >= 0)
            result = own.copy()
            result[take] = best[take]
            changed += int(take.sum())
            updated.append(result)
        classes = updated
        if not changed:
            break
    return [S.recolour(image, cls.astype(np.int32), L.lab(image))[0] for image, cls in zip(frames, classes)]


def stratus_white(frames, facing, whites):
    import seg
    import recolour4 as X
    labels, sources = {}, dict(enumerate(frames))
    for i, src in sources.items():
        masks, lab, _a, _b = seg.segment(src)
        labels[i] = seg.finish(seg.labels(masks), lab[..., 0], src[:, :, 3] >= 128)
    labels, _moved = X.fuse(labels, sources, set(loop_pairs(len(frames))))
    return [X.recolour(sources[i], labels[i])[0] for i in sources]


RUN = {'ogre-black': ogre, 'king-mud-black': mud, 'king-stratus-black': stratus_black, 'king-stratus-white': stratus_white}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pick', required=True, choices=PICKS)
    parser.add_argument('--facing', required=True)
    parser.add_argument('--input', required=True, type=Path)
    parser.add_argument('--white', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    parser.add_argument('--r5', type=Path, default=Path.home() / 'kd-runs/army-r5')
    args = parser.parse_args()
    sys.path.insert(0, str(args.r5 / args.pick / 'work'))
    names = [f'{i:03}.png' for i in range(1, 5)]
    frames = [np.array(Image.open(args.input / name).convert('RGBA')) for name in names]
    whites = [np.array(Image.open(args.white / name).convert('RGBA')) for name in names]
    results = RUN[args.pick](frames, args.facing, whites)
    args.output.mkdir(parents=True, exist_ok=True)
    for name, source, result in zip(names, frames, results):
        if not np.array_equal(source[..., 3], result[..., 3]):
            raise ValueError(f'{args.pick} {name}: the pipeline changed alpha')
        changed = (np.abs(source[..., :3].astype(int) - result[..., :3].astype(int)).max(2) > 12) & (source[..., 3] >= 128)
        if changed.sum() < 0.01 * (source[..., 3] >= 128).sum():
            raise ValueError(f'{args.pick} {name}: the pipeline changed under 1% of the figure')
        Image.fromarray(result.astype(np.uint8), 'RGBA').save(args.output / name)


if __name__ == '__main__':
    main()
