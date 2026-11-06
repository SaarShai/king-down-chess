"""Burn. R: the flame trail's paint, away from the rook. G: the ember glow on and around the black knight (light only, so no piece or stone moves). B: left of x .45 and right of x .88 the three banners, weak at the pole and free at the hem; between them the air where sparks rise."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('burn'); h, s, v = hsv(rgb)
H, W = v.shape
ys = (np.arange(H)[:, None] + .5) / H

rook = polygon(rgb, [(.43,.10),(.57,.10),(.57,.25),(.53,.30),(.51,.40),(.505,.515),(.525,.645),(.505,.705),(.40,.665),(.308,.605),(.312,.58),(.343,.525),(.365,.48),(.40,.44),(.415,.35),(.42,.25)])
fire = (h < .14) & (s > .55) & (v > .45)

# The flame trail: its fire and the char strokes between its tongues, bounded so that the floor's reflections stay still.
trail = polygon(rgb, [(0,.465),(.09,.475),(.17,.465),(.25,.47),(.33,.47),(.385,.43),(.41,.44),(.34,.53),(.30,.60),(.40,.675),(.50,.72),(.515,.75),(.42,.735),(.33,.71),(.25,.665),(.17,.615),(.09,.57),(0,.545)])
r = soften(soften(trail * fire, 2, 1) > .35, 1, 2) * soften(trail, 0, 3) * (1 - soften(rook, 4, 1.5))

# The embers: bright fire paint on the knight and in the burst at its chest. No displacement uses this mask.
ember_zone = polygon(rgb, [(.535,.56),(.60,.40),(.66,.38),(.70,.26),(.80,.30),(.83,.45),(.80,.60),(.79,.76),(.56,.77),(.535,.72)])
g = soften(ember_zone * fire * (1 - soften(rook, 4, 1)), 1, 1.2) * soften(ember_zone, 0, 3)

# The banners: traced close, with the braziers and their flames kept out, strength rising from the pole to the hem.
banners = [
    ([(.038,0),(.125,0),(.125,.29),(.088,.372),(.07,.33),(.04,.27)], 0., .372),
    ([(.289,.208),(.326,.222),(.325,.385),(.31,.43),(.30,.41),(.289,.355)], .208, .43),
    ([(.919,.073),(.966,.045),(.972,.24),(.962,.30),(.95,.365),(.926,.31)], .05, .365),
]
keep = np.maximum.reduce([
    polygon(rgb, [(.0,.20),(.085,.20),(.09,.35),(.0,.35)]),        # left brazier, its flame and its pier
    polygon(rgb, [(.0,.345),(.095,.345),(.095,.46),(.0,.46)]),
    polygon(rgb, [(.255,.33),(.303,.33),(.303,.43),(.255,.43)]),   # middle brazier
    polygon(rgb, [(.942,.21),(1,.21),(1,.46),(.942,.46)]),         # right brazier
])
cloth = np.zeros_like(v)
for points, top, hem in banners:
    ramp = np.clip((ys - top) / (hem - top), 0, 1) ** .8
    cloth = np.maximum(cloth, soften(polygon(rgb, points), 2, 1.5) * ramp)
cloth = cloth * (1 - soften(keep, 2, 1.5))

# The air for the sparks, between the banners in x (the recipe splits B at x .45 and .88).
air = soften(polygon(rgb, [(.56,.36),(.66,.30),(.80,.28),(.84,.40),(.82,.66),(.70,.72),(.58,.70)]), 0, 7)
b = cloth + air
save('burn', r, g, b)
