"""Cut the title-screen and Guide-card figures from the painted sheets (no new art).

Each sheet in docs/2d-first-pieces/ holds the white army's figure on the left and the black
army's on the right. The split is the empty alpha column nearest the middle, since a figure
can cross x = 768 (LESSONS.md, Rook gutter at x = 780). Output: public/ui/pieces/<name>-<w|b>.webp.

Run from the repo root: python3 docs/visual-design/make-ui-art.py
"""
from pathlib import Path
from PIL import Image

SRC = Path('docs/2d-first-pieces')
OUT = Path('public/ui/pieces')
SHEETS = {
    'king': 'king/king.webp', 'queen': 'queen/queen.webp', 'rook': 'rook/rook.webp',
    'bishop': 'bishop/bishop.webp', 'knight': 'knight/knight.webp', 'pawn': 'lance/pawn.webp',
    'archer': 'wrist-bow/archer.webp', 'paladin': 'paladin/paladin.webp', 'guard': 'guard/guard.webp',
    'maester': 'maester/maester.webp', 'beast': 'beast/beast.webp', 'ogre': 'ogre/ogre.webp',
}
HEIGHT = 320  # 2x a 160 px card figure


def halves(im):
    a = im.getchannel('A')
    w, h = im.size
    empty = [x for x in range(w // 3, 2 * w // 3) if a.crop((x, 0, x + 1, h)).getbbox() is None]
    mid = min(empty, key=lambda x: abs(x - w // 2)) if empty else w // 2
    return (0, 0, mid, h), (mid, 0, w, h)


for name, rel in SHEETS.items():
    im = Image.open(SRC / rel).convert('RGBA')
    for side, box in zip('wb', halves(im)):
        fig = im.crop(box)
        fig = fig.crop(fig.getchannel('A').getbbox())
        k = HEIGHT / fig.height
        fig = fig.resize((max(1, round(fig.width * k)), HEIGHT), Image.LANCZOS)
        fig.save(OUT / f'{name}-{side}.webp', quality=82, method=6)
        print(name, side, fig.size)

# Title backdrop: the stone board, darkened at the edges by CSS; a small copy is enough.
board = Image.open(SRC / 'board-art/stone-board.webp').convert('RGB').resize((640, 640), Image.LANCZOS)
board.save('public/ui/stone-board.webp', quality=78, method=6)
