"""Haste. R: the red pennant (0 at its pole, full at its tails). G: the gold dust swirl round the rook. B: the seven wall banners (0 at the top bar, full at the hem)."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('haste'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W]; x = (X + .5) / W; y = (Y + .5) / H
smooth = lambda e: (lambda a: a * a * (3 - 2 * a))(np.clip(e, 0, 1))
def disc(cx, cy, rx):  # Round on screen: rx is in painting x units.
    return (np.hypot(x - cx, (y - cy) * 9 / 16) < rx).astype(np.float32)
def close(mask, n):  # Fill holes and gaps up to 2n map pixels, so an emblem or a tear does not bend the moving paint.
    im = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255))
    return np.asarray(im.filter(ImageFilter.MaxFilter(n * 2 + 1)).filter(ImageFilter.MinFilter(n * 2 + 1)), dtype=np.float32) / 255
def line(a, b, width):  # A thin pole from a to b, in painting units.
    (x0, y0), (x1, y1) = a, b
    return polygon(rgb, [(x0 - width, y0), (x0 + width, y0), (x1 + width, y1), (x1 - width, y1)])

# The rook's silhouette, traced at 1024 x 576. Nothing on it moves.
ROOK = [(525,80),(556,84),(560,106),(580,106),(590,77),(610,80),(615,100),(640,91),(672,100),(688,116),(678,165),(662,186),(640,200),(634,218),(640,252),
        (622,303),(626,320),(641,346),(636,366),(657,396),(652,428),(657,450),(632,467),(560,447),(470,422),(413,392),(424,360),(470,322),(482,308),(510,240),(524,190),(514,165),(505,130),(525,115)]
rook = polygon(rgb, [(a / 1024, b / 576) for a, b in ROOK])
red = ((h > .93) | (h < .05)) & (s > .35) & (v > .12)

# R: the pennant. Its colour inside a close trace, grown into the sky so its edges can move; the pole and the rook stay.
reach = polygon(rgb, [(.555,.055),(.50,.075),(.455,.095),(.415,.06),(.37,.035),(.33,.06),(.295,.095),(.33,.095),(.37,.09),(.42,.14),(.385,.16),(.345,.205),(.295,.245),(.36,.235),(.40,.19),(.45,.21),(.495,.225),(.555,.22)])
cloth = soften(close(reach * red, 2), 3, 0)
keep = (1 - soften(rook, 3, 1.5)) * (1 - soften(line((.546,.03), (.556,.14), .012), 1, 1))
pennant = soften(cloth, 0, 1.5) * keep * smooth((.535 - x) / .19)

# B: the banners, each pinned at its bar. Box: x0, x1, y0 (the bar), y1 (the longest tail). Poles: the two rods at its sides, which it must not drag. Power: the far banners are small, so they move less.
BANNERS = [(.069,.121,.055,.25, [((.066,.03),(.062,.24)), ((.123,.03),(.116,.26))], 1.),
           (.184,.208,.145,.245, [((.182,.13),(.181,.25)), ((.2095,.13),(.205,.30))], .7),
           (.264,.286,.28,.36, [((.262,.27),(.262,.36)), ((.287,.27),(.283,.37))], .65),
           (.386,.410,.29,.385, [((.384,.27),(.382,.385)), ((.411,.27),(.406,.40))], .7),
           (.918,.961,.20,.445, [((.914,.17),(.926,.44)), ((.964,.17),(.969,.45))], 1.),
           (.678,.695,.41,.50, [((.676,.39),(.676,.50)), ((.697,.39),(.697,.50))], .55),
           (.768,.787,.465,.525, [((.766,.45),(.766,.53)), ((.788,.45),(.788,.53))], .5)]
dye = ((h > .94) | (h < .035)) & (s > .42) & (v > .14)
banners = np.zeros_like(v)
for x0, x1, y0, y1, poles, power in BANNERS:
    (a, b), (c, d) = poles
    between = polygon(rgb, [a, c, d, b])
    rods = np.maximum(line(a, b, .0012), line(c, d, .0012))
    box = polygon(rgb, [(x0, y0), (x1, y0), (x1, y1), (x0, y1)])
    fall = smooth((y - y0 - .008) / (.7 * (y1 - y0)))
    held = soften(close(box * dye, 5), 2, 1.5) * between * (1 - soften(rods, 0, .8))
    banners = np.maximum(banners, held * fall * power)

# G: the swirl. Gold paint in the two arcs, with its fine grit closed in. The stones are hard; they stay still.
arcs = np.maximum(
    polygon(rgb, [(.50,.445),(.40,.445),(.30,.455),(.21,.48),(.15,.525),(.145,.585),(.19,.645),(.27,.71),(.37,.76),(.47,.795),(.56,.81),(.52,.75),(.43,.70),(.36,.62),(.36,.54),(.47,.50)]),
    polygon(rgb, [(.62,.66),(.70,.68),(.78,.72),(.85,.765),(.865,.81),(.82,.85),(.72,.855),(.62,.85),(.625,.79),(.66,.75)]))
gold = (h > .05) & (h < .16) & (s > .38) & (v > .6)
closed = np.asarray(Image.fromarray(np.uint8(gold * 255)).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3)), dtype=np.float32) / 255
STONES = [(.2233,.537,.016),(.234,.60,.019),(.283,.675,.023),(.33,.705,.019),(.318,.668,.013),(.37,.645,.011),(.275,.62,.007),
          (.717,.817,.019),(.668,.7865,.013),(.692,.822,.009),(.678,.815,.007),(.769,.785,.006),(.769,.833,.007)]
stones = np.zeros_like(v)
for c in STONES: stones = np.maximum(stones, disc(*c))
hold = (1 - soften(rook, 3, 2)) * (1 - soften(stones, 0, 1))
swirl = soften(closed * arcs, 1, 2.5) * soften(arcs, 0, 3) * hold

save('haste', pennant, swirl, banners)
