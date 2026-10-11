#!/usr/bin/env python3
"""Bake the painted colour-reference sheets onto the voxel models.

Each sheet holds a turnaround of clean views of the painted sculpt (plus one
annotated view we never touch). VIEWS below records the crop cell of every
clean view, so the bake is reproducible.

Per model: cut out each view (rembg + base-disc strip) -> align it to the
model's silhouette along that axis -> sample the colour of every surface voxel
visible from that view -> flood the colour to the voxels no view can see ->
write `shade` (per-model normalised luminance) and `accent` (the painted RGB,
only where the paint is warm/saturated/glowing) back into the model JSON.

The sculpts' facing was not assumed: --facing scores every front crop against
both the +z and the -z silhouette (mirror images of each other, so the props -
pike, shield, cape, gear - decide it). All 11 face +z; see FRONT.

Usage:  paint-voxels.py [--only pawn,beast] [--no-cache] [--facing] [--selftest]
Needs:  pillow numpy scipy "rembg[cpu]"
Writes: public/models/<piece>.json  (adds "shade" and "accent")
        docs/research/sprites/voxel-paint-debug.png
"""
import argparse
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRATCH = ('/private/tmp/claude-501/-Users-za-Documents-king-down-chess/'
           'af00383a-be3c-43af-8c39-b2e17188dc55/scratchpad')
SHEETS = os.path.join(SCRATCH, 'drive/art stuff/Characters/color guides')
CACHE = os.path.join(SCRATCH, 'voxel-paint-cutouts')

# piece -> (sheet stem, {view: crop cell in sheet pixels}).
# 'front'/'back' are the two turnaround views along the model's z axis, 'sideA'
# /'sideB' the two along x (which is which is decided by silhouette match).
# Cells are generous - the cutout is trimmed to the figure afterwards - but they
# never touch a neighbouring view, the colour swatches or the annotated view.
VIEWS = {
    'pawn':    ('Pawn_color_ref', {
        'front': (660, 200, 1150, 970),  'back':  (150, 1000, 620, 1780),
        'sideA': (150, 200, 620, 970),   'sideB': (660, 1000, 1150, 1780)}),
    'knight':  ('Knight_color_ref', {
        'front': (40, 10, 540, 780),     'back':  (560, 10, 1090, 780),
        'sideA': (40, 790, 540, 1560),   'sideB': (560, 790, 1090, 1560)}),
    'bishop':  ('bishop_color_ref', {
        'front': (660, 30, 1150, 820),   'back':  (660, 830, 1150, 1650),
        'sideA': (150, 30, 640, 820),    'sideB': (150, 830, 640, 1650)}),
    'rook':    ('rook_colored', {
        'front': (0, 20, 620, 800),      'back':  (640, 20, 1250, 800),
        'sideA': (0, 810, 620, 1590),    'sideB': (640, 810, 1250, 1590)}),
    'queen':   ('Queen_color_ref', {   # row2 holds two 3/4 views - unusable
        'front': (630, 120, 1150, 890),  'back':  (100, 120, 620, 890)}),
    'king':    ('kingFrost_color_ref', {   # kingFrost = the king piece
        'front': (120, 20, 620, 810),    'back':  (640, 20, 1150, 810),
        'sideA': (120, 820, 620, 1620),  'sideB': (640, 820, 1150, 1620)}),
    'archer':  ('Archer_color_ref', {
        'front': (100, 250, 630, 1070),  'back':  (100, 1090, 630, 1890),
        'sideA': (640, 250, 1160, 1070), 'sideB': (640, 1090, 1160, 1890)}),
    'guard':   ('guard_color_ref', {   # row2 right is a high-angle 3/4 - skipped
        'front': (0, 20, 700, 810),      'back':  (720, 20, 1250, 810),
        'sideA': (0, 830, 700, 1610)}),
    'maester': ('mister_color_ref', {
        'front': (660, 20, 1180, 810),   'back':  (150, 20, 650, 810),
        'sideA': (150, 830, 650, 1610),  'sideB': (660, 830, 1180, 1610)}),
    'beast':   ('Beast_color_guide', {   # row1 left is a 3/4 - skipped
        'front': (630, 220, 1180, 1040), 'back':  (80, 1040, 620, 1800),
        'sideA': (630, 1040, 1180, 1800)}),
    'paladin': ('Paladin_coloring_ref', {   # one row of 5; cell c repeats the front
        'front': (340, 300, 1580, 1450), 'back':  (4640, 300, 5650, 1450),
        'sideA': (1600, 300, 2420, 1450), 'sideB': (3560, 300, 4560, 1450)}),
}

