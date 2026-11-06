"""Flight. R: the two free ribbon tails, 0 at the bishop and full at the tips. G: the wind's pale strokes on the two arcs of the swirl. B: the leaves that the wind carries."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('flight'); h, s, v = hsv(rgb)
H, W = v.shape
yy, xx = np.mgrid[0:H, 0:W]; qx, qy = (xx + .5) / W, (yy + .5) / H

# The bishop's silhouette. Nothing near it moves.
bishop = polygon(rgb, [(.505,.07),(.525,.085),(.545,.125),(.557,.17),(.55,.215),(.535,.25),(.56,.29),(.555,.315),(.54,.335),(.545,.40),(.565,.47),(.59,.56),(.61,.64),(.56,.675),(.48,.68),(.42,.655),(.42,.61),(.43,.56),(.455,.47),(.475,.40),(.48,.335),(.46,.31),(.465,.28),(.48,.25),(.462,.2),(.47,.14),(.49,.1)])
# The ribbon where it wraps the bishop. It stays still and it holds the wind off.
wrap = polygon(rgb, [(.40,.50),(.46,.42),(.52,.37),(.55,.31),(.575,.33),(.58,.40),(.575,.47),(.55,.45),(.50,.45),(.46,.50),(.45,.60),(.47,.63),(.415,.625),(.405,.57)])
# The two tails, traced with a small margin. The colour key below finds the exact edge.
upper = polygon(rgb, [(.292,.0),(.292,.05),(.285,.095),(.34,.095),(.395,.11),(.425,.15),(.43,.205),(.455,.25),(.49,.262),(.49,.37),(.44,.345),(.385,.305),(.352,.265),(.352,.23),(.36,.19),(.345,.18),(.31,.192),(.275,.19),(.25,.15),(.24,.105),(.25,.08),(.248,.04)])
lower = polygon(rgb, [(.555,.495),(.60,.525),(.645,.57),(.68,.615),(.69,.655),(.715,.68),(.735,.665),(.752,.64),(.757,.665),(.735,.70),(.70,.725),(.67,.70),(.65,.66),(.625,.635),(.60,.62),(.57,.64)])
red = ((h > .9) | (h < .055)) & (s > .35)
gold = (h > .03) & (h < .14) & (s > .3)
ribbon_key = (red | (gold & (v > .72))) * (bishop < .5)
tails = np.maximum(upper, lower) * ribbon_key

# Weight grows with the distance from the bishop, in units of the painting's width.
edge = (bishop > .5) & (soften(bishop, 0, 0) > .5)
ey, ex = np.nonzero(edge & (np.asarray(Image.fromarray(np.uint8(bishop * 255)).filter(ImageFilter.MinFilter(3))) < 128))
far = np.array([np.min(np.hypot(np.arange(W)[:, None] - ex, y - ey), axis=1) for y in range(H)]) / W
def ramp(x, a, b):
    u = np.clip((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)
weight = np.where(qx < .5, ramp(far, .012, .20), ramp(far, .012, .14))
r = soften(tails, 3, 2) * weight * (soften(bishop, 3, 1) < .02)

# The wind's strokes: pale paint on the two arcs.
arc_up = polygon(rgb, [(.535,.085),(.60,.085),(.665,.105),(.72,.16),(.745,.24),(.735,.30),(.705,.355),(.655,.405),(.60,.45),(.565,.465),(.565,.385),(.61,.37),(.645,.34),(.665,.30),(.67,.255),(.655,.215),(.625,.17),(.585,.14),(.535,.125)])
arc_low = polygon(rgb, [(.44,.415),(.37,.43),(.31,.47),(.272,.52),(.268,.58),(.295,.635),(.345,.685),(.41,.725),(.48,.75),(.60,.765),(.60,.745),(.53,.72),(.47,.695),(.42,.655),(.385,.60),(.375,.55),(.395,.50),(.43,.465)])
pale = (v > .72) & (s < .42)
warm = (rgb[..., 0] > .6) & (s < .5)
strokes_up = soften(arc_up * warm, 2, 2) * soften(arc_up, 0, 3) * ramp(qx, .535, .60)
strokes_low = soften(arc_low * pale, 1, 1.5) * soften(arc_low, 0, 3) * (1 - ramp(qx, .46, .60))

# The leaves: an ellipse round each one, x, y, half width, half height, turn.
def ellipse(x, y, rx, ry, turn):
    u, w = (qx - x) * 16 / 9, qy - y
    c, n = np.cos(turn), np.sin(turn)
    return (((u * c + w * n) / (rx * 16 / 9)) ** 2 + ((w * c - u * n) / ry) ** 2 < 1).astype(np.float32)
leaf = np.maximum.reduce([ellipse(*e) for e in [(.643,.20,.012,.024,-.4),(.59,.28,.024,.013,-.45),(.606,.358,.016,.011,-.3),(.76,.22,.016,.038,.6),(.739,.298,.009,.024,.1),
                                                (.276,.557,.012,.018,.4),(.252,.622,.012,.024,-.3),(.335,.677,.016,.012,.5)]])
b = soften(leaf, 2, 2)

keep_out = soften(np.maximum.reduce([bishop, wrap * ribbon_key, np.maximum(upper, lower) * ribbon_key]), 4, 3)
g = np.maximum(strokes_up, strokes_low) * (1 - keep_out) * (1 - np.clip(b * 2, 0, 1))
save('flight', r, g, b)
