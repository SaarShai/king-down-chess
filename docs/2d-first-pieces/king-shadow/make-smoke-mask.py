"""Smoke mask for the Shadow King's board effect: king-shadow/smoke-mask.webp, aligned to king.png.

Cut from the art, no new image. The painted smoke wisps beside him are see-through, so they start
from the sheet's half-transparent areas (thin anti-aliased edges, the gaps between fingers and other
small patches dropped); they grow a little into their denser cores, never into the thick parts of the
figure, and the cores they enclose are filled. Alpha 255 is smoke, 0 is the figure; RGB is white.
The board effect (board/king-effects.mjs) draws the figure without the smoke and the smoke itself
drifting and curling upward. Run from the repo root:
  python3 docs/2d-first-pieces/king-shadow/make-smoke-mask.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = Path(__file__).parent
MIN_PATCH = 300  # px of see-through smoke a group needs; smaller groups are edges, finger gaps or fur tips

src = Image.open(HERE / 'king.png').convert('RGBA')
a = np.asarray(src.split()[3]).astype(float) / 255
img = lambda m: Image.fromarray((m * 255).astype(np.uint8))
# Round dilation and erosion (a blurred mask, thresholded).
dil = lambda m, r: np.asarray(img(m).filter(ImageFilter.GaussianBlur(r / 2.2))).astype(float) / 255 > 0.04
ero = lambda m, r: ~dil(~m, r)

partial = (a > 0.03) & (a < 0.93)
seeds = dil(ero(partial, 3), 3)
# Group patches that lie within a few pixels of each other (one wisp), keep the large groups.
near = dil(seeds, 20)
kept, rest = np.zeros_like(seeds), near.copy()
while rest.any():
    y, x = np.argwhere(rest)[0]
    label = img(rest).convert('L')
    ImageDraw.floodfill(label, (int(x), int(y)), 100, thresh=0)
    group = np.asarray(label) == 100
    if (group & seeds).sum() >= MIN_PATCH:
        kept |= group & seeds
    rest &= ~group
thick = dil(ero(a > 0.9, 50), 50)
smoke = dil(kept, 24) & (a > 0.03) & ~dil(thick, 3)
# Fill the dense cores the smoke encloses: whatever the background cannot reach around it.
rest = img(~smoke).convert('L')
ImageDraw.floodfill(rest, (0, 0), 100, thresh=0)
smoke |= (np.asarray(rest) == 255) & (a > 0.03)
# Bits of smoke the cut left floating (not joined to either figure) are smoke too.
figure = img((a > 0.03) & ~smoke).convert('L')
for half in (slice(0, 768), slice(768, 1536)):
    ys, xs = np.nonzero(thick[:, half])
    y, x = int(np.median(ys)), int(np.median(xs)) + half.start
    assert thick[y, x], 'a seed inside the figure'
    ImageDraw.floodfill(figure, (x, y), 100, thresh=0)
smoke |= np.asarray(figure) == 255

alpha = img(smoke).filter(ImageFilter.GaussianBlur(1.2))
out = Image.new('RGBA', src.size, (255, 255, 255, 0))
out.putalpha(alpha)
out.save(HERE / 'smoke-mask.webp', lossless=True, quality=100, method=6)
print('smoke-mask.webp', out.size, 'smoke px', int(smoke.sum()))
