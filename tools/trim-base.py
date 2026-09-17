#!/usr/bin/env python3
"""Cut the sculpt's round base disc off every voxel model.

Each sculpt stands on a wide turntable disc. Voxelized, it is the bottom 3-4
rows (~18 % of the voxels) and, from the game's ~52 deg camera, it is the widest
thing on the square - the pieces read as blobs. This removes it and keeps at
most ONE row of it as the figure's own feet/plinth, so a piece that stands on a
thin stem still has something to stand on.

  disc rows  = a run of 2..5 near-constant-width bottom rows followed by a >=40 %
               drop (a robe hem flares, a disc does not taper at all).
  plinth     = row (d-1) clipped to the first non-disc row's footprint dilated by
               1, kept only when the figure would otherwise stand on < 25 % of
               the disc's own area.
  y          = shifted down so the model still stands on y = 0, and size[1] is
               re-set to the new height: the loader scales by
               TARGET_HEIGHT / size[1] (src/render/voxels.ts), so this *is* the
               height normalisation - the figure keeps its world height and just
               stops wasting a fifth of it on a disc.

`shade` / `accent` are filtered with the same index mask, so they stay aligned.
Idempotent: a trimmed model has no near-constant bottom run left to detect.

Usage:  trim-base.py [--only pawn,beast] [--dry-run] [--selftest]
Needs:  pillow numpy
Writes: public/models/<piece>.json
        docs/research/sprites/trim-base-debug.png   (before | after | in-game)
"""
import argparse
import glob
import json
import os

import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS = os.path.join(ROOT, 'public/models')
DEBUG = os.path.join(ROOT, 'docs/research/sprites/trim-base-debug.png')

SS = 5              # debug render: pixels per voxel
IVORY = np.array([0xf1, 0xe9, 0xd6], float)
SHADE_DIM = 0.6     # how src/render/voxels.ts maps the shade byte (main x 0.6..1)
FLAT = 0.10         # rows within +-10 % of each other count as "the same width"
DROP = 0.60         # the row above the disc holds < 60 % of the disc's voxels
MAX_DISC = 5        # a disc is never more than 5 rows of a 37-row model
THIN = 0.25         # figure footprint under 25 % of the disc's -> keep a plinth


def disc_rows(y, nrows):
    """Number of bottom rows that are the base disc (0 = no disc found)."""
    cnt = np.bincount(y, minlength=nrows)
    d = 1
    while d < min(MAX_DISC, nrows) and abs(cnt[d] - cnt[0]) <= FLAT * cnt[0]:
        d += 1
    return d if d >= 2 and cnt[d] < DROP * cnt[d - 1] else 0


def trim(model):
    """(new model, note). Returns the model unchanged when there is no disc."""
    vox = np.array(model['voxels'], int)
    nrows = model['size'][1]
    d = disc_rows(vox[:, 1], nrows)
    if not d:
        return model, 'no disc'

    cnt = np.bincount(vox[:, 1], minlength=nrows)
    foot = {(x, z) for x, y, z in vox[vox[:, 1] == d]}
    grown = {(x + dx, z + dz) for x, z in foot for dx in (-1, 0, 1) for dz in (-1, 0, 1)}
    thin = cnt[d] < THIN * cnt[0]
    plinth = (vox[:, 1] == d - 1) & np.array([(x, z) in grown for x, _, z in vox]) if thin \
        else np.zeros(len(vox), bool)
    keep = (vox[:, 1] >= d) | plinth
    shift = d - 1 if thin else d

    vox = vox[keep]
    vox[:, 1] -= shift
    out = {'size': [int(np.ptp(vox[:, i]) + 1) if i != 1 else int(vox[:, 1].max() + 1) for i in range(3)],
           'voxels': vox.tolist()}
    for k in ('shade', 'accent'):
        if k in model:
            out[k] = [v for v, m in zip(model[k], keep) if m]
    note = (f'disc {d} rows, {(~keep).sum():5d} voxels off ({(~keep).mean():4.1%}), '
            f'{"plinth " + str(int(plinth.sum())) if thin else "no plinth":>11s}, '
            f'height {nrows} -> {out["size"][1]}')
    return out, note


