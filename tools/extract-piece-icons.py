"""Piece icons from the 2017 rulebook, as SVG: the rulebook's own vector paths, not a trace.

Each piece paragraph in "King Down Classic (rules) .ai" (pages 2-5) has a round icon: a black ring,
a blue-grey disc and a black glyph. This script finds the eleven rings, takes the glyph paths inside
each one, scales the ring to a 48-unit viewBox and writes public/ui/icons/<piece>.svg.

Normalised: the same ring and disc in every file; each glyph centred on the disc halfway between its
box centre and its centre of mass (optical centring). The glyph fills by the even-odd rule, as MuPDF
draws the book: PyMuPDF reports nonzero, but under nonzero the rook's two white bands close.
Paint: ring and glyph are currentColor, the disc keeps the rulebook colour; --pi-ring, --pi-disc and
--pi-glyph override them (src/style.css).
The Ogre had no icon in the rulebook: public/ui/icons/ogre.svg is drawn by hand in this format.

Usage (main checkout; art-src/ is not in Git):
  python3 tools/extract-piece-icons.py ["art-src/rules/King Down Classic (rules) .ai"] [--crops DIR]
--crops also saves each rulebook icon as a 512 px PNG, for comparison. Each glyph is checked against
the book as MuPDF draws it (figure images removed); the script stops when 0.5% differs away from the edges.
"""
import math
import os
import sys

import fitz  # PyMuPDF
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'ui', 'icons')
VB = 48.0
RING_R, RING_W, DISC_R = 21.49, 5.02, 21.5  # the rulebook ring: outer radius 24, inner 18.98
DISC = '#bccac8'  # the rulebook disc as the book renders it
# piece: (page index, seqno of its ring path), found by a scan for black 8-arc rings 48.6 pt wide
ICONS = {
    'pawn': (1, 111), 'knight': (1, 118), 'bishop': (2, 3), 'rook': (2, 129), 'queen': (2, 257),
    'archer': (2, 536), 'paladin': (3, 339), 'guard': (3, 127), 'maester': (3, 3), 'beast': (3, 330),
    'king': (4, 2),
}


def num(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


def path_d(items, T):
    """PyMuPDF path items -> SVG path data. A subpath that ends on its start point is closed."""
    out, cur, start = [], None, None

    def close():
        if cur is not None and start is not None and math.dist(cur, start) < 1e-3:
            out.append('Z')
    for it in items:
        op = it[0]
        if op == 're':  # a rectangle (the rook's band)
            close()
            q = it[1].quad
            pts = [T((p.x, p.y)) for p in (q.ul, q.ur, q.lr, q.ll)]
            out.append(f'M{num(pts[0][0])} {num(pts[0][1])}' + ''.join(f'L{num(x)} {num(y)}' for x, y in pts[1:]) + 'Z')
            cur = start = None
            continue
        p0 = T((it[1].x, it[1].y))
        if cur is None or math.dist(cur, p0) > 1e-3:
            close()
            out.append(f'M{num(p0[0])} {num(p0[1])}')
            start = p0
        if op == 'l':
            cur = T((it[2].x, it[2].y))
            out.append(f'L{num(cur[0])} {num(cur[1])}')
        elif op == 'c':
            a, b, cur = (T((q.x, q.y)) for q in it[2:5])
            out.append(f'C{num(a[0])} {num(a[1])} {num(b[0])} {num(b[1])} {num(cur[0])} {num(cur[1])}')
        else:
            raise ValueError(f'path item {op}')
    close()
    return ''.join(out)


def glyph_markup(paths):
    """paths: [{'d', 'stroke'?, 'join'?}] -> <path> elements painted by --pi-glyph."""
    out = []
    for p in paths:
        a = ''
        if p.get('stroke'):
            a += f' stroke-width="{num(p["stroke"])}"' + (' stroke-linejoin="round"' if p.get('join') else '')
            a += ' style="stroke:var(--pi-glyph,currentColor)"'
        out.append(f'<path{a} d="{p["d"]}"/>')
    return ''.join(out)


N = 480  # raster size for measuring and checking, 10 px a unit


def ink(pix):
    """A pixmap as ink cover, 0 (white) to 1 (black)."""
    return 1 - np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:N, :N, :3].mean(axis=2) / 255.0


def glyph_ink(paths):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{N}" height="{N}" viewBox="0 0 48 48"><g fill="#000" fill-rule="evenodd">{glyph_markup(paths).replace("var(--pi-glyph,currentColor)", "#000")}</g></svg>'
    return ink(fitz.open(stream=svg.encode(), filetype='svg')[0].get_pixmap(alpha=False))


