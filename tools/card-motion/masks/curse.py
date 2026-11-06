"""Curse. R: the purple curse smoke, weak on the wisps' far end and where it lies over the knight's chest. G: its glow, beside the mane and on the wet floor. B: the night clouds near the moon."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('curse'); h, s, v = hsv(rgb)
H, W = v.shape

# The knight's silhouette with the mane and the base. The smoke that lies over the chest stays outside this shape.
knight = polygon(rgb, [(.538,.22),(.567,.187),(.60,.167),(.635,.169),(.655,.158),(.653,.187),(.668,.198),(.683,.184),(.676,.224),(.6825,.285),(.678,.331),(.684,.378),(.679,.398),
                       (.655,.417),(.642,.395),(.648,.372),(.635,.331),(.622,.331),(.617,.343),(.632,.395),(.65,.447),(.664,.512),(.652,.557),(.645,.603),(.658,.624),(.652,.656),
                       (.665,.685),(.673,.713),(.668,.754),(.635,.765),(.538,.76),(.486,.70),(.482,.67),(.502,.65),(.507,.603),(.56,.60),(.632,.60),(.593,.54),(.551,.522),(.539,.476),
                       (.549,.424),(.528,.407),(.50,.395),(.508,.331),(.518,.291)])
keep_out = soften(knight, 2, 1.5)

# The white pieces to the left: the pawn and the bishop.
pieces = np.maximum(polygon(rgb, [(.20,.28),(.222,.28),(.235,.40),(.25,.45),(.185,.45),(.195,.40)]),
                    polygon(rgb, [(.12,.19),(.175,.19),(.18,.46),(.11,.46)]))
keep_out = np.maximum(keep_out, soften(pieces, 3, 1.5))

purple = (h > .68) & (h < .86)

# The smoke to the left of the knight, traced close: the curl, the long waves, the low dark rolls. It stops above the rubble and below the arches.
left = polygon(rgb, [(.19,.21),(.24,.19),(.29,.23),(.315,.30),(.33,.335),(.39,.325),(.44,.33),(.455,.28),(.475,.245),(.505,.26),(.525,.29),(.56,.40),(.565,.53),(.64,.60),
                     (.505,.61),(.49,.625),(.43,.605),(.36,.605),(.30,.56),(.262,.50),(.255,.44),(.255,.30),(.235,.27),(.20,.26)])
# The smoke to the right of the knight lies over the low wall and the floor, which are stone. Only its strong colour moves, and weakly.
right = polygon(rgb, [(.655,.50),(.69,.52),(.715,.58),(.718,.69),(.69,.71),(.672,.70),(.655,.62)])
strong = np.clip((s - .3) / .22, 0, 1) * purple * (v > .3)
smoke = np.maximum(soften(left * (purple & (s > .12)), 2, 1) * soften(left, 0, 3),
                   soften(right * strong, 0, 1.5) * soften(right, 0, 3) * .55)

# Paint that lies over the chest moves less than the free wisps.
chest = soften(polygon(rgb, [(.51,.50),(.65,.50),(.65,.62),(.51,.62)]), 0, 3)
r = smoke * (1 - keep_out) * (1 - .45 * chest)

# The glow: the hot purple beside the mane and the chest, then its reflection on the wet floor.
hot = polygon(rgb, [(.44,.30),(.56,.30),(.56,.60),(.47,.60),(.42,.48)]) * purple * (s > .35) * (v > .5)
# The floor's strength follows the reflection's own colour, so the area has no square edge.
floor = soften(polygon(rgb, [(.45,.79),(.62,.79),(.635,.87),(.46,.885)]), 0, 8) * np.clip((s - .2) / .25, 0, 1) * purple
g = np.maximum(soften(hot, 3, 3), soften(floor, 1, 2) * .75) * (1 - keep_out)

# The clouds around the moon. The moon's disc and the towers stay still.
sky = soften(polygon(rgb, [(.60,0),(.825,0),(.825,.055),(.805,.11),(.78,.175),(.72,.185),(.69,.15),(.655,.125),(.61,.105),(.59,.05)]), 0, 3)
yy, xx = np.mgrid[0:H, 0:W]
disc = (((xx + .5) / W - .7365) / .0245) ** 2 + (((yy + .5) / H - .055) / .0435) ** 2 < 1
b = sky * (1 - soften(np.float32(disc), 2, 1.5))

save('curse', r, g, b)
