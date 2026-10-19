"""Export the eight stone crops from the full source. Run from the repo root.

    python3 tools/export-stone-control.py [output.webp]

The crop order and 8 px joins come from stone-controls ticket 03.
The tile positions, turns and tones come from board-art/compose-board.py.
"""
from pathlib import Path
import random
import sys
import numpy as np
from PIL import Image

source = Image.open('docs/2d-first-pieces/board-art/source/light-stone.png').convert('RGB')
picked = [(0, 0), (0, 2), (0, 6), (1, 1), (1, 5), (1, 7), (2, 0), (2, 2)]
rng = random.Random(1)
tiles = {}
for row in range(8):
    for col in range(8):
        ox = rng.randrange(source.width - 330)
        oy = rng.randrange(source.height - 330)
        turn = rng.randrange(4)
        flip = rng.random() < 0.5
        tone = 1 + rng.uniform(-0.035, 0.035)
        if (row, col) not in picked:
            continue
        tile = source.crop((ox, oy, ox + 330, oy + 330)).rotate(90 * turn)
        if flip:
            tile = tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        tiles[row, col] = Image.fromarray(np.clip(np.asarray(tile, np.float32) * tone, 0, 255).astype(np.uint8))

width, height = 1056, round(120 * 1056 / 232)
scale = width / 232
sums = np.zeros((height, width, 3), np.float64)
weights = np.zeros((height, width), np.float64)
# An 80 px board tile has a 1.25 px gap on each side and a 77.5 px face.
lo, hi = (8 - 1.25) * 330 / 77.5, (72 - 1.25) * 330 / 77.5
for n, key in enumerate(picked):
    left, top = round(n % 4 * 56 * scale), round(n // 4 * 56 * scale)
    right, bottom = round((n % 4 * 56 + 64) * scale), round((n // 4 * 56 + 64) * scale)
    w, h = right - left, bottom - top
    tile = tiles[key].resize((w, h), Image.Resampling.LANCZOS, box=(lo, lo, hi, hi))
    x, y = (np.arange(w) + 0.5) / scale, (np.arange(h) + 0.5) / scale
    wx = np.minimum(1, np.minimum((x + 0.5) / 9, (64.5 - x) / 9))
    wy = np.minimum(1, np.minimum((y + 0.5) / 9, (64.5 - y) / 9))
    weight = wy[:, None] * wx[None, :]
    weights[top:bottom, left:right] += weight
    sums[top:bottom, left:right] += np.asarray(tile) * weight[..., None]
image = Image.fromarray(np.rint(sums / weights[..., None]).astype(np.uint8))
output = Path(sys.argv[1] if len(sys.argv) > 1 else 'src/plugin/assets/stone-control.webp')
image.save(output, 'WEBP', lossless=True, method=6)
print(f'{output}: {width} × {height}, {output.stat().st_size} bytes')
