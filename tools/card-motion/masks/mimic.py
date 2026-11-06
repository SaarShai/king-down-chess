# R: cape (free at the torn wing and hem, zero on hood and body). G: moonlight (halo, moon, lit plain). B: clouds above y .5, horse shadow below.
import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('mimic'); h, s, v = hsv(rgb)
H, W = v.shape
y, x = np.mgrid[0:H, 0:W].astype(np.float32); x = (x + .5) / W; y = (y + .5) / H
def ramp(a, b, t):
    u = np.clip((t - a) / (b - a), 0, 1); return u * u * (3 - 2 * u)

# The figure, traced on the painted silhouette.
outline = [(.31,.36),(.295,.364),(.238,.362),(.19,.35),(.114,.343),(.062,.348),(.043,.364),(.09,.362),(.081,.395),(.124,.381),(.138,.398),(.129,.424),
  (.062,.45),(.10,.455),(.107,.474),(.10,.507),(.124,.493),(.145,.493),(.119,.545),(.176,.512),(.176,.531),(.195,.545),(.21,.531),(.252,.536),(.245,.564),
  (.264,.574),(.257,.602),(.286,.598),(.348,.583),(.39,.617),(.443,.607),(.471,.60),(.464,.555),(.476,.524),(.495,.521),(.495,.507),(.476,.44),(.46,.35),(.456,.285),(.447,.25),(.42,.195),(.40,.195),(.358,.25),(.348,.28),(.33,.31)]
figure = polygon(rgb, outline)

# Cape: weight grows with the distance from the still body. Left of a line from the shoulder to the feet the wing is free; the hem is free near the ground.
anchor = .31 + (y - .36) * .375
wing = ramp(0, .2, anchor - x)
hem = ramp(.5, .6, y) * .75
tip = ramp(.465, .495, x) * ramp(.49, .53, y) * .75
cape = soften(figure, 3, 3) * np.maximum(wing, np.maximum(hem, tip))

# Moon and its light.
moon_c = (.7214, .161); r = .131
dist = np.hypot(x - moon_c[0], y - moon_c[1])
disc = dist < r
mountain = soften(polygon(rgb, [(0,.12),(1,.12),(1,.5),(0,.5)]) * (h < .712) * (v < .9), 0, .7) > .4
hold = soften(figure, 1, 4)
halo = np.where(disc, .5, np.exp(-(dist - r) / .075)) * ramp(.3, .16, dist - r)
halo = soften(halo, 0, 1.5) * (1 - hold) * (1 - .6 * soften(mountain, 0, 2))
lit = polygon(rgb, [(.38,.46),(1,.46),(1,.74),(.38,.74)]) * (v > .62) * (h > .72) * (h < .86) * (1 - figure)
lit = soften(lit, 0, 1.5) * np.exp(-((x - .66) / .24) ** 2 - ((y - .55) / .11) ** 2)
light = np.maximum(halo, lit)

# Clouds: their paint keyed by colour, moved only clear of the mountains, the figure and the moon's free rim.
sky = polygon(rgb, [(0,0),(1,0),(1,.47),(0,.47)])
cloud = sky * (h > .70) * (h < .92) * (v > .52) * (s > .4) * (dist > r + .05)
cloud = np.maximum(cloud, sky * (h > .70) * (h < .92) * (v > .52) * (s > .4) * (y > .235) * (x < .74) * ~disc)
rim = disc & ~((x < .74) & (y > .24))
cloud = soften(cloud, 4, 4) * (1 - soften(mountain, 5, 4)) * (1 - soften(figure, 5, 4)) * (1 - soften(rim, 4, 3))

# Horse shadow: the mane's strands, and a faint weight on the barrel for its breath.
mane = polygon(rgb, [(.495,.665),(.52,.645),(.58,.622),(.63,.592),(.69,.568),(.75,.56),(.76,.60),(.70,.63),(.64,.665),(.60,.70),(.54,.705),(.495,.70)])
barrel = np.exp(-((x - .70) / .10) ** 2 - ((y - .67) / .085) ** 2)
horse = np.maximum(soften(mane, 2, 3), barrel * .7 * ramp(.62, .66, y))

blue = np.where(y < .5, cloud, horse)
save('mimic', cape, light, blue)
