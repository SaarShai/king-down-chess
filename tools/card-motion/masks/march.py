import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('march'); h, s, v = hsv(rgb)
H, W = h.shape
x, y = np.meshgrid((np.arange(W) + .5) / W, (np.arange(H) + .5) / H)
ramp = lambda a, b, at: np.clip((at - a) / (b - a), 0, 1)
reds = ((h > .93) | (h < .05)) & (s > .5)

# Far banners. Each one's travel fades to nothing at its pole, so no pole bends.
rust = ((h > .97) | (h < .075)) & (s > .3) & (v < .74) & (v > .25)
banner = lambda pts, pole, free: polygon(rgb, pts) * ramp(pole, free, x)
banners = np.max([
    banner([(.115,.095),(.2,.06),(.25,.06),(.25,.15),(.2,.125),(.16,.135),(.125,.165)], .25, .205),
    banner([(.255,.115),(.31,.125),(.325,.195),(.28,.17),(.255,.15)], .255, .29),
    banner([(.38,.2),(.42,.15),(.45,.13),(.495,.145),(.49,.205),(.46,.19),(.43,.17)], .495, .455),
    banner([(.5,.175),(.545,.155),(.54,.225),(.5,.22)], .54, .515),
    banner([(.585,.25),(.635,.235),(.635,.285),(.585,.29)], .635, .605),
    banner([(.835,.25),(.89,.235),(.895,.285),(.84,.3)], .892, .86),
    banner([(.895,.21),(.95,.19),(1,.205),(1,.235),(.95,.245),(.9,.275)], .892, .925),
], axis=0) * rust

# The ribbons tied to the mallets. Their travel starts at the knot; the drum's rim and the mallets stay out.
left = polygon(rgb, [(0,.395),(.05,.38),(.09,.39),(.13,.425),(.2,.405),(.225,.42),(.23,.445),(.18,.475),(.13,.48),(.09,.495),(.06,.55),(0,.62)]) * ramp(.235, .15, x)
right = polygon(rgb, [(.765,.455),(.82,.47),(.9,.48),(.96,.515),(1,.535),(1,.70),(.97,.665),(.935,.59),(.885,.545),(.82,.515),(.765,.49)]) * ramp(.765, .85, x)
rim = polygon(rgb, [(.09,.56),(.12,.5),(.2,.475),(.3,.46),(.3,.6),(.1,.6)]) + polygon(rgb, [(.78,.51),(.86,.54),(.92,.6),(.95,.7),(.85,.7)])
rim = soften(rim, 0, 1)
ribbon = soften(np.maximum(left, right) * reds, 2, 1.5) * (1 - rim)
r = np.maximum(soften(banners, 1, 1), ribbon)

# The dust the army raises: pale, soft paint only, so shields, spears and mallets stay out.
pale = (h > .055) & (h < .14) & (s < .75) & (v > .62)
dust_area = np.maximum.reduce([
    polygon(rgb, [(0,.21),(.04,.235),(.09,.24),(.13,.245),(.175,.265),(.225,.31),(.285,.29),(.33,.32),(.37,.33),(.42,.335),(.46,.365),(.51,.355),(.55,.385),(.6,.39),(.64,.37),(.71,.345),(.7,.40),(.66,.44),(.6,.448),(.42,.443),(.34,.42),(.36,.39),(.3,.325),(.22,.33),(.2,.38),(.2,.405),(.13,.42),(.09,.385),(0,.39)]),
    polygon(rgb, [(.8,.39),(.84,.42),(.88,.44),(.92,.43),(.95,.39),(1,.365),(1,.53),(.96,.51),(.9,.475),(.82,.465),(.8,.44)]),
])
mallets = np.maximum(polygon(rgb, [(.2,.37),(.22,.325),(.28,.32),(.345,.385),(.37,.41),(.34,.47),(.28,.47),(.21,.42)]), polygon(rgb, [(.64,.45),(.68,.42),(.73,.375),(.79,.375),(.815,.42),(.79,.48),(.72,.52),(.65,.5)]))
# Hard shapes come off after the feather, so the mallets, the rim, spears and shields hold still. The flying rubble goes with the dust.
hard = np.maximum.reduce([mallets, polygon(rgb, [(.3,.452),(.7,.452),(.7,.5),(.3,.5)]), (v < .5) * (1 - polygon(rgb, [(.07,.31),(.2,.31),(.2,.39),(.07,.39)])) * (1 - polygon(rgb, [(.84,.44),(.97,.44),(.97,.5),(.84,.5)]))])
g = soften(dust_area * pale * (1 - soften(np.maximum(left, right) * reds, 2, 1)), 1, 1.5) * (1 - soften(hard, 1, 1)) * np.maximum(ramp(.7, .62, x), ramp(.74, .8, x))  # The far ranks by the road are too fine to carry travel.

# Light: the low sun's halo, and the same light on the open drum skin. Dark paint in front of the sun stays out.
sun = np.clip(1 - np.hypot(x - .735, y - .18) / .24, 0, 1) ** 1.3 * (v > .72) * ramp(.37, .27, y)
skin = polygon(rgb, [(.13,.56),(.2,.5),(.42,.46),(.6,.465),(.75,.5),(.88,.59),(.9,.67),(.8,.73),(.62,.76),(.38,.7),(.2,.65)]) * ((s < .7) & (v > .45))
skin = soften(skin, 0, 1.5) * (.35 + .65 * ramp(.1, .7, x))
b = np.maximum(soften(sun, 0, 2), skin * .7)

save('march', r, g, b)
