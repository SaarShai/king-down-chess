"""Web copies of the painted art: lossy WebP at full resolution (lossless alpha), so every
animation coordinate still matches. PNG masters stay the source of truth.
Run after changing any sheet:  python3 docs/2d-first-pieces/web-art.py"""
from pathlib import Path
from PIL import Image
here = Path(__file__).parent
SHEETS = ['king/king', 'beast/beast', 'queen/queen', 'paladin/paladin', 'maester/maester', 'lance/pawn',
          'wrist-bow/archer', 'ogre/ogre', 'knight/knight', 'bishop/bishop', 'rook/rook', 'guard/guard']
for name in SHEETS:
    Image.open(here / f'{name}.png').save(here / f'{name}.webp', 'WEBP', quality=82, method=6)
# The painted stone board (board-art/compose-board.py), inspired by the original board's capital.
Image.open(here / 'board-art/stone-board.png').save(here / 'board-art/stone-board.webp', 'WEBP', quality=86, method=6)