def front(model, height=None):
    """Front view (from +z, the sculpts' facing), painted like the game does."""
    vox = np.array(model['voxels'], int)
    shade = np.array(model.get('shade') or [255] * len(vox))
    acc = model.get('accent') or [0] * len(vox)
    x, y, z = vox.T
    w, h = np.ptp(x) + 1, model['size'][1]
    img = np.zeros((h, w, 4), np.uint8)
    for i in np.argsort(z):            # far to near: the nearest voxel wins
        c = np.array(acc[i], float) if acc[i] else IVORY * (SHADE_DIM + (1 - SHADE_DIM) * shade[i] / 255)
        img[h - 1 - y[i], x[i] - x.min()] = (*np.clip(c, 0, 255).astype(np.uint8), 255)
    im = Image.fromarray(img, 'RGBA').resize((w * SS, h * SS), Image.NEAREST)
    if height and im.height != height:  # what the loader does: same world height
        im = im.resize((max(1, round(im.width * height / im.height)), height), Image.NEAREST)
    return im


def sheet(rows):
    """before | after | after re-normalised to the before's height (the in-game size)."""
    H = max(im.height for r in rows for im in r[1:])
    cw = max(im.width for r in rows for im in r[1:]) + 14
    out = Image.new('RGB', (cw * 3, (H + 14) * len(rows)), (0x22, 0x22, 0x26))
    dr = ImageDraw.Draw(out)
    for ri, (name, *tiles) in enumerate(rows):
        for ci, im in enumerate(tiles):
            out.paste(im, (ci * cw + (cw - im.width) // 2, ri * (H + 14) + H - im.height), im)
        dr.text((4, ri * (H + 14) + H + 2), name, (0xc8, 0xc4, 0xbc))
    for ci, lab in enumerate(('before', 'after', 'after @ game height')):
        dr.text((ci * cw + 4, 2), lab, (0x99, 0xe5, 0x50))
    return out


def selftest():
    """A 4x7x4 tower on a 10x3x10 disc: the 3 disc rows go, a 6x6 plinth stays."""
    disc = [[x, y, z] for y in range(3) for x in range(-5, 5) for z in range(-5, 5)]
    tower = lambda r: [[x, y, z] for y in range(3, 10) for x in range(-r, r) for z in range(-r, r)]
    vox = disc + tower(2)
    m = {'size': [10, 10, 10], 'voxels': vox, 'shade': [128] * len(vox)}
    t, note = trim(m)
    ys = [v[1] for v in t['voxels']]
    assert min(ys) == 0 and t['size'][1] == 8, (t['size'], note)
    assert sum(y == 0 for y in ys) == 36, 'plinth = the 4x4 footprint dilated by 1'
    assert len(t['shade']) == len(t['voxels'])
    assert trim(t)[1] == 'no disc', 'must be idempotent'
    wide = trim({'size': [10, 10, 10], 'voxels': disc + tower(3)})[0]
    assert min(v[1] for v in wide['voxels']) == 0 and wide['size'][1] == 7, 'wide feet need no plinth'
    print('selftest ok:', note)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', help='comma-separated piece names')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--selftest', action='store_true')
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    only = a.only.split(',') if a.only else None
    rows = []
    for path in sorted(glob.glob(os.path.join(MODELS, '*.json'))):
        name = os.path.basename(path)[:-5]
        if only and name not in only:
            continue
        model = json.load(open(path))
        out, note = trim(model)
        print(f'{name:9s} {note}')
        if out is model:
            continue        # nothing trimmed: keep the existing contact sheet
        before = front(model)
        rows.append((name, before, front(out), front(out, before.height)))
        if not a.dry_run:
            with open(path, 'w') as f:
                json.dump(out, f, separators=(',', ':'))
    if rows:
        os.makedirs(os.path.dirname(DEBUG), exist_ok=True)
        sheet(rows).save(DEBUG, optimize=True)
        print('->', DEBUG)


if __name__ == '__main__':
    main()