# view direction -> (depth axis, depth sign, image-right axis, right sign).
# Image right r = up x d, with up = +y, so a camera on +z sees +x to the right.
DIRS = {'+z': (2, 1, 0, 1), '-z': (2, -1, 0, -1),
        '+x': (0, 1, 2, -1), '-x': (0, -1, 2, 1)}

# Which way the sculpts face. Verified with --facing: scoring every front crop
# against the +z and the -z silhouette (mirror images of each other) puts all 11
# models on +z, decisively so for the ones with an asymmetric prop - pawn +0.12,
# rook +0.14, paladin +0.15 mean IoU. So voxelize.py's "--yaw ... faces -z" note
# is stale: the sculpt's front is +z.
FRONT = '+z'

SS = 6              # debug render: pixels per voxel
IVORY = np.array([0xf1, 0xe9, 0xd6], float)
MIN_IOU = 0.55      # a view that aligns worse than this is dropped
SHADE_LO, SHADE_HI = 2.0, 98.0     # luminance percentiles mapped to the ramp
SHADE_DIM = 0.6     # how the loader maps the shade byte (main x SHADE_DIM..1),
                    # mirrored here so the debug render shows the game's contrast
ACC_S, ACC_S_FLOOR = 0.35, 0.20    # accent saturation, and how far autotune drops it
ACC_HUE = (60.0, 330.0)            # warm: h <= 60 or h >= 330
ACC_GLOW_V, ACC_GLOW_S = 0.90, 0.30    # emissive: bright and saturated
ACC_VMIN, ACC_VMAX = 0.12, 0.55    # accent brightness floor, and its autotune ceiling
ACC_LO, ACC_HI = 0.15, 0.40        # wanted accent fraction
BASE_HUE = 25.0     # degrees of hue that still count as base-disc red


def hsv(rgb):
    """H (0..360), S, V (0..1) from any (..., 3) RGB array in 0..255."""
    r, g, b = np.moveaxis(np.asarray(rgb, float) / 255, -1, 0)
    v, mn = np.max([r, g, b], 0), np.min([r, g, b], 0)
    d = np.maximum(v - mn, 1e-9)
    h = np.where(v == r, (g - b) / d, np.where(v == g, 2 + (b - r) / d, 4 + (r - g) / d))
    return (h * 60) % 360, np.where(v > 0, (v - mn) / np.maximum(v, 1e-9), 0), v


def strip_base(rgba):
    """Erase the red base disc the figure stands on.

    Anchored to the bottom of the *figure*, not of the crop (the crop runs past
    the disc, so the last rows are empty), and grown only within the disc's own
    colour, so a red cape or robe that touches the disc survives.
    """
    rgb, a = rgba[..., :3].astype(float), rgba[..., 3]
    h = a.shape[0]
    fg = a > 8
    if not fg.any():
        return rgba
    y1 = np.nonzero(fg.any(1))[0][-1]                  # last row with any figure
    hue, s, v = hsv(rgba[..., :3])
    seedpx = np.zeros_like(a, bool)
    seedpx[max(0, y1 - int(h * 0.06)):y1 + 1] = True
    seedpx &= (s > 0.45) & (v > 0.15) & (a > 100)
    if seedpx.sum() < 20:
        print(f'    ! no base disc found ({a.shape})', file=sys.stderr)
        return rgba
    # Match the disc by hue, not by RGB distance: its lit top face and its
    # shadowed rim are far apart in RGB but the same red.
    seed = np.median((hue[seedpx] + 180) % 360) - 180    # red straddles 0/360
    cand = (abs((hue - seed + 180) % 360 - 180) < BASE_HUE) & (s > 0.35) & fg
    # The disc is a wide ellipse: find its widest rows, walk up to where it
    # stops being wide, and erase from there down. A red cape or robe hanging
    # into the disc is narrow, so the walk stops at the disc's top rim instead
    # of eating the cloth.
    rc = cand.sum(1).astype(float)
    low = np.zeros(h, bool)
    low[int(h * 0.6):] = True           # discs live in the bottom of the crop
    wide = (rc > 0.5 * rc[low].max()) & low
    if not wide.any():
        return rgba
    top = np.nonzero(wide)[0][-1]
    while top > 0 and wide[top - 1]:
        top -= 1
    lim = max(0, top - int(h * 0.02))   # the far rim thins out above the wide
    while top > lim and rc[top - 1] > 0:   # part; take it too, or the boots
        top -= 1                           # come out disc-red
    cand[:top] = False
    out = rgba.copy()
    out[..., 3] = np.where(cand, 0, a)
    return out


