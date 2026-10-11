#!/usr/bin/env python3
"""Bake the painted colour-reference sheets into army-tinted piece sprites.

Each sheet holds several clean turnaround views of the painted 3D character plus
one big annotated view. CROPS below records the front-ish clean view of every
sheet (original sheet pixels) so the bake is reproducible.

Per piece: crop -> rembg cutout -> strip the base disc -> tint to the army colour
while the painted warm/emissive accents (skin, hair, leather, gold, teeth) keep
their illustration colour -> box downscale -> 1 px outline.

Usage:  sprites-painted.py [--sheets DIR] [--height 192] [--only pawn,beast]
        sprites-painted.py --selftest
Needs:  pillow numpy scipy "rembg[cpu]"   (rembg pulls a ~176 MB U^2-Net once)
Writes: public/sprites/painted-<set>/<piece>-{w,b}.png
        docs/research/sprites/painted-<set>.png, painted-accent-debug.png
"""
import argparse
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

Image.MAX_IMAGE_PIXELS = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEETS = ('/private/tmp/claude-501/-Users-za-Documents-king-down-chess/'
          'af00383a-be3c-43af-8c39-b2e17188dc55/scratchpad/drive/art stuff/'
          'Characters/color guides')
CACHE = '/private/tmp/claude-501/-Users-za-Documents-king-down-chess/af00383a-be3c-43af-8c39-b2e17188dc55/scratchpad/painted-cutouts'

# piece -> (sheet stem, crop box in sheet pixels, y of the base disc's top edge, view)
# The crop runs ~60 px past the disc top so the disc colour can be sampled from
# the bottom rows; everything disc-coloured below `base_y` is then erased.
CROPS = {
    'pawn':           ('Pawn_color_ref',           (830, 220, 1120, 960),    899,  'row1 right, front'),
    'knight':         ('Knight_color_ref',         (95, 10, 510, 720),       650,  'row1 left, front'),
    'bishop':         ('bishop_color_ref',         (770, 20, 1120, 830),     772,  'row1 right, front'),
    'rook':           ('rook_colored',             (0, 5, 645, 730),         628,  'row1 left, front 3/4'),
    'queen':          ('Queen_color_ref',          (630, 935, 1020, 1650),   1576, 'row2 right, front'),
    'archer':         ('Archer_color_ref',         (140, 300, 600, 1070),    1006, 'row1 left, front'),
    'paladin':        ('Paladin_coloring_ref',     (500, 270, 1560, 1350),   1224, 'row1 left, front'),
    'guard':          ('guard_color_ref',          (20, 25, 690, 745),       678,  'row1 left, front'),
    'maester':        ('mister_color_ref',         (780, 25, 1110, 680),     606,  'row1 right, front'),
    'beast':          ('Beast_color_guide',        (730, 255, 1165, 960),    899,  'row1 right, front'),
    'king-frost':     ('kingFrost_color_ref',      (120, 20, 495, 810),      750,  'row1 left, front'),
    'king-ember':     ('king_ember_color_ref',     (700, 20, 1300, 810),     749,  'row1 right, front'),
    'king-celestial': ('King_Celestial_color_ref', (155, 220, 510, 1020),    960,  'row1 left, front'),
    'king-gaya':      ('King_Gaya_color_ref',      (1320, 340, 2050, 1730),  1612, 'row1 right, front'),
}

# army ramps: (shadow, highlight, gamma). The tinted figure is lerped between
# the two colours by its own normalised luminance, so the painted shading
# survives the re-tint. Gamma is the contrast knob: below 1 lifts the shadows so
# a dark army stays readable, above 1 deepens them so a pale army does not
# disappear into the light board.
ARMIES = {
    'painted-ivory-charcoal': {'w': ('#8a8272', '#f1e9d6', 1.25), 'b': ('#3a3a42', '#8f8f9c', 0.70)},
    'painted-blue-red':       {'w': ('#2f4d77', '#a5c1e8', 1.00), 'b': ('#5e211a', '#d98070', 0.90)},
}

# The 11 game pieces. The king takes Frost for white and Ember for black.
PIECES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king',
          'archer', 'paladin', 'guard', 'maester', 'beast']
KING = {'w': 'king-frost', 'b': 'king-ember'}
KING_VARIANTS = ['king-frost', 'king-ember', 'king-celestial', 'king-gaya']

