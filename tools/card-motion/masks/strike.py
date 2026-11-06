import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('strike'); h, s, v = hsv(rgb)
H, W = h.shape; yy, xx = np.mgrid[0:H, 0:W]; x, y = (xx + .5) / W, (yy + .5) / H
red = ((h > .93) | (h < .035)) & (s > .4) & (v > .1)
# The red cloth, each free part limited by its own polygon.
parts = [
  [(.115,.37),(.30,.33),(.40,.31),(.40,.45),(.36,.50),(.345,.575),(.30,.575),(.25,.565),(.16,.565),(.115,.50)],  # cape behind the legs
  [(.20,.14),(.37,.13),(.37,.20),(.30,.27),(.20,.24)],  # cape behind the shoulder
  [(.27,.24),(.33,.22),(.40,.30),(.40,.40),(.30,.38)],  # cape under the spear
  [(.57,.50),(.62,.50),(.67,.60),(.625,.635),(.57,.61)],  # tatters under the hand
  [(.26,0),(.57,0),(.57,.15),(.34,.15),(.26,.08)],  # plume
]
cloth = sum(polygon(rgb, p) for p in parts).clip(0, 1) * red
# The body and the spear stay still: the cloth mask fades to zero before it can drag them.
hard = sum(polygon(rgb, p) for p in [
  [(.21,.33),(.21,.27),(.30,.19),(.43,.14),(.43,.30),(.39,.38),(.355,.40)],  # arm and shoulder
  [(.355,.40),(.42,.40),(.475,.44),(.585,.57),(.57,.58),(.50,.60),(.50,.66),(.40,.67),(.37,.55),(.335,.535),(.29,.515)],  # skirt plates and leg
  [(.54,.45),(.62,.46),(.62,.515),(.55,.515)],  # hand
  [(.165,.255),(.19,.255),(.71,.51),(.70,.545),(.165,.285)],  # shaft
  [(.455,.10),(.56,.10),(.56,.26),(.45,.26)],  # helmet
]).clip(0, 1)
pin = np.clip(soften(hard, 1, 2) * 1.6, 0, 1)
# Free ends move most; the cloth is still where it joins the body.
free = np.clip(np.where(x < .45, (.40 - x) / .14, np.where(y < .2, 1, (x - .56) / .05)), 0, 1)
free = np.where(y < .16, 1, free)
r = soften(cloth, 3, 2) * (1 - pin) * (.35 + .65 * free)
# Dust: the soft kicked-up paint behind and beside the foot. The leg and the foot are out.
leg = polygon(rgb, [(.36,.55),(.50,.60),(.555,.75),(.58,.87),(.48,.87),(.47,.77),(.41,.67),(.365,.67)])
dust = polygon(rgb, [(.20,.60),(.30,.60),(.37,.64),(.42,.70),(.47,.76),(.48,.83),(.40,.82),(.32,.77),(.22,.72)]) + polygon(rgb, [(.53,.62),(.575,.63),(.62,.72),(.60,.80),(.565,.82),(.55,.72)])
g = soften(dust.clip(0, 1), 0, 5) * (1 - soften(leg, 1, 2))
# Light: the blade, and the bright strokes of the charge behind the knight.
blade = polygon(rgb, [(.73,.533),(.785,.53),(.80,.54),(.94,.705),(.90,.692),(.75,.62),(.725,.60),(.71,.555)])
strokes = polygon(rgb, [(.11,.36),(.20,.36),(.34,.60),(.44,.74),(.38,.74),(.20,.60),(.11,.48)]) * (h > .06) * (h < .13) * (s > .45) * (v > .8) * (v - soften(v, 0, 5) > .025) * (1 - np.clip(soften(cloth, 1, 1) + leg, 0, 1))
b = np.maximum(soften(blade * (s < .72), 0, 1), soften(strokes, 0, 1) * 1.5)
save('strike', r, g, b)
