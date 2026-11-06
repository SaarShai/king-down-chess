import sys, os; sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from mask_lib import *
rgb = painting('salvation'); h, s, v = hsv(rgb)
H, W = v.shape
y, x = np.mgrid[0:H, 0:W].astype(np.float32); x = (x + .5) / W; y = (y + .5) / H
ramp = lambda a, b, u: np.clip((u - a) / (b - a), 0, 1)
# The near stones stand in front of the mist. Dark paint and cyan rims find their edges; a cut by polygon alone leaves a visible box. The far row is haze and stays under the mist.
ink = (v < .46) | (s > .62)
big_stone = polygon(rgb, [(.412,.578),(.45,.51),(.53,.483),(.60,.495),(.625,.505),(.722,.80),(.86,.84),(.875,.925),(.60,.93),(.50,.86),(.495,.82)])
near_cross = polygon(rgb, [(.31,.44),(.39,.44),(.40,.55),(.37,.55),(.37,.65),(.42,.75),(.44,.90),(.23,.90),(.27,.65),(.30,.64),(.30,.55),(.27,.54),(.27,.49)]) * ink
front_left = polygon(rgb, [(0,.72),(.12,.70),(.13,.64),(.24,.64),(.24,.70),(.35,.76),(.35,.87),(.29,.90),(.34,1),(0,1)]) * ink
right_cross = polygon(rgb, [(.79,.69),(.90,.67),(.91,.62),(.96,.63),(.96,.69),(1,.72),(1,.80),(.93,.82),(.89,.98),(.68,1),(.68,.93),(.83,.92),(.86,.80),(.80,.76)]) * ink
clear = 1 - soften(np.maximum.reduce([big_stone, near_cross, front_left, right_cross]), 1, .7)
# Mist and light blend toward near white, so dim paint takes less of them and every part gains about the same brightness.
even = np.clip(.2 / (1.02 - v), 0, 1)
# R: the ground mist. It rises off the ground, thickest low down, and thins before the sky.
behind = polygon(rgb, [(0,.62),(.10,.56),(.30,.42),(.45,.30),(.70,.20),(1,.22),(1,.92),(.84,.90),(.70,.96),(.30,.96),(0,.92)])
mist = soften(behind, 0, 9) * (.2 + .8 * ramp(.32, .72, y)) * clear * even
# G: the light. It swells from the glow at the stone's right foot, on the haze and, less, on the stone's lit face.
glow = np.clip(1 - np.hypot(x - .74, (y - .74) / .95) / .72, 0, 1)
lit_face = soften(polygon(rgb, [(.60,.53),(.632,.53),(.712,.79),(.575,.80)]) * ramp(.42, .62, v), 0, 1.5) * .6
light = glow * even * np.maximum(clear, lit_face)
save('salvation', mist, light)
