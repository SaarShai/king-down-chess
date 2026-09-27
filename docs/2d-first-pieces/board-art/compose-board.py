"""Compose the painted stone board from the two generated stone textures.

Inspired by the centre 2x2 (capital) of the original King Down board, without its gold: cream
limestone and charcoal slate squares with chamfered corners, a thin red-brown outline, a soft
painted bevel and dark grout. The grid is exact because each square is cut from the textures
here, not drawn by the image model. Deterministic (fixed seed).

    python3 docs/2d-first-pieces/board-art/compose-board.py
"""
from pathlib import Path
import random
import numpy as np
from PIL import Image, ImageDraw

here = Path(__file__).parent
BOARD, N = 1024, 8
T = BOARD // N            # 128 px per square
GAP = 4                   # grout between squares
INNER = T - GAP
CHAMFER = 9               # corner cut, as on the reference tiles
CROP = 330                # texture pixels per square: keeps the veins at the reference's scale
GROUT = (35, 28, 24)
OUTLINE = (74, 42, 32, 170)

rng = random.Random(1)
stones = {kind: Image.open(here / f'source/{kind}-stone.png').convert('RGB') for kind in ('light', 'dark')}

def chamfer_polygon(size, cut):
    return [(cut, 0), (size - 1 - cut, 0), (size - 1, cut), (size - 1, size - 1 - cut),
            (size - 1 - cut, size - 1), (cut, size - 1), (0, size - 1 - cut), (0, cut)]

mask = Image.new('L', (INNER, INNER), 0)
ImageDraw.Draw(mask).polygon(chamfer_polygon(INNER, CHAMFER), fill=255)
# Painted bevel: light along the top and left edges, shade along the bottom and right.
y, x = np.mgrid[0:INNER, 0:INNER].astype(np.float32)
edge = 7.0
light = np.clip(1 - np.minimum(x, y) / edge, 0, 1)
shade = np.clip(1 - np.minimum(INNER - 1 - x, INNER - 1 - y) / edge, 0, 1)
bevel = (1 + 0.16 * light - 0.22 * shade)[..., None]

board = Image.new('RGB', (BOARD, BOARD), GROUT)
for row in range(N):
    for col in range(N):
        kind = 'light' if (row + col) % 2 == 0 else 'dark'   # row 0 is rank 8: a8 is light, a1 dark
        src = stones[kind]
        ox, oy = rng.randrange(0, src.width - CROP), rng.randrange(0, src.height - CROP)
        tile = src.crop((ox, oy, ox + CROP, oy + CROP)).resize((INNER, INNER), Image.LANCZOS)
        tile = tile.rotate(90 * rng.randrange(4))
        if rng.random() < 0.5:
            tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
        tone = 1 + rng.uniform(-0.035, 0.035)                  # hand-laid stones differ slightly
        arr = np.asarray(tile, np.float32) * bevel * tone
        tile = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        overlay = Image.new('RGBA', (INNER, INNER))
        ImageDraw.Draw(overlay).polygon(chamfer_polygon(INNER, CHAMFER), outline=OUTLINE, width=2)
        tile = Image.alpha_composite(tile.convert('RGBA'), overlay).convert('RGB')
        board.paste(tile, (col * T + GAP // 2, row * T + GAP // 2), mask)
board.save(here / 'stone-board.png')
print('wrote', here / 'stone-board.png')
