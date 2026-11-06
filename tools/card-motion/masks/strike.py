"""Strike. R: the red plume and the free cape parts, zero at the knight and full at the tips. G: the dust at the feet. B: the spear blade."""
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *

rgb = painting('strike'); h, s, v = hsv(rgb)
H, W = v.shape

def close(mask, n):
    im = Image.fromarray(np.uint8(np.clip(mask, 0, 1) * 255)).filter(ImageFilter.MaxFilter(n * 2 + 1)).filter(ImageFilter.MinFilter(n * 2 + 1))
    return np.asarray(im, dtype=np.float32) / 255

# The knight and the spear shaft: all hard paint. The cloth behind the arm counts as hard, as the arm and the shaft trap it.
knight = polygon(rgb, [(.467,.143),(.489,.112),(.499,.112),(.517,.149),(.521,.189),(.512,.225),(.531,.24),(.562,.24),(.568,.275),(.579,.303),(.57,.32),(.579,.366),(.586,.40),(.599,.446),
                       (.585,.466),(.575,.497),(.547,.536),(.54,.59),(.527,.576),(.50,.56),(.482,.594),(.496,.68),(.50,.75),(.518,.787),(.535,.87),(.51,.894),(.48,.87),(.473,.833),(.475,.772),
                       (.454,.729),(.434,.656),(.427,.643),(.424,.698),(.403,.686),(.396,.594),(.40,.56),(.375,.535),(.352,.527),(.369,.49),(.393,.43),(.40,.415),(.37,.37),(.33,.355),(.30,.343),
                       (.292,.309),(.304,.292),(.325,.24),(.348,.212),(.364,.215),(.37,.189),(.406,.166),(.451,.172),(.457,.183)])
shaft = polygon(rgb, [(.222,.25),(.25,.258),(.66,.55),(.665,.59),(.60,.555),(.25,.292),(.225,.283)])
hard = np.maximum(knight, shaft)

# The red cloth, each free part limited by its own polygon.
red = ((h > .93) | (h < .05)) & (s > .42) & (v > .12)
parts = np.maximum.reduce([
    polygon(rgb, [(.33,.05),(.40,.03),(.45,.005),(.505,.01),(.535,.06),(.53,.12),(.505,.128),(.47,.135),(.45,.145),(.43,.17),(.39,.16),(.36,.13),(.35,.09)]),  # plume
    polygon(rgb, [(.295,.24),(.30,.17),(.335,.15),(.385,.15),(.41,.165),(.375,.195),(.365,.215),(.335,.205),(.32,.22)]),  # flag behind the shoulder
    polygon(rgb, [(.222,.48),(.245,.40),(.29,.365),(.345,.37),(.375,.375),(.405,.41),(.39,.44),(.368,.495),(.355,.53),(.40,.56),(.395,.62),(.37,.625),(.335,.57),(.30,.545),(.25,.59),(.25,.55),(.30,.51),(.29,.47),(.25,.45)]),  # big cape
    polygon(rgb, [(.51,.56),(.57,.535),(.605,.60),(.60,.645),(.56,.66),(.50,.67),(.49,.60)]),  # tatters under the hand
    polygon(rgb, [(.575,.31),(.625,.32),(.625,.43),(.595,.43),(.585,.37)]),  # cloth behind the right arm
])
cloth = close(parts * red, 2) * parts

# Distance from the hard paint, in painting widths: the cloth is tight at the knight and free at the tips.
inner = np.asarray(Image.fromarray(np.uint8(hard * 255)).filter(ImageFilter.MinFilter(3)), dtype=np.float32) > 127
ey, ex = np.nonzero((hard > .5) & ~inner)
far = np.zeros_like(v)
for y in range(H):
    far[y] = np.min(np.hypot(np.arange(W)[:, None] - ex, y - ey), axis=1) / W
far = far * (hard < .5)
free = np.clip((far - .004) / .09, 0, 1)
free = free * free * (3 - 2 * free)
free = np.maximum(free, np.clip((far - .004) / .02, 0, 1) * .3)
r = soften(cloth, 3, 2) * free * (1 - soften(hard, 0, 1))

# The dust at the feet: its bright soft paint. The legs, the cape, and the thrown stone stay out.
reach = np.maximum(
    polygon(rgb, [(.22,.58),(.30,.58),(.38,.63),(.43,.70),(.47,.78),(.478,.86),(.44,.86),(.38,.82),(.32,.76),(.26,.70),(.21,.66)]),
    polygon(rgb, [(.515,.66),(.56,.66),(.60,.72),(.62,.80),(.60,.87),(.54,.87),(.52,.79),(.505,.72)]))
bright = (h > .055) & (h < .15) & (s > .3) & (v > .5)
stone = polygon(rgb, [(.545,.72),(.572,.72),(.572,.775),(.545,.775)])
keep_out = np.maximum.reduce([soften(knight, 2, 2), soften(cloth, 3, 2), soften(stone, 1, 2)])
g = soften(reach, 0, 6) * soften(reach * bright, 2, 4) * (1 - keep_out)
g = np.clip(g * 1.25, 0, 1)

# The blade only: not the collar, and not the floor below it.
b = soften(polygon(rgb, [(.719,.572),(.745,.605),(.838,.758),(.80,.735),(.72,.688),(.697,.668),(.71,.645),(.70,.62),(.685,.585),(.70,.59)]), 0, .7)
save('strike', r, g, b)
