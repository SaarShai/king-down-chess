"""Earth Quake. R: the dust plumes (colour key inside hand-traced zones, clear of knight, pawn, slab and floor). G: the chips that hang in the air, each a tight blob for a rigid bob. B: the far banners."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('earthquake'); h, s, v = hsv(rgb)
H, W = v.shape

def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255

def ellipse(cx, cy, rx, ry):
    yy, xx = np.mgrid[0:H, 0:W]
    return (((xx + .5) / W - cx) / rx) ** 2 + (((yy + .5) / H - cy) / ry) ** 2 <= 1

# Hard things the dust must not drag.
knight = polygon(rgb, [(.09,.13),(.20,.13),(.26,.24),(.26,.33),(.31,.47),(.31,.52),(.24,.57),(.17,.56),(.16,.45),(.15,.37),(.15,.30),(.10,.34),(.09,.22)])
pawn = polygon(rgb, [(.85,.30),(.90,.30),(.925,.36),(.895,.42),(.895,.57),(.87,.60),(.82,.60),(.75,.53),(.76,.49),(.83,.40),(.855,.385)])
slab = polygon(rgb, [(.382,.56),(.50,.515),(.625,.565),(.625,.625),(.51,.71),(.385,.63)])
hard = np.maximum.reduce([knight, pawn, slab])

# Where the plumes are. The floor outside these zones never moves.
west = polygon(rgb, [(.0,.27),(.05,.27),(.15,.33),(.17,.56),(.13,.565),(.07,.50),(.015,.42)])                     # Left of the knight.
mid = polygon(rgb, [(.285,.33),(.34,.40),(.46,.37),(.51,.32),(.56,.33),(.60,.42),(.69,.45),(.80,.47),(.75,.60),(.70,.625),(.62,.60),(.40,.58),(.30,.575),(.20,.575),(.17,.56),(.30,.50),(.27,.42)])  # The central plume and both arms.
east = polygon(rgb, [(.89,.47),(.945,.49),(.93,.59),(.885,.60),(.885,.55)])                   # Right of the pawn.
low = polygon(rgb, [(.26,.655),(.36,.635),(.385,.635),(.51,.715),(.585,.70),(.60,.74),(.50,.75),(.40,.72),(.31,.70)])  # The low spray before the slab.

def ramp(x, a, b):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)

# Dust is warm and more saturated than the floor (floor .29 to .44, dust .47 to .62), so tile seams stay out of the key.
warm = (h > .055) * (h < .135) * (v > .42)
dust = np.maximum.reduce([soften(west, 0, 3) * warm * ramp(s, .40, .50), soften(mid, 0, 3) * warm * ramp(s, .45, .57), soften(east, 0, 3) * warm * ramp(s, .45, .57)])
dust = np.maximum(soften(dust, 1, 2) * 1.5, soften(soften(low, 0, 3) * warm * ramp(s, .47, .6), 1, 2) * .75)  # Melt the key into one soft cloud; the low spray lies on floor, so it moves less.
clear = 1 - soften(hard, 5, 1.5)                        # Keep clear of hard shapes by more than the dust's travel.
r = np.clip(dust, 0, 1) * clear

# The chips that hang in the air. Chips that rest on the floor or slab are left out.
chips = [(.396,.372,.015,.030),(.337,.412,.011,.018),(.468,.456,.011,.018),(.466,.504,.015,.024),(.058,.504,.019,.030),
         (.598,.518,.024,.036),(.678,.503,.017,.030),(.722,.433,.019,.030),(.941,.516,.016,.026),(.909,.556,.011,.018),(.765,.452,.009,.016)]
g = np.zeros_like(v)
for c in chips:
    g = np.maximum(g, ellipse(*c))
g = soften(g, 1, 1.2) * (1 - soften(hard, 1, 1))

# The banners, without the knight's mane or the wall before them.
cloth_zone = np.maximum.reduce([
    polygon(rgb, [(.104,0),(.213,0),(.214,.155),(.206,.155),(.17,.115),(.135,.115),(.104,.17)]),
    polygon(rgb, [(.352,0),(.414,0),(.414,.195),(.356,.195)]),
])
b = soften(cloth_zone, 1, 1.5) * (1 - soften(knight, 1, 1))

save('earthquake', r, g, b)