def book_ink(doc, pi, R):
    """The icon as MuPDF draws the book, without the figure image that overlaps it."""
    one = fitz.open()
    one.insert_pdf(doc, from_page=pi, to_page=pi)
    page = one[0]
    page.add_redact_annot(R + (-2, -2, 2, 2))
    page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_REMOVE, graphics=fitz.PDF_REDACT_LINE_ART_NONE, text=fitz.PDF_REDACT_TEXT_NONE)
    return ink(page.get_pixmap(matrix=fitz.Matrix(N / R.width, N / R.width), clip=R, alpha=False))


def mismatch(book, new):
    """Share of the book's glyph pixels (inside the disc) that the new glyph gets wrong, leaving out
    the 2 px along the book's edges: the two rasters do not share a pixel grid."""
    Y, X = np.mgrid[0:N, 0:N]
    disc = np.hypot(X - N / 2 + 0.5, Y - N / 2 + 0.5) < 18.4 * N / VB
    a, b = (book > 0.5) & disc, (new > 0.5) & disc
    near = [(dy, dx) for dy in range(-2, 3) for dx in range(-2, 3)]
    grown = np.logical_or.reduce([np.roll(a, s, (0, 1)) for s in near])
    shrunk = np.logical_and.reduce([np.roll(a, s, (0, 1)) for s in near])
    return ((a ^ b) & ~(grown & ~shrunk)).sum() / a.sum()


def optical_offset(paths):
    """Shift that puts the midpoint of the glyph's box centre and mass centre on the disc centre."""
    a = glyph_ink(paths)
    ys, xs = np.nonzero(a > 0.5)
    s = N / VB
    box = ((xs.min() + xs.max()) / 2 / s, (ys.min() + ys.max()) / 2 / s)
    Y, X = np.mgrid[0:N, 0:N]
    mass = ((a * X).sum() / a.sum() / s, (a * Y).sum() / a.sum() / s)
    return VB / 2 - (box[0] + mass[0]) / 2, VB / 2 - (box[1] + mass[1]) / 2


def icon_svg(name, source, paths):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" id="icon" viewBox="0 0 48 48">\n'
            f'<!-- King Down piece icon: {name}. {source} -->\n'
            f'<circle cx="24" cy="24" r="{num(DISC_R)}" style="fill:var(--pi-disc,{DISC})"/>\n'
            f'<circle cx="24" cy="24" r="{num(RING_R)}" fill="none" stroke-width="{num(RING_W)}" style="stroke:var(--pi-ring,currentColor)"/>\n'
            f'<g fill-rule="evenodd" style="fill:var(--pi-glyph,currentColor)">{glyph_markup(paths)}</g>\n'
            f'</svg>\n')


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    crops = sys.argv[sys.argv.index('--crops') + 1] if '--crops' in sys.argv else None
    if crops in args:
        args.remove(crops)
    src = args[0] if args else os.path.join(ROOT, 'art-src', 'rules', 'King Down Classic (rules) .ai')
    doc = fitz.open(src)
    os.makedirs(OUT, exist_ok=True)
    for name, (pi, seq) in ICONS.items():
        page = doc[pi]
        drawings = page.get_drawings()
        ring = next(x for x in drawings if x['seqno'] == seq)
        R = ring['rect']
        cx, cy, k = (R.x0 + R.x1) / 2, (R.y0 + R.y1) / 2, VB / R.width
        box = R + (-1, -1, 1, 1)
        # The glyph: the black paths inside the ring's box (the knight's is drawn before its ring).
        glyph = [x for x in drawings if x is not ring and x['rect'] in box
                 and x.get('fill') is not None and max(x['fill']) < 0.1]

        def paths(dx=0.0, dy=0.0):
            T = lambda p: ((p[0] - cx) * k + VB / 2 + dx, (p[1] - cy) * k + VB / 2 + dy)
            return [{'d': path_d(g['items'], T),
                     'stroke': g['width'] * k if g['type'] == 'fs' else None, 'join': g.get('lineJoin') == 1}
                    for g in glyph]
        # Check: before it moves, the glyph covers the book's own pixels.
        off = mismatch(book_ink(doc, pi, R), glyph_ink(paths()))
        assert off < 0.005, f'{name}: {off:.1%} of the glyph differs from the book'
        dx, dy = optical_offset(paths())
        source = (f'From the 2017 rulebook "King Down Classic (rules)", page {pi + 1}: its vector paths, '
                  f'scaled to the ring, glyph moved ({dx:+.2f}, {dy:+.2f}) to centre it (tools/extract-piece-icons.py).')
        with open(os.path.join(OUT, f'{name}.svg'), 'w') as f:
            f.write(icon_svg(name, source, paths(dx, dy)))
        print(f'{name:8s} page {pi + 1}, {len(glyph)} paths, {off:.1%} off the book, glyph moved ({dx:+.2f}, {dy:+.2f})')
        if crops:
            os.makedirs(crops, exist_ok=True)
            z = 512 / R.width
            page.get_pixmap(matrix=fitz.Matrix(z, z), clip=R).save(os.path.join(crops, f'{name}.png'))


if __name__ == '__main__':
    main()
