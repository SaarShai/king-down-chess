"""Flight. R: the free ribbon (weak near the bishop, full at the tips) and the wind's leaves. G: the wind's two arcs. B: all the ribbon, for its sheen."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('flight'); h, s, v = hsv(rgb)
H, W = v.shape

def grow(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)), dtype=np.float32) / 255
def shrink(mask, n):
    return np.asarray(Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255

# The bishop's silhouette, with the ribbon where the ribbon lies over the bishop.
bishop = polygon(rgb, [(.505,.058),(.53,.075),(.533,.10),(.56,.14),(.585,.19),(.58,.225),(.558,.26),(.572,.285),(.574,.30),(.553,.32),(.56,.40),
                       (.585,.48),(.625,.555),(.615,.58),(.63,.625),(.64,.665),(.62,.685),(.5,.705),(.38,.69),(.358,.66),(.385,.62),(.38,.575),(.405,.53),
                       (.435,.44),(.46,.34),(.46,.315),(.435,.30),(.44,.28),(.457,.265),(.44,.23),(.432,.19),(.445,.15),(.48,.115),(.482,.085)])

# The ribbon: its crimson and its painted gold edges, traced close. On the bishop, gold counts only beside crimson; the ivory's warm shadows are not ribbon.
reach = np.maximum.reduce([
    polygon(rgb, [(.195,.012),(.165,.04),(.10,.09),(.105,.15),(.155,.195),(.26,.195),(.27,.30),(.33,.335),(.47,.375),(.47,.26),(.40,.255),(.375,.21),(.37,.16),(.30,.125),(.235,.115),(.185,.105),(.165,.07),(.195,.03)]),
    polygon(rgb, [(.55,.312),(.585,.308),(.604,.335),(.612,.39),(.621,.438),(.606,.468),(.58,.492),(.56,.452),(.50,.456),(.447,.488),(.41,.548),(.39,.588),(.45,.60),(.507,.622),
                  (.37,.648),(.354,.618),(.37,.59),(.355,.57),(.339,.535),(.342,.50),(.383,.455),(.44,.425),(.50,.40),(.555,.37),(.592,.352),(.55,.345)]),
    polygon(rgb, [(.605,.546),(.66,.558),(.725,.583),(.773,.615),(.795,.67),(.803,.695),(.84,.708),(.876,.69),(.895,.668),(.888,.706),(.848,.726),(.797,.745),(.757,.712),(.728,.676),(.706,.651),(.672,.66),(.634,.66),(.618,.625),(.612,.585)]),
])
red = ((h > .9) | (h < .055)) & (s > .35)
gold = (h > .03) & (h < .13) & (s > .4)
beside_red = grow(reach * red, 2) > .5
ribbon = reach * (red | (gold & ((bishop < .5) | beside_red)))
ribbon = shrink(grow(ribbon, 1), 1) * reach

# Distance from the bishop, in painting units: the ribbon is tight at the bishop and free at the tips.
inner = shrink(bishop, 1) > .5
ey, ex = np.nonzero((bishop > .5) & ~inner)
far = np.zeros_like(v)
for y in range(H):
    far[y] = np.min(np.hypot(np.arange(W)[:, None] - ex, y - ey), axis=1) / W
far = far * (bishop < .5)
free = np.clip((far - .006) / .17, 0, 1)
free = free * free * (3 - 2 * free)
free = np.maximum(free, np.clip((far - .006) / .03, 0, 1) * .3)

# The leaves the wind carries.
leaf = np.zeros_like(v)
for x0, y0, x1, y1 in [(.63,.10,.675,.13),(.715,.185,.75,.23),(.63,.262,.695,.305),(.66,.345,.705,.38),(.855,.28,.88,.335),
                       (.308,.41,.34,.433),(.322,.44,.362,.465),(.163,.56,.188,.595),(.145,.618,.172,.66),(.235,.675,.28,.708)]:
    leaf = np.maximum(leaf, polygon(rgb, [(x0,y0),(x1,y0),(x1,y1),(x0,y1)]))
leaves = leaf * (v > .68) * (s < .5)

# The wind: its pale strokes inside the two arcs, away from everything else.
arc = np.maximum(
    polygon(rgb, [(.60,.115),(.70,.105),(.78,.135),(.835,.19),(.855,.26),(.85,.30),(.82,.37),(.75,.435),(.63,.495),(.60,.48),(.61,.395),(.70,.372),(.75,.33),(.772,.27),(.76,.205),(.722,.165),(.65,.135),(.60,.128)]),
    polygon(rgb, [(.45,.44),(.38,.465),(.29,.50),(.22,.55),(.185,.60),(.20,.655),(.26,.705),(.35,.74),(.44,.762),(.62,.762),(.62,.735),(.50,.715),(.40,.695),(.33,.665),(.27,.62),(.25,.57),(.29,.53),(.36,.50),(.40,.47)]))
keep_out = np.maximum.reduce([soften(bishop, 7, 1), soften(ribbon, 5, 5), soften(leaf * (v > .6), 2, 1)])
wind = soften(arc * (v > .7) * (s < .42), 1, 2) * soften(arc, 0, 3) * (1 - keep_out)

r = np.maximum(soften(ribbon, 4, 2) * free, soften(leaves, 3, 2) * .65)
b = soften(shrink(ribbon, 1), 0, .7)
save('flight', r, wind, b)