OUTLINE = (0x14, 0x12, 0x1f, 255)
ORIG_MIX = 0.15   # fraction of painted colour kept outside the accent mask
LUM_LO, LUM_HI = 2.0, 98.0   # percentiles used to normalise the luminance
# accent mask thresholds (H in degrees, S/V in 0..1)
ACC_WARM_H, ACC_WARM_S = 58.0, 0.35   # skin / leather / hair / gold / teeth
ACC_RED_H, ACC_RED_S = 340.0, (0.30, 0.62)  # lips + pink skin, not red cloth
ACC_GLOW_V, ACC_GLOW_S = 0.92, 0.30   # emissive
ACC_VMIN = 0.12
ACC_MAX_FRAC = 0.34   # accents may not swamp the army colour on tan/brown pieces
BASE_DH, BASE_SMIN, BASE_VMIN = 13.0, 0.40, 0.12   # base-disc hue match
BASE_FRINGE = 110.0   # rgb distance used to clean the disc's antialiased edge
BASE_HUES = (0.0, 105.0)   # every sheet stands the figure on a red disc, Gaya on a green one


def hexrgb(s):
    s = s.lstrip('#')
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], float)


def hsv(rgb):
    """H (0..360), S, V (0..1) from a uint8 HxWx3 array."""
    h, s, v = np.asarray(Image.fromarray(rgb, 'RGB').convert('HSV')).astype(float).transpose(2, 0, 1)
    return h * (360.0 / 255.0), s / 255.0, v / 255.0


def strip_base(rgba, ytop):
    """Erase the base disc the figure stands on (red, or green for King Gaya).

    `ytop` is the disc's top edge, read off the sheet, so nothing above the
    figure's feet is ever at risk. Below it only disc-coloured pixels go, which
    keeps the feet that stand inside the ellipse.
    """
    rgb, a = rgba[..., :3].astype(float), rgba[..., 3]
    h, w = a.shape
    hue, s, v = hsv(np.ascontiguousarray(rgba[..., :3]))
    below = np.zeros_like(a, bool)
    below[max(ytop, 0):] = True
    # the disc is the widest thing below `ytop`, so its colour is the median
    # there; sampling the bottom rows alone fails on the bar-shaped bases.
    sample = below & (s > 0.35) & (v > BASE_VMIN) & (a > 128)
    if sample.sum() < 50:
        print('    (rembg already took the base disc)', file=sys.stderr)
        return rgba
    base = np.median(rgb[sample], axis=0)
    bh = np.median(hue[sample])
    dh = np.abs((hue - bh + 180) % 360 - 180)
    # rembg takes some discs on its own; then the sample above is boot or hem
    # colour, not disc. Every sheet bases the figure on the same saturated red
    # disc (or the green one under King Gaya), so anything else is not a disc.
    red_or_green = min(abs((bh - h0 + 180) % 360 - 180) for h0 in BASE_HUES)
    if red_or_green > 25 or np.median(s[sample]) < 0.50 or np.median(v[sample]) < 0.30:
        print('    (rembg already took the base disc)', file=sys.stderr)
        return rgba
    disc = below & (dh < BASE_DH) & (s > BASE_SMIN) & (v > BASE_VMIN) & (a > 0)
    # grow over the disc's antialiased edge and its shadowed corners; the growth
    # can never leave the band below `ytop`, so the figure is out of reach.
    fringe = below & (np.linalg.norm(rgb - base, axis=-1) < BASE_FRINGE) & (a > 0)
    disc = ndimage.binary_propagation(disc, mask=fringe | disc)
    out = rgba.copy()
    out[..., 3] = np.where(disc, 0, a)
    # A disc-coloured island that sits entirely inside the disc band is a scrap
    # of the disc, not the figure. Boots and dropped props stay: they are only
    # dropped when their own colour is the disc's.
    lab, n = ndimage.label(out[..., 3] > 16)
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl[0].start < ytop:
            continue
        part = lab[sl] == i
        if np.linalg.norm(np.median(rgb[sl][part], axis=0) - base) < 100:
            out[..., 3][lab == i] = 0
    return out


def despeckle(rgba, frac=0.002):
    """Drop cutout crumbs (rembg edge noise) but keep real detached props."""
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


def cutout(name, sheets, cache=True):
    """Crop the chosen view, drop the background and the base disc."""
    path = os.path.join(CACHE, name + '.png')
    if cache and os.path.exists(path):
        return np.asarray(Image.open(path).convert('RGBA'))
    stem, box, base_y, _ = CROPS[name]
    os.makedirs(CACHE, exist_ok=True)
    raw = os.path.join(CACHE, name + '-raw.png')                # rembg is slow
    if os.path.exists(raw):
        rgba = np.asarray(Image.open(raw).convert('RGBA'))
    else:
        src = Image.open(os.path.join(sheets, stem + '.jpg')).convert('RGB').crop(box)
        from rembg import remove      # imported late: it loads a model
        cut = remove(src, alpha_matting=True, alpha_matting_foreground_threshold=240,
                     alpha_matting_background_threshold=15, alpha_matting_erode_size=6,
                     post_process_mask=True)
        rgba = np.asarray(cut.convert('RGBA'))
        Image.fromarray(rgba).save(raw)
    rgba = trim(despeckle(strip_base(rgba, base_y - box[1])))
    Image.fromarray(rgba).save(path)
    return rgba


