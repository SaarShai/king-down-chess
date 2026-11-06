"""Leap. R: pines, bushes and grass, weighted so tree tops travel most and bases stay. G: the sun's glow and its reflection on the valley haze. B: the sky's clouds."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('leap'); h, s, v = hsv(rgb)
H, W = v.shape
Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
X = (X + .5) / W; Y = (Y + .5) / H

# The stag, antlers and hooves: its warm tan inside a close outline, so sky peach beside the antlers does not count.
outline = np.maximum.reduce([
    polygon(rgb, [(.205,.215),(.22,.14),(.27,.135),(.30,.18),(.345,.11),(.372,.04),(.415,.06),(.425,.20),(.40,.25),(.47,.27),(.60,.33),(.69,.43),(.705,.50),(.74,.56),(.79,.68),(.79,.72),(.74,.72),(.70,.69),(.65,.60),(.62,.57),(.56,.55),(.50,.53),(.47,.58),(.40,.58),(.35,.50),(.35,.44),(.30,.41),(.30,.34),(.28,.27),(.25,.27),(.21,.25)]),
])
tan = (h > .07) & (h < .17) & (s > .12) & (v > .5)
dark = v < .3
stag = outline * (tan | dark)
stag = np.maximum(stag, polygon(rgb, [(.30,.27),(.40,.26),(.60,.34),(.68,.44),(.66,.52),(.60,.55),(.50,.52),(.36,.46),(.31,.40)]))

# The four pawns: simple flared outlines, a little wide.
def pawn(cx, half):
    return polygon(rgb, [(cx-.026,.665),(cx+.026,.665),(cx+.027,.74),(cx+.022,.76),(cx+.036,.83),(cx+half,.86),(cx+half,.905),(cx-half,.905),(cx-half,.86),(cx-.036,.83),(cx-.022,.76),(cx-.027,.74)])
pawns = np.maximum.reduce([pawn(.160,.046), pawn(.378,.044), pawn(.620,.042), pawn(.870,.044)])

# Pines in front of the haze: tip x, tip y, half width at the base, base y. Only near trees sway; the far forest stays.
PINES = [(.055,.125,.040,.27),(.004,.04,.045,.25),(.022,.35,.050,.62),(.107,.27,.016,.34),(.122,.275,.018,.35),
         (.163,.40,.040,.64),(.193,.37,.050,.68),(.125,.575,.038,.72),(.108,.455,.030,.60),(.247,.455,.030,.60),
         (.305,.50,.055,.80),(.430,.62,.040,.81),(.489,.655,.030,.80),(.520,.66,.026,.79),(.556,.69,.024,.80),
         (.722,.735,.028,.83),(.770,.75,.020,.83),(.815,.655,.042,.80),(.842,.69,.026,.80),(.875,.55,.045,.76),
         (.968,.445,.060,.77),(.925,.63,.025,.76)]
foliage = (h > .1) & (h < .36) & (s > .2) & (v < .86)
trees = np.zeros_like(v)
for tx, ty, half, by in PINES:
    tri = polygon(rgb, [(tx,ty-.008),(tx+half,by),(tx-half,by)])
    tip = np.clip((by - Y) / (by - ty), 0, 1)
    trees = np.maximum(trees, tri * (.3 + .7 * tip) * foliage)

# Bushes and grass: green paint only, so the wall, rocks and floor stay.
grass_area = np.maximum.reduce([
    polygon(rgb, [(.0,.76),(.11,.79),(.115,.84),(.09,.875),(.03,.87),(.0,.86)]),
    polygon(rgb, [(.205,.70),(.30,.72),(.33,.78),(.345,.83),(.25,.815),(.205,.80)]),
    polygon(rgb, [(.425,.78),(.48,.77),(.54,.79),(.578,.835),(.425,.835)]),
    polygon(rgb, [(.665,.80),(.72,.81),(.72,.84),(.665,.84)]),
    polygon(rgb, [(.78,.80),(.825,.81),(.82,.85),(.78,.85)]),
    polygon(rgb, [(.915,.76),(.96,.73),(1.,.72),(1.,.88),(.915,.87)]),
])
grass = grass_area * ((h > .09) & (h < .36) & (s > .22)) * .85
grass = grass + grass_area * (s < .22) * (v > .78) * .85  # The bushes' white flowers go with their leaves.

# Keep-outs: paint here must not move, nor be dragged in by a neighbour.
rocks = np.maximum.reduce([
    polygon(rgb, [(.05,.295),(.10,.30),(.118,.36),(.148,.40),(.155,.50),(.11,.50),(.06,.40),(.04,.34)]),
    polygon(rgb, [(.0,.60),(.07,.60),(.085,.70),(.115,.73),(.12,.80),(.02,.80),(.0,.72)]),
    polygon(rgb, [(.228,.63),(.26,.63),(.262,.74),(.235,.74)]),
    polygon(rgb, [(.205,.80),(.285,.80),(.285,.84),(.205,.84)]),
])
hard = np.maximum.reduce([soften(stag, 4, 1.5), soften(pawns, 2, 1), soften(rocks, 0, 1.5)])
r = soften(np.maximum(trees, grass), 1, 1.2) * (1 - hard)

# Sky above the mountains, traced just over the skyline. The left pines count as not sky.
sky_poly = polygon(rgb, [(.0,.0),(1,.0),(1,.345),(.965,.325),(.945,.325),(.92,.34),(.89,.365),(.85,.35),(.82,.36),(.80,.34),(.775,.335),(.75,.315),(.71,.33),(.69,.305),(.675,.29),(.655,.295),(.64,.29),(.62,.28),(.60,.29),(.59,.28),(.57,.255),(.55,.24),(.525,.205),(.50,.215),(.46,.23),(.43,.24),(.40,.23),(.35,.21),(.32,.21),(.30,.24),(.28,.25),(.24,.24),(.21,.25),(.19,.23),(.17,.185),(.15,.19),(.125,.23),(.10,.19),(.085,.225),(.068,.15),(.056,.112),(.042,.122),(.03,.115),(.012,.04),(.0,.032)])
sky = soften(sky_poly, 0, 2)

# The sun: glow in the sky, weaker reflection on the haze below it. Screen-round.
sx, sy = .907, .325
sr = np.hypot((X - sx) * 16 / 9, Y - sy)
disc = soften((sr < .045).astype(np.float32), 2, 1.5)
glow = np.exp(-(sr / .17) ** 2) * sky
disc_glow = np.exp(-(sr / .06) ** 2)
reflect = np.exp(-((X - .90) / .055) ** 2 - ((Y - .55) / .055) ** 2) * .7 * (1 - soften(trees > 0, 2, 2))
g = np.maximum.reduce([glow, disc_glow * sky, reflect]) * (1 - hard)

# Clouds: all the sky, away from the stag and the sun's disc.
b = sky * (1 - soften(stag, 5, 2.5)) * (1 - disc)

save('leap', r, g, b)
