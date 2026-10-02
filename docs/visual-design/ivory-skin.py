"""Recolour the white (ivory) Ogre's and Rook's skin to the ivory base of the other white pieces.

The owner (2026-10-02): "ogre and rook/rock, for the white side - they have skin color, but it
needs to be the same base color as the other pieces." Only the left (white army) half of each
sheet changes; the black half is copied through untouched.

How:
1. Palette: every opaque, warm, light, low-saturation pixel of the other white figures (Guard,
   Beast, Knight, Bishop, Paladin, Queen) gives the ivory: its brightness distribution, and its
   hue and saturation per brightness band (shadows in the ivory pieces are a little warmer).
2. Mask: skin is the warm hue band (orange to tan) with some saturation and enough brightness.
   Soft edges on every bound, so outlines, the dark loincloth, the red wristbands, the stone and
   the glowing eyes stay as painted. The mask is limited to each figure's own pixels.
3. Remap: inside the mask the brightness is quantile-matched to the ivory's (so shading order and
   detail are kept), then hue and saturation come from the palette band of the new brightness,
   scaled by the pixel's own saturation relative to the skin's median (spots stay darker and
   browner). The result is blended back by the mask weight.

The originals stay in git history (ORIGINAL below). The script reads the PNG master from git
(`git show ORIGINAL:path`), so running it twice gives the same output, and writes the PNG and its
WebP web copy (web-art.py's settings).

Run from the repo root: python3 docs/visual-design/ivory-skin.py [--preview DIR]
Then: python3 docs/visual-design/make-ui-art.py (title and Guide figures are cut from the sheets),
and restore public/ui/pieces/ogre-b.webp and rook-b.webp with git: the re-encoded WebP moves the
black half by under 1/255 on average, and those cuts should not change.
"""
import io
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ORIGINAL = '84fb194'  # last commit with the painted skin tones
SRC = Path('docs/2d-first-pieces')
TARGETS = {'ogre': 'ogre/ogre', 'rook': 'rook/rook'}  # PNG master; the WebP is encoded from it as web-art.py does
IVORY = ['guard/guard.webp', 'beast/beast.webp', 'knight/knight.webp', 'bishop/bishop.webp',
         'paladin/paladin.webp', 'queen/queen.webp']
# Skin band per figure: hue in degrees, saturation and brightness bounds (soft ramps).
SKIN = {
    # Ogre: the wristbands are a strong red (hue 14-16, saturation 0.7) and keep their colour.
    'ogre': dict(hue=(10, 17, 40, 47), sat=(.13, .2), val=(.25, .36), red=(.54, .6, 18, 23)),
    # Rook: the stone (column, tower, wrist cuffs) is hue 32-34; the skin is hue 20-23.
    'rook': dict(hue=(8, 13, 27, 30.5), sat=(.14, .21), val=(.3, .4), red=(.62, .7, 14, 18)),
}
BANDS = np.linspace(0, 1, 21)


def original(rel):
    data = subprocess.run(['git', 'show', f'{ORIGINAL}:{SRC / rel}'], check=True, capture_output=True).stdout
    return Image.open(io.BytesIO(data)).convert('RGBA')


def split(im):
    """x of the empty alpha column nearest the middle: white figure left, black right."""
    a = np.asarray(im)[..., 3]
    w = a.shape[1]
    empty = [x for x in range(w // 3, 2 * w // 3) if not a[:, x].any()]
    return min(empty, key=lambda x: abs(x - w // 2)) if empty else w // 2


def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    rm = nz & (mx == r)
    gm = nz & (mx == g) & ~rm
    bm = nz & ~rm & ~gm
    h[rm] = ((g - b)[rm] / d[rm]) % 6
    h[gm] = (b - r)[gm] / d[gm] + 2
    h[bm] = (r - g)[bm] / d[bm] + 4
    s = np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0)
    return h * 60, s, mx


def hsv_to_rgb(h, s, v):
    h = (h % 360) / 60
    i = np.floor(h).astype(int) % 6
    f = h - np.floor(h)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    out = np.stack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]),
                    np.choose(i, [p, p, t, v, v, q])], -1)
    return np.clip(out, 0, 1)


