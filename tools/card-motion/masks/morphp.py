"""Morph. R: the violet wisps round the knight (at 1, they stir and glow) and the light in the knight's cracks (at .5, it only glows). G: left of x = .645, the air round the knight, for lilac light and sparks; right of it, the sky, for clouds and sun glow. B: the hanging flowers, strongest at their tips."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('morphp'); h, s, v = hsv(rgb)
H, W = v.shape
R_, G_, B_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
X, Y = np.meshgrid((np.arange(W) + .5) / W, (np.arange(H) + .5) / H)

def grow(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)), dtype=np.float32) / 255
def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255

# The knight with its shell and its base: nothing here may move.
knight = polygon(rgb, [(.363,.227),(.365,.175),(.381,.111),(.410,.079),(.449,.069),(.479,.085),(.469,.111),(.501,.128),(.522,.094),(.524,.117),(.531,.134),(.550,.102),
                       (.549,.154),(.566,.192),(.566,.218),(.575,.261),(.592,.342),(.594,.377),(.583,.406),(.563,.421),(.549,.40),(.545,.435),(.550,.493),(.573,.516),(.578,.539),
                       (.566,.565),(.568,.603),(.56,.661),(.568,.667),(.60,.72),(.60,.9),(.38,.9),(.40,.72),(.402,.678),(.41,.60),(.405,.52),(.385,.44),(.372,.39),(.378,.37),
                       (.413,.36),(.42,.337),(.391,.302),(.373,.279),(.374,.25),(.391,.204)])
# The ivory chips in the air, and the gold specks with them.
ivory = (h > .05) & (h < .17) & (v > .62) & (s > .18)
chips = grow(ivory * (knight < .5), 1)

# The violet light is pale and blue: blue well over green.
violet = (B_ > .6) & (B_ - G_ > .07) & (B_ > R_ - .12)
# Left of the shell, above the swirl, the lilac is the sky between the columns: not light.
near = polygon(rgb, [(.358,.17),(.645,.17),(.645,.68),(.33,.68),(.33,.262),(.358,.262)])
wisp = violet * near * (knight < .5) * (chips < .5)
petal = polygon(rgb, [(.297,.425),(.325,.425),(.325,.465),(.297,.465)]) * (B_ - G_ > .06)
free = np.maximum(wisp, petal)
# Light in the cracks: violet paint inside the knight's outline.
crack = violet * (knight > .5) * polygon(rgb, [(.37,.18),(.60,.18),(.60,.66),(.37,.66)])

r = np.maximum(soften(free, 2, 1.5) * (1 - soften(np.maximum(knight, chips), 1, 1)), soften(crack, 1, 1.2) * .5)

# The air round the knight: an oval, with nothing on the knight or the chips.
oval = np.clip((1.12 - np.hypot((X - .485) / .165, (Y - .39) / .30)) / .3, 0, 1)
air = oval * np.clip((.64 - X) / .04, 0, 1) * (1 - soften(np.maximum(knight, chips), 1, 1))

# The sky: bright paint above the skyline, clear of the trees and the castle.
above = polygon(rgb, [(.645,0),(1,0),(1,.20),(.975,.20),(.94,.215),(.935,.17),(.905,.15),(.89,.20),(.875,.25),(.86,.30),(.80,.30),(.76,.27),(.70,.235),(.645,.22)])
bright = (v > .5) & (B_ > .3) & (G_ > .25) & (R_ > G_)
trees = soften((v < .5).astype(np.float32), 2, 0) > .5
sky = soften(above * bright * (~trees), 0, 2.5) * soften(above, 0, 2)
sky = sky * np.clip((X - .65) / .02, 0, 1)

g = np.maximum(air, sky)

# The flowers. Each cluster: its box, top to tip. The violet paint counts, and the hold grows from its top to its tip.
b = np.zeros_like(v)
for x0, y0, x1, y1 in [(.0,.0,.036,.058),(.018,.05,.07,.225),(.083,.0,.118,.155),(.114,.0,.143,.105),(.128,.145,.152,.20),(.088,.195,.128,.315),(.05,.265,.098,.465),
                       (.256,.0,.292,.135),(.348,.0,.368,.06),(.37,.0,.392,.05),(.288,.0,.302,.04)]:
    box = polygon(rgb, [(x0,y0),(x1,y0),(x1,y1),(x0,y1)])
    hold = np.clip((Y - y0) / max(y1 - y0, 1e-3), 0, 1)
    cluster = box * (B_ > R_ - .06) * (B_ - G_ > .05) * (v > .32)
    cluster = soften(shrink(grow(cluster, 2), 2), 2, 2) * (.45 + .55 * hold)
    b = np.maximum(b, cluster)
# The column's lit face at the right of the left clusters stays still.
b = b * (1 - soften(polygon(rgb, [(.152,0),(.195,0),(.195,.5),(.152,.5)]), 0, 1))

save('morphp', r, g, b)
