import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('haste'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W]; x = (X + .5) / W; y = (Y + .5) / H
ramp = lambda a, b: np.clip((a - b), 0, 1)
disc = lambda c: ((x - c[0]) ** 2 + (y - c[1]) ** 2 < c[2] ** 2).astype(np.float32)

red = ((h > .93) | (h < .045)) & (s > .38) & (v > .18)
# The rook, whole. Nothing that belongs to it may move.
rook = polygon(rgb, [(.43,.115),(.46,.1),(.5,.11),(.5,.165),(.515,.165),(.52,.105),(.58,.11),(.585,.2),(.55,.25),(.53,.33),(.57,.42),(.61,.5),(.645,.56),(.695,.66),(.69,.75),(.66,.775),(.5,.73),(.375,.705),(.27,.67),(.28,.61),(.36,.525),(.38,.49),(.43,.36),(.45,.31),(.42,.26),(.405,.2),(.43,.16)])

# R: cloth. The pennant is fixed at its pole; hanging banners are fixed along the top.
pennant = red * polygon(rgb, [(.09,.03),(.53,.01),(.53,.2),(.42,.215),(.24,.215),(.09,.24)]) * np.clip((.47 - x) / .14, 0, 1)
pennant = soften(pennant, 3, 2) * (1 - soften(rook, 2, 1))
banners = np.zeros_like(v)
for x0, x1, y0, y1 in [(.024,.086,.125,.28), (.25,.283,.225,.325), (.895,.945,.18,.34), (.715,.743,.345,.44)]:
    a = (x > x0) & (x < x1) & (y > y0) & (y < y1) & red
    banners = np.maximum(banners, a * np.clip((y - y0 - .012) / (.55 * (y1 - y0)), 0, 1))
poles = polygon(rgb, [(.017,.1),(.024,.1),(.024,.3),(.017,.3)]) + polygon(rgb, [(.086,.1),(.095,.1),(.095,.3),(.086,.3)]) \
      + polygon(rgb, [(.241,.21),(.249,.21),(.249,.34),(.241,.34)]) + polygon(rgb, [(.283,.21),(.29,.21),(.29,.34),(.283,.34)]) \
      + polygon(rgb, [(.886,.15),(.895,.15),(.895,.45),(.886,.45)]) + polygon(rgb, [(.946,.15),(.955,.15),(.955,.45),(.946,.45)]) \
      + polygon(rgb, [(.711,.33),(.716,.33),(.716,.46),(.711,.46)]) + polygon(rgb, [(.742,.33),(.748,.33),(.748,.46),(.742,.46)])
banners = soften(banners, 2, 1) * (1 - soften(poles, 0, .7))
cloth_ = np.maximum(pennant, banners)

# G: the dust swirl. Gold paint in the two arcs; the fine grit in them is closed over and flows too; the big stones stay.
arcs = np.maximum(
    polygon(rgb, [(.03,.5),(.1,.455),(.2,.42),(.3,.395),(.43,.385),(.43,.44),(.33,.47),(.27,.52),(.27,.6),(.3,.67),(.42,.72),(.52,.74),(.5,.775),(.38,.75),(.24,.7),(.12,.64),(.05,.58),(.02,.54)]),
    polygon(rgb, [(.62,.585),(.72,.615),(.83,.655),(.92,.7),(.985,.75),(.97,.785),(.9,.805),(.78,.8),(.66,.785),(.67,.76),(.76,.765),(.85,.76),(.88,.73),(.82,.69),(.72,.655),(.65,.62)]))
gold = (h > .055) & (h < .15) & (s > .42) & (v > .62)
stones = [(.095,.55,.024),(.102,.629,.02),(.177,.658,.026),(.239,.688,.026),(.25,.613,.016),(.227,.646,.012),(.271,.56,.012),(.141,.586,.01),(.145,.491,.01),(.107,.513,.008),(.252,.544,.012),
          (.92,.757,.016),(.775,.767,.013),(.734,.748,.016),(.848,.789,.013),(.934,.783,.012),(.852,.724,.009),(.75,.725,.012)]
rock = np.zeros_like(v)
for c in stones: rock = np.maximum(rock, disc(c))
keep = (1 - soften(rook, 2, 1.5)) * (1 - soften(rock, 0, 1.2))
swirl = soften(gold * arcs, 2, 2.5) * keep

# B: the air that the loose grit drifts through, close around the swirl.
air = np.maximum(
    polygon(rgb, [(.01,.5),(.06,.42),(.2,.385),(.3,.42),(.28,.6),(.34,.69),(.2,.7),(.06,.62)]),
    polygon(rgb, [(.7,.63),(.86,.66),(.99,.74),(.97,.82),(.8,.83),(.68,.78)]))
air = soften(air, 0, 5) * (1 - soften(rook, 2, 2))
save('haste', cloth_, swirl, air)