def ramp(x, a, b):
    return np.clip((x - a) / (b - a), 0, 1)


def palette():
    hs, ss, vs = [], [], []
    for rel in IVORY:
        im = Image.open(SRC / rel).convert('RGBA')
        px = np.asarray(im).astype(float)[:, :split(im)] / 255
        h, s, v = rgb_to_hsv(px[..., :3])
        m = (px[..., 3] > .98) & (h > 15) & (h < 50) & (s < .35) & (v > .35)
        hs.append(h[m]); ss.append(s[m]); vs.append(v[m])
    h, s, v = map(np.concatenate, (hs, ss, vs))
    band = np.clip(np.digitize(v, BANDS) - 1, 0, len(BANDS) - 2)
    hue = np.array([np.median(h[band == i]) if (band == i).sum() > 50 else np.nan for i in range(len(BANDS) - 1)])
    sat = np.array([np.median(s[band == i]) if (band == i).sum() > 50 else np.nan for i in range(len(BANDS) - 1)])
    centres = (BANDS[:-1] + BANDS[1:]) / 2
    ok = ~np.isnan(hue)
    return dict(v=np.sort(v), centres=centres[ok], hue=hue[ok], sat=sat[ok])


def recolour(im, name, pal, preview=None):
    px = np.asarray(im).astype(float) / 255
    cut = split(im)
    half = px[:, :cut]
    h, s, v = rgb_to_hsv(half[..., :3])
    k = SKIN[name]
    h0, h1, h2, h3 = k['hue']
    w = np.minimum(ramp(h, h0, h1), 1 - ramp(h, h2, h3)) * ramp(s, *k['sat']) * ramp(v, *k['val'])
    # Strong reds (the Ogre's wristbands) keep their colour.
    s0, s1, r0, r1 = k['red']
    w *= 1 - ramp(s, s0, s1) * (1 - ramp(h, r0, r1))
    w *= half[..., 3] > 0
    core = w > .5
    # Brightness: quantile-match the skin to the ivory.
    sv = np.sort(v[core])
    q = np.searchsorted(sv, v) / max(1, len(sv))
    nv = np.interp(np.clip(q, 0, 1), np.linspace(0, 1, len(pal['v'])), pal['v'])
    # Keep a little of the original contrast in the deep shading (outline side of the masses).
    nv = np.where(v < np.percentile(sv, 5), v + (nv - v) * ramp(v, k['val'][0], np.percentile(sv, 5)), nv)
    nh = np.interp(nv, pal['centres'], pal['hue'])
    rel = np.clip(s / np.median(s[core]), .5, 2) ** .5
    ns = np.clip(np.interp(nv, pal['centres'], pal['sat']) * rel, 0, .6)
    new = hsv_to_rgb(nh, ns, nv)
    half_rgb = half[..., :3] * (1 - w[..., None]) + new * w[..., None]
    out = px.copy()
    out[:, :cut, :3] = half_rgb
    if preview:
        Image.fromarray((w * 255).astype('uint8')).save(Path(preview) / f'{name}-mask.png')
    return Image.fromarray((out * 255 + .5).astype('uint8'), 'RGBA'), cut


def main():
    preview = sys.argv[sys.argv.index('--preview') + 1] if '--preview' in sys.argv else None
    pal = palette()
    print('ivory palette: median brightness %.2f, hue %.0f, saturation %.2f' %
          (np.median(pal['v']), np.median(pal['hue']), np.median(pal['sat'])))
    for name, stem in TARGETS.items():
        src = original(f'{stem}.png')
        out, cut = recolour(src, name, pal, preview)
        # The black half of the master is pixel-for-pixel the original.
        assert np.array_equal(np.asarray(out)[:, cut:], np.asarray(src)[:, cut:])
        out.save(SRC / f'{stem}.png', optimize=True)
        out.save(SRC / f'{stem}.webp', 'WEBP', quality=82, method=6)
        print(stem, 'split at x =', cut)

if __name__ == '__main__':
    main()
