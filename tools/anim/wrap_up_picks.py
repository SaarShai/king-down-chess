#!/usr/bin/env python3
"""Apply one colour pick pipeline to the four poses of one walk.

The pipelines live in <r5>/<pick>/work. They were written for catalog frames. This file calls their own
segment and recolour code on new poses, with the loop p1-p2-p3-p4-p1 as the only frame neighbours.
No pipeline file changes. Each pick runs in its own process, because the pipelines share module names.

Usage: wrap_up_picks.py --pick ogre-black --facing E --input <dir> --white <dir> --output <dir> [--r5 <dir>]
<dir> holds 001.png to 004.png at catalog scale. Input for a black pick is the tone-mapped frame.
Input for king-stratus-white is the white frame. --white holds the white poses. Alpha never changes.

Black Mud and black Stratus do not run here. wrap_up_build.py maps their walks from the pick colours of the standing pose.
Their cream parts have one colour in white and other colours in black, so a mask on the white pose failed on shoulders.
"""
import argparse
from pathlib import Path
import sys
import warnings

import numpy as np
from PIL import Image

warnings.filterwarnings('ignore')
BACK = {'N', 'NE', 'NW'}
PICKS = ('ogre-black', 'king-stratus-white')
# Line art closes a raised thigh, toes or a hand in the hip band as if they were cloth, and white skin has the cloth colour.
# (facing, pose index): (x, y, area) of each piece, with the catalog-scale area. A remade pose fails the area test.
OGRE_NOT_CLOTH = {('SW', 3): ((522, 463, 9803), (519, 522, 654), (542, 538, 553), (553, 561, 401)),
                  ('W', 0): ((584, 455, 8125),), ('W', 1): ((385, 408, 6984),), ('W', 2): ((663, 402, 6126),)}


def loop_pairs(count):
    return [tuple(sorted((i, (i + 1) % count))) for i in range(count)]


def ogre_cloth(white, not_cloth=()):
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
    dropped = {int(labels[y, x]) for x, y, area in not_cloth if abs((labels == labels[y, x]).sum() - area) <= 0.2 * area}
    for index, box in enumerate(ndi.find_objects(labels), 1):
        piece = labels[box] == index
        area = int(piece.sum())
        if index in dropped:
            continue
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
    for pose, (rgba, tusk, white) in enumerate(zip(frames, tusks, whites)):
        weights = G.parts(rgba, tusk)
        lab = rgb2lab(rgba[:, :, :3] / 255.0)
        visible = rgba[:, :, 3] >= 128
        cloth, folds = ogre_cloth(white, OGRE_NOT_CLOTH.get((facing, pose), ()))
        weights['cloth'] = np.where(cloth, 1.0, 0.0)
        weights['body'] = np.where(cloth, 0.0, weights['body'])
        weights['interior'] = folds
        if previous:
            R.carry(weights, previous[0], lab, previous[1], visible, previous[2])
        keep = weights['eye'] | weights['tusk'] | weights['red']
        results.append(G.render(rgba, lab, weights['body'], weights['cloth'], keep, rgba[:, :, 3] >= 9, weights['interior']))
        previous = (weights, lab, visible)
    return results


def stratus_cape_rim(rgba):
    """Black Stratus: the rest poses keep a teal rim on the cape, the attack keys have none, so it flashes. The owner asked
    for shades of dark. Pull teal pixels (green-side a, blue-side b; the steel has a near 0) to neutral and darken them. A pixel that holds a blend of rim
    and cape takes a part of the change, so in-between frames match their keys. Alpha never changes."""
    from skimage.color import lab2rgb, rgb2lab
    lab = rgb2lab(rgba[..., :3] / 255.0)
    weight = np.clip((-lab[..., 1] - 1.5) / 3, 0, 1) * (lab[..., 2] < 2)
    weight = weight * weight * (3 - 2 * weight)
    weight[(rgba[..., 3] == 0) | (lab[..., 0] > 62)] = 0
    new = lab.copy()
    new[..., 0] = lab[..., 0] * (1 - 0.38 * weight)
    new[..., 1:] = lab[..., 1:] * (1 - 0.95 * weight[..., None])
    out = rgba.copy()
    changed = weight > 0
    out[changed, :3] = np.rint(lab2rgb(new[changed][None])[0] * 255).astype(np.uint8)
    return out


def stratus_white(frames, facing, whites):
    import seg
    import recolour4 as X
    labels, sources = {}, dict(enumerate(frames))
    for i, src in sources.items():
        masks, lab, _a, _b = seg.segment(src)
        labels[i] = seg.finish(seg.labels(masks), lab[..., 0], src[:, :, 3] >= 128)
    labels, _moved = X.fuse(labels, sources, set(loop_pairs(len(frames))))
    return [X.recolour(sources[i], labels[i])[0] for i in sources]


RUN = {'ogre-black': ogre, 'king-stratus-white': stratus_white}


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