def accent_mask(rgba):
    """Soft mask of the painted bits that keep their illustration colour."""
    h, s, v = hsv(np.ascontiguousarray(rgba[..., :3]))
    lo, hi = ACC_RED_S
    m = ((h <= ACC_WARM_H) & (s > ACC_WARM_S))
    m |= (h >= ACC_RED_H) & (s > lo) & (s < hi)
    m |= (v > ACC_GLOW_V) & (s > ACC_GLOW_S)
    fg = rgba[..., 3] > 8
    m &= (v > ACC_VMIN) & fg
    soft = np.clip(ndimage.gaussian_filter(m.astype(np.float32), 1.0), 0, 1)
    # A tan or brown character is warm nearly everywhere. Fade the accents back
    # when they cover too much, so the army colour stays the main colour.
    frac = soft[fg].mean() if fg.any() else 0.0
    return soft * min(1.0, ACC_MAX_FRAC / frac) if frac > ACC_MAX_FRAC else soft


def tint(rgba, dark, light, gamma=1.0, mask=None):
    """Army-coloured figure with the painted accents composited back over it."""
    paint = rgba[..., :3].astype(np.float32)
    a = rgba[..., 3]
    lum = paint @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    fg = a > 8
    lo, hi = np.percentile(lum[fg], [LUM_LO, LUM_HI]) if fg.any() else (0.0, 255.0)
    ln = np.clip((lum - lo) / max(hi - lo, 1e-3), 0, 1) ** gamma
    ramp = hexrgb(dark) + ln[..., None] * (hexrgb(light) - hexrgb(dark))
    base = ramp * (1 - ORIG_MIX) + paint * ORIG_MIX
    m = (accent_mask(rgba) if mask is None else mask)[..., None]
    out = np.empty_like(rgba)
    out[..., :3] = np.clip(base * (1 - m) + paint * m, 0, 255).astype(np.uint8)
    out[..., 3] = a
    return out


def scale_outline(rgba, height, outline=OUTLINE):
    """Box downscale (premultiplied) then a 1 px outline. Nothing smooths after."""
    h, w = rgba.shape[:2]
    th = max(height - 2, 1)
    tw = max(round(w * th / h), 1)
    a = rgba[..., 3:].astype(np.float32) / 255.0
    pm = np.concatenate([rgba[..., :3] * a, rgba[..., 3:]], -1).astype(np.uint8)
    sm = np.asarray(Image.fromarray(pm, 'RGBA').resize((tw, th), Image.BOX)).astype(np.float32)
    sa = np.maximum(sm[..., 3:] / 255.0, 1e-4)
    small = np.empty((th, tw, 4), np.uint8)
    small[..., :3] = np.clip(sm[..., :3] / sa, 0, 255).astype(np.uint8)
    small[..., 3] = sm[..., 3].astype(np.uint8)

    out = np.zeros((th + 2, tw + 2, 4), np.uint8)
    out[1:-1, 1:-1] = small
    solid = out[..., 3] > 96
    ring = ndimage.binary_dilation(solid, np.ones((3, 3), bool)) & ~solid
    out[ring] = outline
    return out