def disc_rows(vox, size):
    """How many bottom voxel rows are the sculpt's base disc (3, sometimes 4)."""
    cnt = np.bincount(vox[:, 1], minlength=size[1])
    y = 0
    while y < size[1] and cnt[y] >= 0.6 * cnt[0]:
        y += 1
    return y


def despeckle(rgba, frac=0.002):
    lab, n = ndimage.label(rgba[..., 3] > 16)
    if n < 2:
        return rgba
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    keep = np.isin(lab, 1 + np.nonzero(sizes >= sizes.max() * frac)[0])
    out = rgba.copy()
    out[..., 3] = np.where(keep, rgba[..., 3], 0)
    return out


def trim(rgba):
    ys, xs = np.nonzero(rgba[..., 3] > 8)
    return rgba[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def cutout(piece, view, cache=True):
    """Crop one clean view, drop the background and the base disc.

    Only the rembg matte is cached (it is the slow part); the disc strip runs
    every time, so it can be retuned without re-cutting 40 views.
    """
    path = os.path.join(CACHE, f'{piece}-{view}.png')
    if not (cache and os.path.exists(path)):
        stem, cells = VIEWS[piece]
        src = Image.open(os.path.join(SHEETS, stem + '.jpg')).convert('RGB').crop(cells[view])
        from rembg import remove          # imported late: it loads a model
        cut = remove(src, alpha_matting=True, alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15, alpha_matting_erode_size=6,
                     post_process_mask=True)
        os.makedirs(CACHE, exist_ok=True)
        Image.fromarray(despeckle(np.asarray(cut.convert('RGBA')))).save(path)
    return trim(strip_base(np.asarray(Image.open(path).convert('RGBA'))))


def project(vox, size, dname):
    """Surface voxels seen from `dname`: (indices, col, row, silhouette, w, h)."""
    ax, sg, rax, rsg = DIRS[dname]
    h, w = size[1], size[rax]
    col = vox[:, rax] if rsg > 0 else size[rax] - 1 - vox[:, rax]
    row = size[1] - 1 - vox[:, 1]
    depth = vox[:, ax] * sg
    best = np.full((h, w), -10**6)
    np.maximum.at(best, (row, col), depth)
    hit = depth == best[row, col]
    return np.nonzero(hit)[0], col[hit], row[hit], best > -10**6, w, h


def fit(alpha, sil, coarse):
    """Align a cutout to a voxel silhouette. Returns (ox, oy, sx, sy, iou).

    Starts from bounding-box to bounding-box, then searches scale/offset for the
    best silhouette overlap - the painted renders are near- but not exactly
    orthographic, so the box fit alone slides by a voxel or two.
    """
    h, w = sil.shape
    ys, xs = np.nonzero(sil)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    ays, axs = np.nonzero(alpha > 96)
    ax0, ax1, ay0, ay1 = axs.min(), axs.max() + 1, ays.min(), ays.max() + 1
    aw, ah = ax1 - ax0, ay1 - ay0
    sx0, sy0 = aw / (x1 - x0), ah / (y1 - y0)          # image px per voxel
    ox0, oy0 = ax0 - x0 * sx0, ay0 - y0 * sy0
    rows, cols = np.indices((h, w)) + 0.5
    scales = [1.0] if coarse else [0.94, 0.97, 1.0, 1.03, 1.06]
    offs = [-.06, -.03, 0, .03, .06] if coarse else [-.04, -.02, -.01, 0, .01, .02, .04]
    best = (ox0, oy0, sx0, sy0, -1.0)
    for fx in scales:
        for fy in scales:
            for dx in offs:
                for dy in offs:
                    sx, sy = sx0 * fx, sy0 * fy
                    ox = ox0 + (sx0 - sx) * (x0 + x1) / 2 + dx * aw
                    oy = oy0 + (sy0 - sy) * (y0 + y1) / 2 + dy * ah
                    m = ndimage.map_coordinates(alpha, [oy + sy * rows, ox + sx * cols],
                                                order=1, mode='constant') > 96
                    inter = np.count_nonzero(m & sil)
                    iou = inter / max(np.count_nonzero(m | sil), 1)
                    if iou > best[4]:
                        best = (ox, oy, sx, sy, iou)
    return best


def sample(rgba, ox, oy, sx, sy, col, row):
    """Median colour of each voxel's footprint; None where the view is empty."""
    rad = max(1, int(min(sx, sy) * 0.35))
    off = np.arange(-rad, rad + 1)
    dy, dx = np.meshgrid(off, off, indexing='ij')
    py = np.clip((oy + sy * (row + 0.5))[:, None] + dy.ravel(), 0, rgba.shape[0] - 1).astype(int)
    px = np.clip((ox + sx * (col + 0.5))[:, None] + dx.ravel(), 0, rgba.shape[1] - 1).astype(int)
    patch = rgba[py, px]                                    # (n, k, 4)
    ok = patch[..., 3] > 96
    rgb = np.where(ok[..., None], patch[..., :3].astype(float), np.nan)
    with np.errstate(all='ignore'):
        med = np.nanmedian(rgb, axis=1)
    return med, ok.any(axis=1)


def accent_mask(rgb, s_thr, vmin):
    """Which voxels keep their painted colour instead of the army colour:
    warm saturated paint (skin, leather, hair, gold, wood, teeth) and anything
    bright and saturated (glows). Cool cloth, hide and steel stay army-tinted."""
    h, s, v = hsv(np.clip(rgb, 0, 255))
    warm = (s > s_thr) & ((h <= ACC_HUE[0]) | (h >= ACC_HUE[1])) & (v > vmin)
    return warm | ((v > ACC_GLOW_V) & (s > ACC_GLOW_S))


def paint(piece, cache=True):
    """Colour every voxel of one model. Returns (model dict, report line)."""
    path = os.path.join(ROOT, 'public/models', piece + '.json')
    model = json.load(open(path))
    size, vox = model['size'], np.array(model['voxels'], int)
    vox = vox + np.array([size[0] // 2, 0, size[2] // 2])    # x/z are centred
    views = {v: cutout(piece, v, cache) for v in VIEWS[piece][1]}

    # The sculpts were voxelized standing on their base disc, and the disc is
    # the widest thing in the model - align the figure above it, not the disc.
    dtop = disc_rows(vox, size)
    fig = np.nonzero(vox[:, 1] >= dtop)[0]
    fvox = vox[fig]

    # The sheets never say which side view is which, so let the silhouettes
    # decide: +x and -x are mirror images, and the props (shield, cape, gear)
    # break the tie. The facing is fixed (see FRONT / --facing).
    proj = {d: project(fvox, size, d) for d in DIRS}
    iou = {(v, d): fit(views[v][..., 3].astype(float), proj[d][3], True)[4]
           for v in views for d in DIRS}
    sides = max('+x', '-x', key=lambda s: sum(iou[(v, s if v == 'sideA' else opp(s))]
                                              for v in views if v.startswith('side')))
    dirmap = {'front': FRONT, 'back': opp(FRONT), 'sideA': sides, 'sideB': opp(sides)}

    acc = np.zeros((len(vox), 3))
    cnt = np.zeros(len(vox))
    used = []
    for v in views:
        d = dirmap[v]
        idx, col, row, sil, w, h = proj[d]
        rgba = views[v]
        ox, oy, sx, sy, q = fit(rgba[..., 3].astype(float), sil, False)
        if q < MIN_IOU:
            used.append(f'{v}:{d} IoU {q:.2f} DROPPED')
            continue
        used.append(f'{v}:{d} IoU {q:.2f}')
        med, ok = sample(rgba, ox, oy, sx, sy, col, row)
        acc[fig[idx[ok]]] += med[ok]
        cnt[fig[idx[ok]]] += 1

    # voxels no view could see take the nearest painted voxel's colour
    rgb = np.zeros((len(vox), 3))
    rgb[cnt > 0] = acc[cnt > 0] / cnt[cnt > 0, None]
    grid = np.zeros(size, np.int32)
    grid[tuple(vox.T)] = np.arange(len(vox)) + 1
    seen = np.zeros(size, bool)
    seen[tuple(vox[cnt > 0].T)] = True
    _, ind = ndimage.distance_transform_edt(~seen, return_indices=True)
    blind = np.nonzero(cnt == 0)[0]
    rgb[blind] = rgb[grid[tuple(ind[:, *vox[blind].T])] - 1]

    lum = rgb @ [0.2126, 0.7152, 0.0722]
    lo, hi = np.percentile(lum[fig], [SHADE_LO, SHADE_HI])
    n = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1)
    shade = np.round(255 * n).astype(int)

    base = np.ones(len(vox), bool)      # the base disc is army colour, unpainted
    base[fig] = False
    shade[base] = int(np.median(shade[fig]))

    # Tune the accent mask into the wanted band: first widen it by accepting
    # less saturated warms, then narrow it by dropping dark warms (a big dark
    # red cape would otherwise swamp the army colour).
    def accents(s_thr, vmin):
        m = accent_mask(rgb, s_thr, vmin)
        m[base] = False
        return m
    s_thr, vmin = ACC_S, ACC_VMIN
    mask = accents(s_thr, vmin)
    while mask.mean() < ACC_LO and s_thr > ACC_S_FLOOR:
        s_thr = round(s_thr - 0.025, 3)
        mask = accents(s_thr, vmin)
    while mask.mean() > ACC_HI and vmin < ACC_VMAX:
        vmin = round(vmin + 0.05, 3)
        mask = accents(s_thr, vmin)
    if mask.mean() < ACC_LO:
        # Nothing warm in this paint (the frost king, the steel guard). Accent
        # its brightest voxels instead, so the highlights still read as paint.
        order = np.argsort(-lum)
        order = order[~mask[order] & ~base[order]]
        mask[order[:int(ACC_LO * len(vox)) - int(mask.sum())]] = True
    unseen = np.count_nonzero(cnt[fig] == 0) / len(fig)
    model['shade'] = shade.tolist()
    model['accent'] = [[int(r), int(g), int(b)] if m else 0
                       for m, (r, g, b) in zip(mask, np.round(rgb).astype(int))]
    line = (f'{piece:8s} sides={sides}  accents {mask.mean():5.1%}'
            f' (S>{s_thr} V>{vmin})  unpainted {unseen:4.0%}  ' + ', '.join(used))
    return model, line, dict(vox=fvox, size=size, front=FRONT,
                             rgb=rgb[fig], shade=shade[fig], mask=mask[fig])


def opp(d):
    return d.replace('+', '~').replace('-', '+').replace('~', '-')


def render(vox, size, dname, rgb, shade, mask, front=None):
    """Flat projected view of the painted result, ivory base x shade + accents."""
    idx, col, row, sil, w, h = project(vox, size, dname)
    img = np.zeros((h, w, 4), np.uint8)
    c = IVORY * (SHADE_DIM + (1 - SHADE_DIM) * shade[idx] / 255)[:, None]
    c[mask[idx]] = rgb[idx][mask[idx]]
    img[row, col, :3] = np.clip(c, 0, 255).astype(np.uint8)
    img[row, col, 3] = 255
    return np.asarray(Image.fromarray(img, 'RGBA').resize((w * SS, h * SS), Image.NEAREST))


def debug_sheet(rows):
    """painted front cutout | rendered front | rendered back, one row per model."""
    H = 37 * SS
    tiles = [[np.asarray(Image.fromarray(t, 'RGBA').resize(
        (max(1, round(t.shape[1] * H / t.shape[0])), H), Image.NEAREST if i else Image.LANCZOS))
        for i, t in enumerate(r)] for r in rows]
    cw = max(t.shape[1] for r in tiles for t in r) + 10
    sheet = Image.new('RGB', (cw * 3, H * len(tiles) + 4), (0x22, 0x22, 0x26))
    for ri, r in enumerate(tiles):
        for ci, t in enumerate(r):
            im = Image.fromarray(t, 'RGBA')
            sheet.paste(im, (ci * cw + (cw - im.width) // 2, ri * H), im)
    return sheet


def facing_check():
    """Score every front/back pair against both z directions. The sculpts face
    the winner; a model that disagrees means its crops or its STL are flipped."""
    print(f"{'piece':9s} {'front=+z':>9s} {'front=-z':>9s}  margin")
    for piece in VIEWS:
        model = json.load(open(os.path.join(ROOT, 'public/models', piece + '.json')))
        size = model['size']
        vox = np.array(model['voxels'], int) + np.array([size[0] // 2, 0, size[2] // 2])
        vox = vox[vox[:, 1] >= disc_rows(vox, size)]
        views = VIEWS[piece][1]
        iou = {(v, d): fit(cutout(piece, v)[..., 3].astype(float),
                           project(vox, size, d)[3], True)[4]
               for v in views for d in DIRS}
        def best(f):
            return max(sum(iou[(v, {'front': f, 'back': opp(f), 'sideA': s,
                                    'sideB': opp(s)}[v])] for v in views) / len(views)
                       for s in ('+x', '-x'))
        a, b = best('+z'), best('-z')
        print(f'{piece:9s} {a:9.3f} {b:9.3f}  {a - b:+.3f}'
              + ('  <- disagrees' if (a > b) != (FRONT == '+z') else ''))


def main(a):
    only = set(a.only.split(',')) if a.only else None
    rows = []
    for piece in VIEWS:
        if only and piece not in only:
            continue
        model, line, r = paint(piece, not a.no_cache)
        print(line)
        path = os.path.join(ROOT, 'public/models', piece + '.json')
        with open(path, 'w') as f:
            json.dump(model, f, separators=(',', ':'))
        rows.append([cutout(piece, 'front'), render(dname=r['front'], **r),
                     render(dname=opp(r['front']), **r)])
    out = os.path.join(ROOT, 'docs/research/sprites/voxel-paint-debug.png')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    debug_sheet(rows).save(out, optimize=True)
    print('wrote', out)


def selftest():
    size = [3, 4, 3]
    vox = np.array([[x, y, z] for x in range(3) for y in range(4) for z in range(3)])
    idx, col, row, sil, w, h = project(vox, size, '+z')
    assert (w, h) == (3, 4) and sil.all() and len(idx) == 12
    assert (vox[idx][:, 2] == 2).all(), 'camera on +z must hit the z=2 layer'
    assert col[np.argmax(vox[idx][:, 0])] == 2, 'camera on +z sees +x to the right'
    assert project(vox, size, '-z')[1][np.argmax(vox[project(vox, size, '-z')[0]][:, 0])] == 0
    assert opp('+x') == '-x' and opp('-z') == '+z'

    sil = np.zeros((8, 6), bool)                       # a box, and its painted twin
    sil[2:7, 1:5] = True
    alpha = np.zeros((80, 60), float)
    alpha[20:70, 10:50] = 255
    ox, oy, sx, sy, q = fit(alpha, sil, True)
    assert q > 0.9, q
    rgba = np.zeros((80, 60, 4), np.uint8)
    rgba[..., 3] = alpha.astype(np.uint8)
    rgba[20:45, 10:50, :3] = (200, 40, 40)             # top half red
    rgba[45:70, 10:50, :3] = (40, 40, 200)             # bottom half blue
    ys, xs = np.nonzero(sil)
    med, ok = sample(rgba, ox, oy, sx, sy, xs, ys)
    assert ok.all() and med[0][0] > 150 and med[-1][2] > 150, med

    m = accent_mask(np.array([[220, 150, 60], [40, 80, 200], [250, 250, 250],
                              [60, 25, 18]], float), ACC_S, ACC_VMIN)
    assert list(m) == [True, False, False, True], m       # warm gold yes, blue/white no
    assert not accent_mask(np.array([[60, 25, 18]], float), ACC_S, 0.4)[0]   # dark warm

    fig = np.zeros((100, 60, 4), np.uint8)                # a figure on a red disc,
    fig[..., 3] = 255                                     # wearing a red cape
    fig[10:88, 22:38, :3] = (90, 90, 100)
    fig[40:92, 26:34, :3] = (150, 20, 20)                 # cape, down into the disc
    for i, y in enumerate(range(88, 96)):                 # elliptical disc
        fig[y, 8 + abs(i - 4):52 - abs(i - 4), :3] = (230, 30, 40)
    fig[96:] = 0
    out = strip_base(fig)
    assert out[92, 30, 3] == 0 and out[90, 12, 3] == 0, 'disc not erased'
    assert out[60, 30, 3] == 255 and out[80, 30, 3] == 255, 'cape eaten'

    v = np.array([[x, y, z] for y in range(6) for x in range(4) for z in range(4)
                  if y < 2 or (x == 1 and z == 1)])
    assert disc_rows(v, [4, 6, 4]) == 2, disc_rows(v, [4, 6, 4])
    print('selftest ok')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--only')
    p.add_argument('--no-cache', action='store_true')
    p.add_argument('--facing', action='store_true', help='re-check which way the sculpts face')
    p.add_argument('--selftest', action='store_true')
    args = p.parse_args()
    selftest() if args.selftest else facing_check() if args.facing else main(args)
