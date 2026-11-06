"""Fire Starter. R: the molten wake, the blaze at the rook and the three brazier flames. G: the three free banners, tight at the pole, free at the tips. B: the air where embers rise."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('firestarter'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W].astype(np.float32); X = (X + .5) / W; Y = (Y + .5) / H

def close(mask, n):
    a = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)).filter(ImageFilter.MinFilter(n * 2 + 1))
    return np.asarray(a, dtype=np.float32) / 255
def ramp(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)

# The pieces and the broken stone stay still.
knight = polygon(rgb, [(.40,.145),(.47,.14),(.495,.21),(.50,.33),(.475,.35),(.46,.42),(.475,.46),(.482,.50),(.475,.518),(.452,.525),(.43,.545),(.412,.575),(.40,.605),(.402,.66),(.405,.69),
                       (.39,.712),(.30,.705),(.262,.685),(.255,.65),(.262,.615),(.275,.59),(.288,.555),(.292,.50),(.305,.44),(.345,.38),(.345,.28)])
rook = polygon(rgb, [(.585,.17),(.70,.19),(.69,.25),(.665,.30),(.66,.42),(.668,.47),(.62,.495),(.575,.45),(.54,.405),(.56,.378),(.597,.36),(.603,.30),(.60,.25),(.585,.22)])
stones = np.maximum.reduce([polygon(rgb, p) for p in [
    [(.517,.245),(.542,.285),(.53,.30),(.512,.295)],
    [(.545,.245),(.565,.262),(.562,.292),(.55,.285)],
    [(.518,.30),(.532,.315),(.528,.34),(.515,.33)],
    [(.51,.35),(.53,.365),(.522,.39),(.508,.375)],
]])
solid = np.maximum.reduce([knight, rook, stones])

# The fire: its saturated orange and gold, inside the traced wake, the blaze and the brazier flames.
wake = polygon(rgb, [(0,.705),(.05,.69),(.09,.66),(.14,.665),(.20,.615),(.235,.565),(.275,.50),(.30,.47),(.30,.71),(.40,.72),(.40,.63),(.41,.58),(.45,.53),(.49,.51),(.50,.46),
                     (.56,.495),(.525,.505),(.505,.545),(.495,.575),(.47,.605),(.455,.645),(.445,.69),(.42,.725),(.39,.755),(.365,.80),(.33,.87),(.30,.95),(.265,1),(0,1)])
blaze = polygon(rgb, [(.50,.47),(.488,.43),(.50,.395),(.52,.385),(.53,.345),(.545,.31),(.555,.29),(.57,.265),(.585,.24),(.597,.27),(.597,.33),(.58,.362),(.555,.375),(.538,.405),(.575,.452),(.60,.485),(.56,.495)])
side = polygon(rgb, [(.655,.33),(.678,.335),(.67,.40),(.668,.44),(.68,.48),(.645,.485),(.648,.44),(.652,.39)])
fire_key = ((h < .14) | (h > .97)) & (s > .6) & (v > .6)
fire = np.maximum.reduce([wake, blaze, side]) * fire_key
fire = soften(fire, 2, 2.2) * soften(np.maximum.reduce([wake, blaze, side]), 0, 1.5)
fire *= 1 - soften(solid, 1, 1)

# The brazier flames: free at the tip, tied at the bowl. Their masks reach past the flame, so the outline can flicker.
flames = np.zeros_like(v)
for x0, x1, top, bowl in [(.497,.527,.145,.198), (.56,.585,.17,.205), (.716,.752,.14,.197)]:
    box = polygon(rgb, [(x0,top),(x1,top),(x1,bowl),(x0,bowl)])
    flames = np.maximum(flames, soften(box * ((v > .55) & (h < .14)), 3, 1.5) * soften(box, 0, 1) * (1 - ramp(Y, bowl - .03, bowl)) )
fire = np.maximum(fire, flames)

# The banners: red, closed over their gold emblems, away from the poles.
reach = np.maximum.reduce([
    polygon(rgb, [(.071,0),(.135,0),(.128,.13),(.122,.215),(.108,.262),(.082,.262),(.078,.20),(.07,.13)]),
    polygon(rgb, [(.161,.06),(.206,.06),(.20,.20),(.192,.262),(.165,.255),(.158,.19)]),
    polygon(rgb, [(.757,.168),(.795,.165),(.797,.295),(.86,.36),(.862,.43),(.905,.53),(.88,.52),(.82,.44),(.79,.41),(.768,.36),(.758,.30)]),
])
red = ((h > .93) | (h < .05)) & (s > .4) & (v > .16)
cloth = close(reach * red, 4) * reach
poles = np.maximum.reduce([polygon(rgb, p) for p in [
    [(.05,0),(.07,0),(.068,.16),(.05,.17)],
    [(.152,.02),(.163,.03),(.162,.19),(.148,.28),(.14,.28)],
    [(.748,.12),(.758,.12),(.761,.37),(.75,.37)],
]])
free = np.where(X < .14, ramp(Y, .02, .17), np.where(X < .4, ramp(Y, .065, .22), ramp(Y + .5 * (X - .76), .17, .36)))
banners = soften(cloth, 2, 1.2) * (.08 + .92 * free) * (1 - soften(poles, 0, .8))

# The air the embers cross: above the blaze and above the wake, clear of the pieces and the banners.
air = np.maximum(polygon(rgb, [(.47,.54),(.50,.30),(.53,.13),(.60,.05),(.68,.10),(.72,.30),(.70,.46),(.58,.47),(.52,.54)]),
                 polygon(rgb, [(0,.98),(0,.74),(.10,.68),(.20,.62),(.26,.54),(.29,.66),(.30,.80),(.20,.95)]))
embers = soften(air, 0, 8) * (1 - soften(np.maximum(knight, rook), 2, 1.5))

save('firestarter', fire, banners, embers)