def contact_sheet(sprites, height):
    """All pieces x both armies over a light and a dark strip."""
    pad, cols = 10, len(PIECES)
    cw = max(s.shape[1] for s in sprites.values()) + pad
    rows = [('w', (0xef, 0xeb, 0xe3)), ('b', (0xef, 0xeb, 0xe3)),
            ('w', (0x6f, 0x6b, 0x65)), ('b', (0x6f, 0x6b, 0x65))]
    rh = height + pad
    sheet = Image.new('RGB', (cw * cols, rh * len(rows)), (0xef, 0xeb, 0xe3))
    for r, (side, bg) in enumerate(rows):
        strip = Image.new('RGB', (cw * cols, rh), bg)
        for c in range(cols):                                   # checker the strip
            if c % 2:
                strip.paste(tuple(int(v * 0.9) for v in bg), (c * cw, 0, (c + 1) * cw, rh))
        sheet.paste(strip, (0, r * rh))
        for c, name in enumerate(PIECES):
            s = Image.fromarray(sprites[(name, side)], 'RGBA')
            sheet.paste(s, (c * cw + (cw - s.width) // 2, r * rh + rh - s.height - pad // 2), s)
    return sheet


def debug_sheet(cuts, names, height):
    """painted crop | accent mask | tinted result, for a few pieces."""
    tiles, H = [], height * 2
    for n in names:
        c = cuts[n]
        m = accent_mask(c)
        mv = np.stack([(m * 255).astype(np.uint8)] * 3 + [c[..., 3]], -1)
        res = tint(c, *ARMIES['painted-blue-red']['w'], mask=m)
        tiles += [scale_outline(x, H, outline=(0, 0, 0, 0)) for x in (c, mv, res)]
    cw = max(t.shape[1] for t in tiles) + 8
    sheet = Image.new('RGB', (cw * 3, H * len(names)), (0x2e, 0x2e, 0x32))
    for i, t in enumerate(tiles):
        im = Image.fromarray(t, 'RGBA')
        sheet.paste(im, ((i % 3) * cw + (cw - im.width) // 2, (i // 3) * H), im)
    return sheet


def main(a):
    only = set(a.only.split(',')) if a.only else None
    wanted = [n for n in CROPS if not only or n in only]
    cuts = {n: cutout(n, a.sheets, not a.no_cache) for n in wanted}
    for n in wanted:
        stem, box, by, note = CROPS[n]
        print(f'{n:15s} {stem:26s} {box} base_y {by:5d}  cutout '
              f'{cuts[n].shape[1]}x{cuts[n].shape[0]}  {note}')

    for aset, sides in ARMIES.items():
        out = os.path.join(ROOT, 'public/sprites', aset)
        os.makedirs(out, exist_ok=True)
        sprites, big = {}, 0
        for name in (PIECES + KING_VARIANTS):
            for side in 'wb':
                src = KING[side] if name == 'king' else name
                if src not in cuts:
                    continue
                px = scale_outline(tint(cuts[src], *sides[side]), a.height)
                sprites[(name, side)] = px
                p = os.path.join(out, f'{name}-{side}.png')
                Image.fromarray(px, 'RGBA').save(p, optimize=True)
                big += os.path.getsize(p) > 60_000
        if only:
            continue
        contact_sheet(sprites, a.height).save(
            os.path.join(ROOT, 'docs/research/sprites', aset + '.png'), optimize=True)
        print(f'{aset}: {len(sprites)} sprites -> {out}' + (f'  ({big} over 60 kB!)' if big else ''))

    if not only:
        debug_sheet(cuts, ['archer', 'beast', 'knight', 'paladin'], a.height).save(
            os.path.join(ROOT, 'docs/research/sprites/painted-accent-debug.png'), optimize=True)


def selftest():
    """Tint keeps warm accents painted and turns everything else army-coloured."""
    img = np.zeros((16, 16, 4), np.uint8)
    img[..., 3] = 255
    img[:] = (0x30, 0x70, 0xc0, 255)    # blue cloth -> army colour
    img[10:, 10:] = (0xe0, 0xa0, 0x50, 255)   # warm gold -> stays painted
    m = accent_mask(img)
    assert m[1, 1] < 0.2 and m[14, 14] > 0.8, m
    warm = img.copy()
    warm[:] = (0xe0, 0xa0, 0x50, 255)   # all warm: the budget must fade it back
    assert accent_mask(warm).mean() <= ACC_MAX_FRAC + 1e-3
    t = tint(img, '#000000', '#ffffff')
    assert abs(int(t[14, 14, 0]) - 0xe0) < 25, t[14, 14]        # gold survives
    assert max(t[1, 1, :3]) - min(t[1, 1, :3]) < 60, t[1, 1]    # cloth is greyed

    d = np.zeros((20, 20, 4), np.uint8)                          # disc under a figure
    d[..., 3] = 255
    d[:12] = (0x80, 0x80, 0x88, 255)
    d[12:] = (0xef, 0x33, 0x40, 255)
    sb = strip_base(d, 12)[..., 3]
    assert sb[15, 9] == 0 and sb[4, 9] == 255, sb[:, 9]
    d[:12] = (0xb0, 0x2a, 0x38, 255)         # a red robe above the disc must survive
    assert strip_base(d, 12)[..., 3][4, 9] == 255

    s = scale_outline(np.pad(np.full((40, 40, 4), 200, np.uint8), ((4, 4), (4, 4), (0, 0))), 20)
    assert s.shape[0] == 20 and tuple(s[0, 0]) != OUTLINE
    print('selftest ok')


if __name__ == '__main__':
    p = argparse.ArgumentParser()
    p.add_argument('--sheets', default=SHEETS)
    p.add_argument('--height', type=int, default=192)
    p.add_argument('--only', help='comma-separated piece names (skips the sheets)')
    p.add_argument('--no-cache', action='store_true', help='re-run rembg')
    p.add_argument('--selftest', action='store_true')
    args = p.parse_args()
    selftest() if args.selftest else main(args)
