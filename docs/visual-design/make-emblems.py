"""Emblem buttons for the New game king picker: public/ui/emblems/<king>.webp, 256 px with alpha.

The four element emblems are King Down art from 2019 (art-src/emblems-logo/, not in Git):
water = Frost (ice crystal), fire = Flame, air = Stratus (wings), earth = Mud (ram horns).
Spirit (an ivory and gold shield, a star of light, small white wings) and Shadow (an obsidian shield,
a silver crescent moon, thorns, violet smoke) were made on 2026-10-03 in the same style with image
generation (spirit-a and shadow-a of that round). Their 1254 px masters belong in the same folder as
"spirit emblem.png" and "shadow emblem.png"; --spirit and --shadow name other files. The script stops if
a source is missing, so a rerun never replaces an emblem with a stand-in.

Each image is cut to its painted area, fitted in the square and centred, so all six read at one size.
Run from the repo root:
  python3 docs/visual-design/make-emblems.py [--src art-src/emblems-logo] [--spirit PNG] [--shadow PNG]
"""
import argparse
from pathlib import Path
from PIL import Image

SIZE, MARGIN = 256, 6
ELEMENTS = {'frost': 'water emblem.png', 'flame': 'fire emblem.png', 'stratus': 'air emblem.png', 'mud': 'earth emblem.png'}
OUT = Path('public/ui/emblems')

ap = argparse.ArgumentParser()
ap.add_argument('--src', default='art-src/emblems-logo')
ap.add_argument('--spirit', help='default: <src>/spirit emblem.png')
ap.add_argument('--shadow', help='default: <src>/shadow emblem.png')
args = ap.parse_args()
src = Path(args.src)
sources = {k: src / v for k, v in ELEMENTS.items()} | {
    'spirit': Path(args.spirit or src / 'spirit emblem.png'), 'shadow': Path(args.shadow or src / 'shadow emblem.png')}
missing = [str(p) for p in sources.values() if not p.is_file()]
if missing: raise SystemExit('missing emblem sources: ' + ', '.join(missing))

OUT.mkdir(parents=True, exist_ok=True)
for king, path in sources.items():
    im = Image.open(path).convert('RGBA')
    im = im.crop(im.getchannel('A').getbbox())
    k = (SIZE - 2 * MARGIN) / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    tile = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    tile.alpha_composite(im, ((SIZE - im.width) // 2, (SIZE - im.height) // 2))
    tile.save(OUT / f'{king}.webp', 'WEBP', quality=86, method=6)
    print(king, path, im.size, (OUT / f'{king}.webp').stat().st_size, 'bytes')
