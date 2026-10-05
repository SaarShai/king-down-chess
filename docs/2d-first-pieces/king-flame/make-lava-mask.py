"""Lava mask for the Flame King's board effect: king-flame/lava-mask.webp, aligned to king.png.

Derived from the art, no new image: alpha 255 on the painted orange-gold chest cracks, the visor
ember and the crown gem (saturated orange pixels); a lower alpha on the dark seams between the
armour plates (pixels much darker than their neighbourhood, inside the figure). The board effect
(board/king-effects.mjs) lights the mask with slowly flowing lava, so the cracks glow brightest and
the seams glow a little. RGB is white; only alpha carries the mask. Run from the repo root:
  python3 docs/2d-first-pieces/king-flame/make-lava-mask.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
SEAM = 0.4  # seam brightness against the cracks

src = Image.open(HERE / 'king.png').convert('RGBA')
im = np.asarray(src).astype(float) / 255
rgb, a = im[..., :3], im[..., 3]
v, lo = rgb.max(axis=2), rgb.min(axis=2)
d = np.maximum(v - lo, 1e-6)
s = np.where(v > 0, (v - lo) / np.maximum(v, 1e-6), 0)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.where(v == r, ((g - b) / d) % 6, np.where(v == g, (b - r) / d + 2, (r - g) / d + 4)) * 60

# Cracks: saturated orange to gold, bright. Ivory trim reaches about 0.55 saturation, so 0.62 keeps it out.
core = (a > 0.5) & (s > 0.62) & (h > 8) & (h < 50) & (v > 0.5)
core = np.asarray(Image.fromarray((core * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))).astype(float) / 255

# Seams: thin dark gaps (a grey closing minus the image), away from the silhouette's own edge.
grey = Image.fromarray((v * 255).astype(np.uint8))
closed = np.asarray(grey.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.MinFilter(21))).astype(float) / 255
inside = np.asarray(src.split()[3].filter(ImageFilter.MinFilter(13))).astype(float) / 255 > 0.5
seam = np.clip(((closed - v) - 0.22) / 0.12, 0, 1) * inside

mask = np.maximum(core, seam * SEAM)
alpha = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
out = Image.new('RGBA', src.size, (255, 255, 255, 0))
out.putalpha(alpha)
out.save(HERE / 'lava-mask.webp', lossless=True, quality=100, method=6)
print('lava-mask.webp', out.size, 'crack px', int(core.sum()), 'seam px', int((seam > 0.5).sum()))
